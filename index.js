const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const inquirer = require('inquirer');
const fs = require('fs');

// Đọc config (nếu có file config.json)
let config = {};
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
  console.log(chalk.yellow('Không tìm thấy file config.json — dùng config mặc định.'));
}

// Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Gửi RPC check số dư
async function requestRpc(address) {
  const ora = (await import('ora')).default;
  const url = 'https://fullnode.testnet.sui.io:443';
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'sui_getAllBalances', // Đã sửa method đúng
    params: [address]
  };

  const spinner = ora(`Đang kiểm tra số dư ví: ${address} ...`).start();

  try {
    const response = await axios.post(url, payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.error) {
      spinner.fail(chalk.red(`Lỗi RPC: ${JSON.stringify(response.data.error)}`));
      return false;
    }

    const balances = response.data.result;
    spinner.succeed(chalk.green(`Thành công!`));

    console.log(chalk.yellow('Số dư ví:'));
    if (balances && balances.coinTypeBalances) {
      balances.coinTypeBalances.forEach(coin => {
        console.log(chalk.cyan(`- Loại coin: ${coin.coinType}`));
        console.log(chalk.green(`  Số dư: ${coin.totalBalance}`));
      });
    } else {
      console.log(chalk.red('Ví không có số dư hoặc dữ liệu không xác định.'));
    }

    return true;

  } catch (error) {
    if (error.response && error.response.status === 429) {
      spinner.fail(chalk.red('Lỗi: Quá nhiều yêu cầu (429). Vui lòng chờ và thử lại sau.'));
    } else {
      spinner.fail(chalk.red(`Lỗi: ${error.message}`));
    }
    return false;
  }
}

// Main
async function main() {
  console.log(chalk.cyan.bold('====== SUI RPC Balance Checker ======'));

  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: chalk.yellow('Nhập địa chỉ ví SUI:'),
      validate: input => input.length > 0 || 'Địa chỉ không được để trống!',
    },
  ]);

  console.log(chalk.blue('Đang xử lý yêu cầu...'));
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(10, 0);
  for (let i = 0; i < 10; i++) {
    await sleep(100);
    bar.increment();
  }
  bar.stop();

  const success = await requestRpc(address);

  if (success) {
    console.log(chalk.green.bold('Đã hoàn thành kiểm tra số dư ví!'));
  } else {
    console.log(chalk.red.bold('Kiểm tra số dư thất bại.'));
  }
}

main().catch(error => {
  console.error(chalk.red(`Lỗi không xác định: ${error.message}`));
  process.exit(1);
});
