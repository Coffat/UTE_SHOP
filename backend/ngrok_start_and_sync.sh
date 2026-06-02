#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3000}"
ENV_FILE="${2:-.env}"
NGROK_LOG="${3:-/tmp/ute_shop_ngrok.log}"
MAX_WAIT_SECONDS="${MAX_WAIT_SECONDS:-45}"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "Khong tim thay lenh ngrok. Cai dat: brew install ngrok"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Khong tim thay python3."
  exit 1
fi

wait_for_ngrok_api() {
  local elapsed=0
  while [ "${elapsed}" -lt "${MAX_WAIT_SECONDS}" ]; do
    if curl -sS "http://127.0.0.1:4040/api/tunnels" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  return 1
}

print_ngrok_failure_help() {
  echo ""
  echo "Ngrok chua san sang (port 4040 khong mo)."
  echo "Thuong gap nhat: chua cau hinh authtoken (ERR_NGROK_4018)."
  echo ""
  echo "Cach sua:"
  echo "  1. Dang ky: https://dashboard.ngrok.com/signup"
  echo "  2. Lay token: https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  3. Chay: ngrok config add-authtoken <YOUR_TOKEN>"
  echo "  4. Chay lai: npm run ngrok:start-sync"
  echo ""
  if [ -f "${NGROK_LOG}" ]; then
    echo "--- ${NGROK_LOG} (20 dong cuoi) ---"
    tail -n 20 "${NGROK_LOG}" || true
  fi
}

if ! wait_for_ngrok_api; then
  echo "Khoi dong ngrok cho port ${PORT}..."
  : >"${NGROK_LOG}"
  ngrok http "${PORT}" --log=stdout >>"${NGROK_LOG}" 2>&1 &
  NGROK_PID=$!

  if ! wait_for_ngrok_api; then
    if ! kill -0 "${NGROK_PID}" 2>/dev/null; then
      print_ngrok_failure_help
      exit 1
    fi
    print_ngrok_failure_help
    exit 1
  fi
fi

python3 ./ngrok_sync_env.py "${ENV_FILE}"
echo ""
echo "Hoan tat. Restart backend de nap ENV moi: npm run dev"
