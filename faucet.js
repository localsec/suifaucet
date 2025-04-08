const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

// ===== Banner LOCAL SEC =====

console.log(chalk.green.bold(`Auto Sui Faucet by LOCAL SEC\n`));

// ===== Config =====
const faucetUrl = 'https://faucet.testnet.sui.io/gas';
const minDelayMs = 10_000;  
const maxDelayMs = 30_000;  

// Load Wallets
const wallets = fs.readFileSync(path.join(__dirname, 'wallets.txt'), 'utf-8')
    .split('\n')
    .map(x => x.trim())
    .filter(x => x);

// Load Proxies
const proxies = fs.readFileSync(path.join(__dirname, 'proxies.txt'), 'utf-8')
    .split('\n')
    .map(x => x.trim())
    .filter(x => x);

console.log(chalk.yellow(`Loaded ${wallets.length} wallets.`));
console.log(chalk.yellow(`Loaded ${proxies.length} proxies.`));

// ===== Utils =====
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomProxy = () => proxies[Math.floor(Math.random() * proxies.length)];

// ===== Claim Faucet =====
async function claimFaucet(address) {
    const proxy = randomProxy();
    const agent = proxy ? HttpsProxyAgent(proxy) : undefined;

    try {
        const res = await axios.post(faucetUrl, { recipient: address }, {
            httpsAgent: agent,
            proxy: false
        });

        if (res.status === 200) {
            console.log(chalk.green(`[${new Date().toISOString()}] ✅ Claimed for ${address} using proxy ${proxy}`));
        } else {
            console.log(chalk.red(`[${new Date().toISOString()}] ❌ Failed ${address} Status ${res.status}`));
        }
    } catch (err) {
        console.log(chalk.red(`[${new Date().toISOString()}] ❌ Error ${address} | Proxy: ${proxy} | ${err.message}`));
    }
}

// ===== Main Loop =====
async function main() {
    while (true) {
        for (const address of wallets) {
            await claimFaucet(address);
            const delay = randomDelay(minDelayMs, maxDelayMs);
            console.log(chalk.cyan(`Sleeping ${delay / 1000}s...\n`));
            await sleep(delay);
        }
    }
}

main();
