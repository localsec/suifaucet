const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');

// Hàm sleep delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm gọi Faucet
async function faucetRequest(axiosInstance, recipient) {
    try {
        const response = await axiosInstance.post(
            'https://faucet.testnet.sui.io/v1/gas',
            {
                FixedAmountRequest: {
                    recipient,
                },
            },
            { timeout: 10000 }
        );

        if (!response.data.error) {
            console.log(chalk.green(`<=== Faucet thành công cho ví: ${recipient} ===>\n`));
            return true;
        } else {
            console.log(chalk.red('Faucet thất bại:'), response.data.error, '\n');
            return false;
        }
    } catch (error) {
        console.log(chalk.red('Faucet thất bại:'), error.response?.data || error.message, '\n');
        return false;
    }
}

// Giao diện CLI
async function main() {
    console.log(chalk.cyan.bold('====== AUTO SUI FAUCET TOOL ======'));

    const { address } = await inquirer.prompt([
        {
            type: 'input',
            name: 'address',
            message: chalk.yellow('Nhập địa chỉ ví SUI muốn spam faucet:'),
            validate: input => input.length > 0 || 'Địa chỉ không được để trống!',
        },
    ]);

    const axiosInstance = axios.create({
        headers: {
            'Content-Type': 'application/json'
        }
    });

    let count = 0;
    while (true) {
        count++;
        console.log(chalk.blue(`Lần faucet thứ ${count} cho ví: ${address}`));

        await faucetRequest(axiosInstance, address);

        console.log(chalk.yellow(`Đang chờ 10 giây trước khi faucet tiếp...\n`));
        await sleep(10000); // Delay 10 giây
    }
}

main().catch(error => {
    console.error(chalk.red(`Lỗi không xác định: ${error.message}`));
    process.exit(1);
});
