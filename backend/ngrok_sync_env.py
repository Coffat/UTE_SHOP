#!/usr/bin/env python3
import json
import sys
import urllib.request
from pathlib import Path


def fetch_ngrok_https_url() -> str:
    try:
        with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise RuntimeError(
            "Khong ket noi duoc ngrok API (127.0.0.1:4040). "
            "Hay chay: npm run ngrok:start-sync (sau khi da cau hinh authtoken)."
        ) from exc
    for tunnel in data.get("tunnels", []):
        public_url = tunnel.get("public_url", "")
        if public_url.startswith("https://"):
            return public_url.rstrip("/")
    raise RuntimeError("Khong tim thay HTTPS tunnel tu ngrok.")


def parse_env_lines(env_path: Path):
    if not env_path.exists():
        raise FileNotFoundError(f"Khong tim thay file env: {env_path}")
    lines = env_path.read_text(encoding="utf-8").splitlines()
    key_to_index = {}
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in line:
            continue
        key = line.split("=", 1)[0].strip()
        key_to_index[key] = idx
    return lines, key_to_index


def set_env_value(lines, key_to_index, key, value):
    entry = f"{key}={value}"
    if key in key_to_index:
        lines[key_to_index[key]] = entry
    else:
        lines.append(entry)
        key_to_index[key] = len(lines) - 1


def main():
    env_file = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".env")

    public_url = fetch_ngrok_https_url()
    lines, key_to_index = parse_env_lines(env_file)

    updates = {
        "APP_PUBLIC_URL": public_url,
        "MOMO_REDIRECT_URL": f"{public_url}/api/v1/payments/momo/return",
        "MOMO_IPN_URL": f"{public_url}/api/v1/payments/momo/ipn",
        "VNPAY_RETURN_URL": f"{public_url}/api/v1/payments/vnpay/return",
        "VNPAY_IPN_URL": f"{public_url}/api/v1/payments/vnpay/ipn",
    }

    for key, value in updates.items():
        set_env_value(lines, key_to_index, key, value)

    env_file.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("Da cap nhat URL thanh toan vao", env_file)
    for key, value in updates.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()
