import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OWNER = 'LvienOeria';
const TOKEN = process.env.GITHUB_TOKEN || '';
const HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};
if (TOKEN) HEADERS.Authorization = `Bearer ${TOKEN}`;

const API = 'https://api.github.com';

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  return res.json();
}

async function fetchAllRepos() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const data = await fetchJson(
      `${API}/users/${OWNER}/repos?per_page=100&page=${page}&sort=updated`
    );
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

const [user, repos] = await Promise.all([
  fetchJson(`${API}/users/${OWNER}`),
  fetchAllRepos(),
]);

const data = {
  updatedAt: new Date().toISOString(),
  user: {
    login: user.login,
    public_repos: user.public_repos,
    created_at: user.created_at,
    followers: user.followers,
  },
  repos: repos.map((r) => ({
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    fork: r.fork,
    language: r.language,
    stargazers_count: r.stargazers_count,
    pushed_at: r.pushed_at,
    updated_at: r.updated_at,
    created_at: r.created_at,
  })),
};

const outputPath = resolve(process.cwd(), 'data.json');
writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Updated data.json at ${outputPath}`);
console.log(`  public repos: ${user.public_repos}`);
console.log(`  repos cached: ${repos.length}`);
