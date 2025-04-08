import time
import random
import json
import sys
import requests
from http.client import HTTPException
from tqdm import tqdm
from rich.console import Console
from rich.prompt import Prompt
import http.client

console = Console()

# Đọc cấu hình từ config.json
with open("config.json", "r") as f:
    config = json.load(f)

DELAY_MIN = config["delayMin"] / 1000  # Chuyển sang giây
DELAY_MAX = config["delayMax"] / 1000  # Chuyển sang giây
RETRY_COUNT = config["retryCount"]
RETRY_DELAY = config["retryDelay"] / 1000  # Chuyển sang giây

# Hàm thực hiện yêu cầu faucet với retry
def request_faucet(address):
    url = "https://api.example.com/faucet"  # Thay bằng URL thực tế của SUI Faucet
    payload = {"address": address}
    
    for attempt in range(RETRY_COUNT + 1):
        try:
            with console.status(f"[bold green]Đang gửi yêu cầu đến faucet... (Lần thử {attempt + 1})"):
                time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))  # Độ trễ ngẫu nhiên
                response = requests.post(url, json=payload, timeout=10)
                response.raise_for_status()
                console.print(f"[green]Thành công: {response.json()}")
                return True
        except (requests.RequestException, HTTPException) as e:
            console.print(f"[red]Lỗi: {str(e)}")
            if attempt < RETRY_COUNT:
                console.print(f"[yellow]Thử lại sau {RETRY_DELAY} giây...")
                time.sleep(RETRY_DELAY)
            else:
                console.print("[red]Đã hết số lần thử. Thất bại.")
                return False

# Hàm chính với CLI
def main():
    console.print("[bold cyan]Chào mừng đến với SUI Faucet Tool!")
    
    # Prompt tương tác để nhập địa chỉ
    address = Prompt.ask("[bold yellow]Nhập địa chỉ ví SUI của bạn")
    
    # Hiển thị progress bar mẫu
    console.print("[blue]Chuẩn bị gửi yêu cầu...")
    for _ in tqdm(range(10), desc="Khởi tạo", leave=False):
        time.sleep(0.1)
    
    # Gửi yêu cầu faucet
    success = request_faucet(address)
    
    if success:
        console.print("[bold green]Hoàn tất! Kiểm tra ví của bạn.")
    else:
        console.print("[bold red]Không thể hoàn thành yêu cầu faucet.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Đã hủy bởi người dùng.")
        sys.exit(0)
    except Exception as e:
        console.print(f"[red]Lỗi không xác định: {str(e)}")
        sys.exit(1)
