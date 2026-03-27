import { readdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const home = homedir();
const candidates = [
  join(home, '.netlify'),
  join(home, 'AppData', 'Roaming', 'netlify'),
  join(home, 'AppData', 'Local', 'netlify'),
  join(home, 'AppData', 'Roaming', 'Netlify'),
];

for (const c of candidates) {
  if (existsSync(c)) {
    console.log('Found:', c);
    console.log(readdirSync(c));
  }
}

// Also try reading the token from netlify config
try {
  const { execSync } = await import('child_process');
  const out = execSync('netlify api listSites --data "{}" 2>&1', { encoding: 'utf8' });
  console.log('API works');
} catch(e) {
  // ignore
}
