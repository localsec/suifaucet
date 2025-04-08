const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// ===== Banner LocalSec =====
console.log(chalk.green.bold(`Auto Sui Faucet by LocalSec\n`));

// ===== Config =====
const faucetUrl = 'https://faucet.testnet.sui.io/gas';
const minDelayMs = 10_000;  // 10s
const maxDelayMs = 30_000;  // 30s

const walletsPath = path.join(__dirname, 'wallets.txt');
const wallets = fs.readFileSync(walletsPath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

console.log(chalk.yellow(`Loaded ${wallets.length} wallets.`));

// ===== Utility =====
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// ===== Claim Faucet =====
async function claimFaucet(address) {
    try {
        const res = await axios.post(faucetUrl, { recipient: address });

        if (res.status === 200) {
            console.log(chalk.green(`[${new Date().toISOString()}] ✅ Success claim for ${address}`));
        } else {
            console.log(chalk.red(`[${new Date().toISOString()}] ❌ Failed claim for ${address} - Status: ${res.status}`));
        }
    } catch (err) {
        if (err.response && err.response.status === 429) {
            console.log(chalk.yellow(`[${new Date().toISOString()}] ⚠️ Rate limit 429 for ${address}`));
        } else {
            console.log(chalk.red(`[${new Date().toISOString()}] ❌ Error claim for ${address} - ${err.message}`));
        }
    }
}

// ===== Main Loop =====
async function startFaucet() {
    while (true) {
        for (const address of wallets) {
            await claimFaucet(address);

            const delay = randomDelay(minDelayMs, maxDelayMs);
            console.log(chalk.cyan(`Sleeping ${delay / 1000}s...\n`));
            await sleep(delay);
        }
    }
}

startFaucet();
