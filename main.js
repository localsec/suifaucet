const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const inquirer = require('inquirer');
const fs = require('fs');

// Đọc cấu hình từ config.json (nếu cần)
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Hàm sleep để tạo độ trễ
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm thực hiện yêu cầu faucet (hoặc RPC)
async function requestFaucet(address) {
  const ora = (await import('ora')).default;
  const url = 'https://fullnode.testnet.sui.io:443'; // RPC URL mới
  const payload = {
    FixedAmountRequest: {
      recipient: address
    }
  };
  
  const spinner = ora(`Đang gửi yêu cầu đến RPC...`).start();
  try {
    const response = await axios.post(url, payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    spinner.succeed(chalk.green(`Thành công: ${JSON.stringify(response.data)}`));
    return true;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      spinner.fail(chalk.red('Lỗi: Quá nhiều yêu cầu (429). Vui lòng chờ 1-24 giờ trước khi thử lại.'));
    } else {
      spinner.fail(chalk.red(`Lỗi: ${error.message}`));
    }
    return false;
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

  const success = await requestFaucet(address);

  if (success) {
    console.log(chalk.green.bold('Hoàn tất! Kiểm tra ví của bạn.'));
  } else {
    console.log(chalk.red.bold('Không thể hoàn thành yêu cầu.'));
  }
}

main().catch(error => {
  console.error(chalk.red(`Lỗi không xác định: ${error.message}`));
  process.exit(1);
});
