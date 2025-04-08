const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Config
const faucetUrl = 'https://faucet.testnet.sui.io/gas'; // API Faucet Sui Testnet
const delayMs = 10 * 1000; // 10 giây

// Load ví từ file
const walletsPath = path.join(__dirname, 'wallets.txt');
const wallets = fs.readFileSync(walletsPath, 'utf-8')
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line !== '');

console.log(`Loaded ${wallets.length} wallets.`);

// Hàm delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Claim faucet cho 1 ví
async function claimFaucet(address) {
    try {
        const res = await axios.post(faucetUrl, { recipient: address });
        if (res.status === 200) {
            console.log(`[${new Date().toISOString()}] Success claim for ${address}`);
        } else {
            console.log(`[${new Date().toISOString()}] Failed claim for ${address} - Status: ${res.status}`);
        }
    } catch (err) {
        console.log(`[${new Date().toISOString()}] Error claim for ${address} - ${err.message}`);
    }
}

// Auto run loop
async function startFaucet() {
    while (true) {
        for (const address of wallets) {
            await claimFaucet(address);
            await sleep(delayMs);
        }
    }
}

startFaucet();
