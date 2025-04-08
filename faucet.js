const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const fs = require('fs').promises; // Sử dụng fs promises cho async/await

// Configuration
const config = {
    faucetUrl: 'https://faucet.testnet.sui.io/gas',
    interval: 10 * 1000, // 10 seconds
    maxRetries: 3,
    retryDelay: 2000 // 2 seconds
};

// Hàm đọc và parse file text
async function loadWallets() {
    const data = await fs.readFile('wallets.txt', 'utf8');
    return data.trim().split('\n').filter(line => line.trim());
}

async function loadProxies() {
    const data = await fs.readFile('proxies.txt', 'utf8');
    return data.trim().split('\n').filter(line => line.trim()).map(line => {
        const [host, port, username, password] = line.split(':');
        const proxy = { host, port: parseInt(port) };
        if (username && password) {
            proxy.auth = { username, password };
        }
        return proxy;
    });
}

// Hàm chọn proxy ngẫu nhiên
function getRandomProxy(proxyList) {
    return proxyList[Math.floor(Math.random() * proxyList.length)];
}

// Hàm tạo axios instance với proxy
function createAxiosInstance(proxy) {
    const proxyUrl = proxy.auth 
        ? `http://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`
        : `http://${proxy.host}:${proxy.port}`;
    
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    return axios.create({
        httpsAgent: proxyAgent,
        proxy: false,
        timeout: 10000
    });
}

// Hàm delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Hàm claim chính
async function claimFaucet(walletAddress, proxyList) {
    const proxy = getRandomProxy(proxyList);
    let attempts = 0;
    const timestamp = new Date().toISOString();

    while (attempts < config.maxRetries) {
        try {
            const axiosInstance = createAxiosInstance(proxy);
            const response = await axiosInstance.post(config.faucetUrl, { 
                recipient: walletAddress 
            });

            if (response.status === 200) {
                console.log(`[${timestamp}] Success via ${proxy.host}:${proxy.port} - Attempt ${attempts + 1}`, response.data);
                return true;
            } else {
                console.log(`[${timestamp}] Failed via ${proxy.host}:${proxy.port} - Status: ${response.status}`);
                return false;
            }
        } catch (error) {
            attempts++;
            const errorMsg = `[${timestamp}] Error via ${proxy.host}:${proxy.port} - Attempt ${attempts}: ${error.message}`;
            console.error(errorMsg);

            if (attempts < config.maxRetries) {
                console.log(`[${timestamp}] Retrying in ${config.retryDelay/1000}s...`);
                await delay(config.retryDelay);
            } else {
                console.error(`[${timestamp}] Max retries reached for ${proxy.host}:${proxy.port}`);
                return false;
            }
        }
    }
}

// Hàm chạy chính
async function startClaiming() {
    try {
        const wallets = await loadWallets();
        const proxyList = await loadProxies();

        // Validate
        if (wallets.length === 0 || !wallets[0].startsWith('0x')) {
            console.error('No valid wallet addresses found in wallets.txt');
            return;
        }

        if (proxyList.length === 0) {
            console.error('No proxies found in proxies.txt');
            return;
        }

        const walletAddress = wallets[0]; // Hiện tại chỉ dùng wallet đầu tiên
        console.log(`[${new Date().toISOString()}] Starting faucet claim for ${walletAddress}`);

        setInterval(async () => {
            await claimFaucet(walletAddress, proxyList);
        }, config.interval);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error loading files:`, error.message);
    }
}

// Xử lý lỗi chưa bắt được và chạy chương trình
process.on('unhandledRejection', (error) => {
    console.error(`[${new Date().toISOString()}] Unhandled error:`, error.message);
});

startClaiming();
