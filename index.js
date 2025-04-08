const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const cliProgress = require('cli-progress');

// Hàm ngủ delay
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
            console.log(chalk.green('<================== Faucet thành công ==================>\n'));
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

// Giao diện chính CLI
async function main() {
    console.log(chalk.cyan.bold('====== SUI FAUCET TOOL ======'));

    const { address } = await inquirer.prompt([
        {
            type: 'input',
            name: 'address',
            message: chalk.yellow('Nhập địa chỉ ví SUI muốn nhận token faucet:'),
            validate: input => input.length > 0 || 'Địa chỉ không được để trống!',
        },
    ]);

    const axiosInstance = axios.create({
        headers: {
            'Content-Type': 'application/json'
        }
    });

    console.log(chalk.blue('Đang gửi yêu cầu đến Faucet...'));

    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(10, 0);
    for (let i = 0; i < 10; i++) {
        await sleep(100);
        bar.increment();
    }
    bar.stop();

    const success = await faucetRequest(axiosInstance, address);

    if (success) {
        console.log(chalk.green.bold('Đã gửi yêu cầu Faucet thành công! Kiểm tra ví của bạn nhé.'));
    } else {
        console.log(chalk.red.bold('Gửi yêu cầu Faucet thất bại. Vui lòng thử lại sau.'));
    }
}

main().catch(error => {
    console.error(chalk.red(`Lỗi không xác định: ${error.message}`));
    process.exit(1);
});
