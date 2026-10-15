import hmac
import hashlib
import time
import io
import base64
import qrcode
from datetime import datetime, timedelta

ROTATION_SECONDS = 15

def generate_session_secret() -> str:
    return hashlib.sha256(f"{time.time()}-{hashlib.md5().hexdigest()}".encode()).hexdigest()[:32]

def get_time_step(timestamp: float = None, step_seconds: int = ROTATION_SECONDS) -> int:
    if timestamp is None:
        timestamp = time.time()
    return int(timestamp // step_seconds)

def generate_qr_token(secret: str, step: int = None) -> str:
    if step is None:
        step = get_time_step()
    message = f"MIRAI-ATTEND-{step}".encode()
    signature = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()[:10]
    return f"{step}-{signature}"

def validate_qr_token(secret: str, token_str: str, max_drift_steps: int = 1) -> bool:
    try:
        parts = token_str.split("-")
        if len(parts) != 2:
            return False
        step = int(parts[0])
        provided_sig = parts[1]
        
        current_step = get_time_step()
        # Accept within clock drift window (current step, +/- 1 step = 15s leeway)
        if abs(current_step - step) > max_drift_steps:
            return False
        
        expected_token = generate_qr_token(secret, step)
        return hmac.compare_digest(token_str, expected_token)
    except Exception:
        return False

def generate_qr_code_base64(data: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0ea5e9", back_color="#060911")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64_str}"
