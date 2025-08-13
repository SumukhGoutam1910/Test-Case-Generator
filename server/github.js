import axios from 'axios';

export async function getUserRepos(accessToken) {
  const res = await axios.get('https://api.github.com/user/repos', {
    headers: { Authorization: `token ${accessToken}` },
    params: { per_page: 100 },
  });
  return res.data;
}

export async function getRepoFiles(accessToken, owner, repo) {
  const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
    headers: { Authorization: `token ${accessToken}` },
  });
  // Only code files (js, py, java, etc)
  return res.data.tree.filter(f => /\.(js|ts|py|java|cpp|c|cs|rb|go|php)$/.test(f.path)).map(f => f.path);
}

export async function getFileContent(accessToken, owner, repo, path) {
  const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${accessToken}` },
  });
  return Buffer.from(res.data.content, 'base64').toString('utf-8');
}
