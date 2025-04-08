const axios = require('axios');
const fs = require('fs');
const path = require('path');

// CONFIG
const faucetUrl = 'https://faucet.testnet.sui.io/gas';
const minDelayMs = 10_000;  // Delay nhỏ nhất 10 giây
const maxDelayMs = 30_000;  // Delay lớn nhất 30 giây

// Load danh sách ví từ file wallets.txt
const walletsPath = path.join(__dirname, 'wallets.txt');
const wallets = fs.readFileSync(walletsPath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

console.log(`Loaded ${wallets.length} wallets.`);

// Hàm delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm random delay
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Hàm claim faucet
async function claimFaucet(address) {
    try {
        const res = await axios.post(faucetUrl, { recipient: address });

        if (res.status === 200) {
            console.log(`[${new Date().toISOString()}] ✅ Success claim for ${address}`);
        } else {
            console.log(`[${new Date().toISOString()}] ❌ Failed claim for ${address} - Status: ${res.status}`);
        }
    } catch (err) {
        if (err.response && err.response.status === 429) {
            console.log(`[${new Date().toISOString()}] ⚠️ Rate limit 429 for ${address}`);
        } else {
            console.log(`[${new Date().toISOString()}] ❌ Error claim for ${address} - ${err.message}`);
        }
    }
}

// Auto loop claim tất cả ví
async function startFaucet() {
    while (true) {
        for (const address of wallets) {
            await claimFaucet(address);

            const delay = randomDelay(minDelayMs, maxDelayMs);
            console.log(`Sleeping ${delay / 1000}s...`);
            await sleep(delay);
        }
    }
}

startFaucet();
