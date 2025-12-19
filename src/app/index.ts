import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { DerivBot } from './DeriveBot'

// This function works in both ESM and CommonJS
function getCurrentDir(metaUrl?: string): string {
  // Try CommonJS first
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  // Try ESM with import.meta.url
  if (metaUrl) {
    return path.dirname(fileURLToPath(metaUrl));
  }

  // Fallback: use caller's stack trace (less reliable)
  try {
    const stack = new Error().stack;
    const lines = stack?.split('\n') || [];
    // Find the caller file path
    for (const line of lines) {
      const match = line.match(/\((.*):\d+:\d+\)/);
      if (match && !match[1].includes('node_modules')) {
        return path.dirname(match[1]);
      }
    }
  } catch {
    // Last resort
    return process.cwd();
  }

  return process.cwd();
}

// For the current module, export pre-computed value
export const CURRENT_DIR = getCurrentDir(
  // @ts-ignore - import.meta.url only exists in ESM
  typeof import.meta !== 'undefined' ? import.meta.url : undefined
);

const app = express();

const tradeInit = async () => {

  const bot = new DerivBot("111480");
  await bot.initialize("a1-FJohpnzUoPlAWtkbNMEyKT0wHmo7u");
  await bot.startTickAnalysis('R_100');
  await bot.trade();

  await tradeInit();

}

// Home route - HTML
app.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Express on Vercel</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/api-data">API Data</a>
          <a href="/healthz">Health</a>
          <a href="/trade">Trade</a>
        </nav>
        <h1>Welcome to Express on Vercel 🚀</h1>
        <p>This is a minimal example without a database or forms.</p>
        <img src="/logo.png" alt="Logo" width="120" />
      </body>
    </html>
  `)
})

app.get('/about', function (req, res) {
  res.sendFile(path.join(CURRENT_DIR, '..', 'components', 'about.htm'))
})

// Example API endpoint - JSON
app.get('/api-data', (req, res) => {
  res.json({
    message: 'Here is some sample API data',
    items: ['apple', 'banana', 'cherry'],
  })
})

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Health check
app.get('/trade', async (req, res) => {
  await tradeInit();
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app
