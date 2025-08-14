import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import GitHubStrategy from 'passport-github2';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'https://test-case-generator-six.vercel.app',
    'http://localhost:3000', // for local development
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' })); // Increase payload limit
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
  }),
  cookie: {
    // domain: '.onrender.com', // REMOVE OR COMMENT OUT THIS LINE
    sameSite: 'none',
    secure: true,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

// Add this middleware after passport setup and before your routes:
app.use((req, res, next) => {
  console.log('--- Request Debug Info ---');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  console.log('User:', req.user);
  console.log('Is Authenticated:', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
  console.log('Headers:', {
    cookie: req.headers.cookie,
    'user-agent': req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer
  });
  console.log('--- End Debug Info ---');
  next();
});


// Add this endpoint to check MongoDB connection status
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'OK',
    mongodb: statusMap[mongoStatus] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Add this temporary debug endpoint to test cookie setting
app.get('/debug/set-cookie', (req, res) => {
  res.cookie('test-cookie', 'test-value', {
    sameSite: 'none',
    secure: true,
    httpOnly: false,
    maxAge: 60000, // 1 minute
  });
  
  res.json({
    message: 'Test cookie set',
    headers: req.headers,
    sessionID: req.sessionID,
    session: req.session,
  });
});

// Test if cookie is received
app.get('/debug/check-cookie', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    sessionID: req.sessionID,
    user: req.user,
  });
});

app.get('/auth/github', passport.authenticate('github', { scope: ['repo'] }));

app.get('/auth/github/callback', passport.authenticate('github', {
  failureRedirect: '/',
}), (req, res) => {
  console.log('GitHub OAuth callback, req.user:', req.user);
  console.log('Session:', req.session);
  // Redirect to frontend with a flag
  res.redirect(`${process.env.FRONTEND_URL}?loggedin=true`);
});

app.get('/api/github/user', (req, res) => {
  console.log('GET /api/github/user, req.user:', req.user);
  console.log('Session:', req.session);
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.user });
});


import { getUserRepos, getRepoFiles, getFileContent } from './github.js';

// Middleware to ensure authentication
function ensureAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// Get user repos
app.get('/api/github/repos', ensureAuth, async (req, res) => {
  try {
    const repos = await getUserRepos(req.user.accessToken);
    res.json(repos.map(r => ({ id: r.id, name: r.name, owner: r.owner.login })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});

// Get files in repo
app.get('/api/github/files', ensureAuth, async (req, res) => {
  const { repo } = req.query;
  const owner = req.user.username;
  try {
    const files = await getRepoFiles(req.user.accessToken, owner, repo);
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file content
app.get('/api/github/file-content', ensureAuth, async (req, res) => {
  const { repo, path } = req.query;
  const owner = req.user.username;
  try {
    const content = await getFileContent(req.user.accessToken, owner, repo, path);
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch file content' });
  }
});

// AI API integration (Gemini, OpenAI, etc.)
// Uses AI_API_KEY from .env
app.post('/api/ai/summaries', ensureAuth, async (req, res) => {
  const { files } = req.body; // [{ filename, content }]
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
    console.log('Gemini API response data:', JSON.stringify(result.data, null, 2));
    
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

app.post('/api/ai/testcode', ensureAuth, async (req, res) => {
  const { summary } = req.body;
  try {
    const prompt = `Given the selected summary, generate the full test code using JUnit, Selenium, or an appropriate framework.\n${summary}`;
    const result = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      { contents: [{ parts: [{ text: prompt }] }] },
      { params: { key: process.env.AI_API_KEY } }
    );
    const code = result.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ code });
  } catch (e) {
    res.status(500).json({ error: 'AI API error', details: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
