const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const winston = require('winston');

const FAUCET_URL = 'https://faucet.testnet.sui.io/gas';
const ADDRESS = '0xYOUR_WALLET_ADDRESS'; // sửa ví của bạn ở đây
const PROXY = 'http://username:password@ip:port'; // proxy nếu có, không có để null

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'faucet.log' }),
  ],
});

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function claimFaucet(proxy) {
  try {
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    const res = await fetch(FAUCET_URL, {
      method: 'POST',
      agent,
      body: JSON.stringify({ recipient: ADDRESS }),
      headers: { 'Content-Type': 'application/json' },
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
    await claimFaucet(PROXY);
    const wait = 10_000 + Math.floor(Math.random() * 5000);
    logger.info(`Waiting ${wait
