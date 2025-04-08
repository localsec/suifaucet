const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const inquirer = require('inquirer');
const fs = require('fs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function requestRpc(address) {
  const ora = (await import('ora')).default;
  const url = 'https://fullnode.testnet.sui.io:443';
  
  const spinner = ora(`Đang kiểm tra số dư ví: ${address} ...`).start();

  try {
    // Ưu tiên method sui_getAllBalances
    let payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'sui_getAllBalances',
      params: [address]
    };

    let response = await axios.post(url, payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    // Nếu không hỗ trợ method => thử lại với sui_getBalance
    if (response.data.error && response.data.error.code === -32601) {
      spinner.warn(chalk.yellow('RPC không hỗ trợ method sui_getAllBalances => Thử lại với sui_getBalance'));
      payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getBalance',
        params: [address, "0x2::sui::SUI"]
      };
      response = await axios.post(url, payload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (response.data.error) {
      spinner.fail(chalk.red(`Lỗi RPC: ${JSON.stringify(response.data.error)}`));
      return false;
    }

    spinner.succeed(chalk.green(`Lấy số dư thành công!`));
    console.log(chalk.yellow('Số dư ví:'));

    if (response.data.result.totalBalance) {
      console.log(chalk.green(`Số dư SUI: ${response.data.result.totalBalance}`));
    } else if (response.data.result.coinTypeBalances) {
      response.data.result.coinTypeBalances.forEach(coin => {
        console.log(chalk.cyan(`- Loại coin: ${coin.coinType}`));
        console.log(chalk.green(`  Số dư: ${coin.totalBalance}`));
      });
    } else {
      console.log(chalk.red('Không có số dư hoặc dữ liệu không xác định.'));
    }

    return true;

  } catch (error) {
    spinner.fail(chalk.red(`Lỗi: ${error.message}`));
    return false;
  }
}

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
