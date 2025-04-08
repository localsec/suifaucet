const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');

// Đọc cấu hình từ config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const DELAY_MIN = config.delayMin;
const DELAY_MAX = config.delayMax;
const RETRY_COUNT = config.retryCount;
const RETRY_DELAY = config.retryDelay;

// Hàm sleep để tạo độ trễ
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm thực hiện yêu cầu faucet với retry
async function requestFaucet(address) {
  const url = 'https://api.example.com/faucet'; // Thay bằng URL thực tế của SUI Faucet
  const payload = { address };
  const spinner = ora(`Đang gửi yêu cầu đến faucet...`).start();

  for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
    try {
      spinner.text = `Đang gửi yêu cầu đến faucet... (Lần thử ${attempt + 1})`;
      await sleep(Math.random() * (DELAY_MAX - DELAY_MIN) + DELAY_MIN); // Độ trễ ngẫu nhiên
      const response = await axios.post(url, payload, { timeout: 10000 });
      spinner.succeed(chalk.green(`Thành công: ${JSON.stringify(response.data)}`));
      return true;
    } catch (error) {
      spinner.fail(chalk.red(`Lỗi: ${error.message}`));
      if (attempt < RETRY_COUNT) {
        spinner.start(chalk.yellow(`Thử lại sau ${RETRY_DELAY / 1000} giây...`));
        await sleep(RETRY_DELAY);
      } else {
        spinner.fail(chalk.red('Đã hết số lần thử. Thất bại.'));
        return false;
      }
    }
  }
}

// Hàm chính với CLI
async function main() {
  console.log(chalk.cyan.bold('Chào mừng đến với SUI Faucet Tool!'));

  // Prompt tương tác để nhập địa chỉ
  const { address } = await inquirer.prompt([
    {
      type: 'input',
      name: 'address',
      message: chalk.yellow('Nhập địa chỉ ví SUI của bạn:'),
      validate: input => input.length > 0 || 'Địa chỉ không được để trống!',
    },
  ]);

  // Hiển thị progress bar mẫu
  console.log(chalk.blue('Chuẩn bị gửi yêu cầu...'));
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(10, 0);
  for (let i = 0; i < 10; i++) {
    await sleep(100);
    bar.increment();
  }
  bar.stop();

  // Gửi yêu cầu faucet
  const success = await requestFaucet(address);

  if (success) {
    console.log(chalk.green.bold('Hoàn tất! Kiểm tra ví của bạn.'));
  } else {
    console.log(chalk.red.bold('Không thể hoàn thành yêu cầu faucet.'));
  }
}

// Chạy chương trình
main().catch(error => {
  console.error(chalk.red(`Lỗi không xác định: ${error.message}`));
  process.exit(1);
});
