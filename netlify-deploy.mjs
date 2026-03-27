import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const configPath = join(homedir(), 'AppData', 'Roaming', 'netlify', 'Config', 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const token = Object.values(config.users)[0]?.auth?.token;
const siteId = '6f27d880-89da-43bd-aa10-14dadaae9cd0';
const apiKey = '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';

// Set OPENROUTER_API_KEY env var on the site
const envRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/env`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify([{
    key: 'OPENROUTER_API_KEY',
    scopes: ['builds', 'functions', 'runtime'],
    values: [{ context: 'all', value: apiKey }],
  }]),
});

const envData = await envRes.json();
if (envRes.ok) {
  console.log('ENV: OPENROUTER_API_KEY set');
} else {
  console.log('ENV response:', JSON.stringify(envData));
}

console.log('Done. Now run: netlify deploy --build --prod --site 6f27d880-89da-43bd-aa10-14dadaae9cd0');
