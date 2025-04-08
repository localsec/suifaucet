const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const inquirer = require('inquirer');
const fs = require('fs');

// Đọc cấu hình từ config.json (nếu cần)
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Hàm sleep để tạo độ trễ
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm thực hiện yêu cầu faucet
async function requestFaucet(address) {
  const ora = (await import('ora')).default;
  const url = 'https://faucet.testnet.sui.io/gas'; // Endpoint thực tế
  const payload = {
    FixedAmountRequest: {
      recipient: address
    }
  };
  
  while (true) {
    const spinner = ora(`Đang gửi yêu cầu đến faucet...`).start();
    try {
      const response = await axios.post(url, payload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      spinner.succeed(chalk.green(`Thành công: ${JSON.stringify(response.data)}`));
    } catch (error) {
      spinner.fail(chalk.red(`Lỗi: ${error.message}`));
    }
    spinner.stop();
    console.log(chalk.yellow('Chờ 10 giây trước khi thử lại...'));
    await sleep(10000);
  }
}

// Hàm chính với CLI
async function main() {
  console.log(chalk.cyan.bold('Chào mừng đến với SUI Faucet Tool!'));

  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: chalk.yellow('Nhập địa chỉ ví SUI của bạn:'),
      validate: input => input.length > 0 || 'Địa chỉ không được để trống!',
    },
  ]);

  console.log(chalk.blue('Chuẩn bị gửi yêu cầu...'));
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(10, 0);
  for (let i = 0; i < 10; i++) {
    await sleep(100);
    bar.increment();
  }
  bar.stop();

  console.log(chalk.green('Bắt đầu thử faucet liên tục mỗi 10 giây...'));
  console.log(chalk.yellow('Nhấn Ctrl+C để dừng chương trình.'));

  await requestFaucet(address);
}

main().catch(error => {
  console.error(chalk.red(`Lỗi không xác định: ${error.message}`));
  process.exit(1);
});
