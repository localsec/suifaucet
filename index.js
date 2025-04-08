const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');

// Hàm sleep delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load proxy từ file
const loadProxies = () => {
    const proxies = fs.readFileSync('proxy.txt', 'utf8')
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    return proxies;
};

// Tạo instance axios có proxy
const createAxiosWithProxy = (proxy) => {
    const proxyUrl = proxy.includes('@') ? `http://${proxy}` : `http://${proxy}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    return axios.create({
        httpsAgent: agent,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
    });
};

// Hàm gửi Faucet Request
async function faucetRequest(axiosInstance, recipient, proxy) {
    try {
        const response = await axiosInstance.post(
            'https://faucet.testnet.sui.io/v1/gas',
            {
                FixedAmountRequest: {
                    recipient,
                },
            }
        );

        if (!response.data.error) {
            console.log(chalk.green(`<=== Faucet thành công cho ví: ${recipient} [Proxy: ${proxy}] ===>\n`));
            return true;
        } else {
            console.log(chalk.red('Faucet thất bại:'), response.data.error, '\n');
            return false;
        }
    } catch (error) {
        console.log(chalk.red(`Faucet thất bại qua proxy: ${proxy}`), error.response?.data || error.message, '\n');
        return false;
    }
}

// Hàm chính
async function main() {
    console.log(chalk.cyan.bold('====== AUTO SUI FAUCET TOOL - PROXY MODE ======'));

    const { address } = await inquirer.prompt([
        {
            type: 'input',
            name: 'address',
            message: chalk.yellow('Nhập địa chỉ ví SUI muốn spam faucet:'),
            validate: input => input.length > 0 || 'Địa chỉ không được để trống!',
        },
    ]);

    const proxies = loadProxies();
    if (proxies.length === 0) {
        console.log(chalk.red('Không tìm thấy proxy trong proxy.txt'));
        process.exit(1);
    }

    let count = 0;
    while (true) {
        count++;

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const axiosInstance = createAxiosWithProxy(proxy);

        console.log(chalk.blue(`Lần faucet thứ ${count} cho ví: ${address}`));

        await faucetRequest(axiosInstance, address, proxy);

        console.log(chalk.yellow(`Đang chờ 10 giây trước khi faucet tiếp...\n`));
        await sleep(10000);
    }
}

main().catch(error => {
    console.error(chalk.red(`Lỗi không xác định: ${error.message}`));
    process.exit(1);
});
