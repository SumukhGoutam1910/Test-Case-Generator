import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import GitHubStrategy from 'passport-github2';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import { getUserRepos, getRepoFiles, getFileContent } from './github.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://test-case-generator-six.vercel.app',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Passport setup (minimal, no session)
app.use(passport.initialize());

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

// JWT middleware to verify token
function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.query.token || 
                req.headers['x-auth-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Debug middleware (optional, remove in production)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.headers.authorization) {
    console.log('Authorization header present');
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GitHub OAuth routes
app.get('/auth/github', passport.authenticate('github', { scope: ['repo'] }));

app.get('/auth/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false, failureRedirect: '/' }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(process.env.FRONTEND_URL);
    }
    console.log('GitHub OAuth callback successful');
    // Create JWT token with user data
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username || user._json.login,
        accessToken: user.accessToken,
        profileUrl: user.profileUrl,
        avatarUrl: user.photos?.[0]?.value
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Generated JWT token for user:', user.username || user._json.login);
    // Redirect to frontend with token
    return res.redirect(`${process.env.FRONTEND_URL}?token=${token}&loggedin=true`);
  })(req, res, next);
});

// Protected API routes
app.get('/api/github/user', verifyJWT, (req, res) => {
  console.log('GET /api/github/user - authenticated user:', req.user.username);
  res.json({ user: req.user });
});

app.get('/api/github/repos', verifyJWT, async (req, res) => {
  try {
    console.log('Fetching repos for user:', req.user.username);
    const repos = await getUserRepos(req.user.accessToken);
    res.json(repos.map(r => ({ id: r.id, name: r.name, owner: r.owner.login })));
  } catch (e) {
    console.error('Repos fetch error:', e.message);
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});

app.get('/api/github/files', verifyJWT, async (req, res) => {
  const { repo } = req.query;
  const owner = req.user.username;
  try {
    console.log(`Fetching files for ${owner}/${repo}`);
    const files = await getRepoFiles(req.user.accessToken, owner, repo);
    res.json(files);
  } catch (e) {
    console.error('Files fetch error:', e.message);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.get('/api/github/file-content', verifyJWT, async (req, res) => {
  const { repo, path } = req.query;
  const owner = req.user.username;
  try {
    console.log(`Fetching content for ${owner}/${repo}/${path}`);
    const content = await getFileContent(req.user.accessToken, owner, repo, path);
    res.json({ content });
  } catch (e) {
    console.error('File content fetch error:', e.message);
    res.status(500).json({ error: 'Failed to fetch file content' });
  }
});

// AI API routes
app.post('/api/ai/summaries', verifyJWT, async (req, res) => {
  const { files } = req.body;
  console.log('AI summaries request received:', { filesCount: files?.length });
  
  try {
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    if (!process.env.AI_API_KEY) {
      console.error('AI_API_KEY not found in environment');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const prompt = `You are a test automation expert. Given the following source code, generate a list of possible unit test cases with brief summaries.\n\n${files.map(f => `File: ${f.filename}\n${f.content}`).join('\n\n')}`;
    
    console.log('Sending request to Gemini API...');
    const result = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      { params: { key: process.env.AI_API_KEY } }
    );
    
    console.log('Gemini API response status:', result.status);
    const summaries = result.data.candidates?.[0]?.content?.parts?.[0]?.text?.split('\n').filter(line => line.trim()) || [];
    console.log('Extracted summaries:', summaries.length, 'items');
    
    res.json({ summaries });
  } catch (e) {
    console.error('AI API error details:', {
      message: e.message,
      status: e.response?.status,
      statusText: e.response?.statusText,
      data: e.response?.data
    });
    res.status(500).json({ 
      error: 'AI API error', 
      details: e.response?.data?.error?.message || e.message 
    });
  }
});

app.post('/api/ai/testcode', verifyJWT, async (req, res) => {
  const { summary } = req.body;
  try {
    console.log('Generating test code for summary');
    const prompt = `Given the selected summary, generate the full test code using JUnit, Selenium, or an appropriate framework.\n${summary}`;
    const result = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      { params: { key: process.env.AI_API_KEY } }
    );
    const code = result.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ code });
  } catch (e) {
    console.error('Test code generation error:', e.message);
    res.status(500).json({ error: 'AI API error', details: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));