const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const winston = require('winston');
const fs = require('fs');

// Config
const ADDRESS = '0xYourWalletAddressHere';  // Thay ví vào đây
const FAUCET_URL = 'https://faucet.testnet.sui.io/gas'; // Link faucet API
const DELAY = 10 * 1000; // Delay mỗi lần claim (ms)

// Proxy list
const proxies = fs.readFileSync('proxies.txt', 'utf-8')
  .split('\n')
  .filter(Boolean);

// User-Agent list (random cho đẹp)
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (X11; Linux x86_64)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
];

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'faucet.log' }),
  ],
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimFaucet(proxy) {
  try {
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const res = await fetch(FAUCET_URL, {
      method: 'POST',
      agent,
      body: JSON.stringify({ recipient: ADDRESS }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(`Faucet Error: ${data.error}`);
    }

    logger.info(`Claim success: ${JSON.stringify(data)}`);
  } catch (err) {
    logger.error(`Claim failed: ${err.message}`);
  }
}

async function main() {
  while (true) {
    const proxy = proxies.length > 0
      ? proxies[Math.floor(Math.random() * proxies.length)]
      : undefined;

    logger.info(`Claiming faucet with proxy: ${proxy || 'No Proxy'}`);
    await claimFaucet(proxy);
    await sleep(DELAY);
  }
}

main();
