import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Read the Netlify token from CLI config
const configPath = join(homedir(), 'AppData', 'Roaming', 'netlify', 'Config', 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const token = Object.values(config.users)[0]?.auth?.token;

if (!token) {
  console.error('No Netlify token found. Run: netlify login');
  process.exit(1);
}

const res = await fetch('https://api.netlify.com/api/v1/sites', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'homework-helper-hugo' }),
});

const site = await res.json();
if (site.id) {
  console.log('SITE_ID=' + site.id);
  console.log('SITE_URL=' + site.ssl_url);
} else {
  console.error(JSON.stringify(site));
  process.exit(1);
}
