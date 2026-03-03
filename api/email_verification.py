"""Email verification via SendGrid with in-memory rate limiting."""
import os
import secrets
import time
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity

# ── Rate limiting (in-memory) ──

_ip_sends: dict[str, list[float]] = {}      # ip -> list of timestamps
_email_sends: dict[str, list[float]] = {}   # email -> list of timestamps

TOKEN_EXPIRY_HOURS = 24
RESEND_COOLDOWN_SECONDS = 60
MAX_IP_PER_HOUR = 3
MAX_EMAIL_PER_DAY = 5


def _clean(timestamps: list[float], window: float) -> list[float]:
    cutoff = time.time() - window
    return [t for t in timestamps if t > cutoff]


def check_rate_limit(ip: str, email: str) -> str | None:
    """Return error message if rate limited, else None."""
    now = time.time()

    # IP: max 3 per hour
    _ip_sends[ip] = _clean(_ip_sends.get(ip, []), 3600)
    if len(_ip_sends[ip]) >= MAX_IP_PER_HOUR:
        return "Too many verification emails. Try again later."

    # Email: max 5 per day
    _email_sends[email] = _clean(_email_sends.get(email, []), 86400)
    if len(_email_sends[email]) >= MAX_EMAIL_PER_DAY:
        return "Too many verification emails for this address. Try again tomorrow."

    # 60s cooldown
    if _email_sends[email] and (now - _email_sends[email][-1]) < RESEND_COOLDOWN_SECONDS:
        remaining = int(RESEND_COOLDOWN_SECONDS - (now - _email_sends[email][-1]))
        return f"Please wait {remaining} seconds before requesting another email."

    return None


def record_send(ip: str, email: str):
    now = time.time()
    _ip_sends.setdefault(ip, []).append(now)
    _email_sends.setdefault(email, []).append(now)


# ── Token generation ──

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)


def is_token_expired(sent_at: datetime) -> bool:
    if not sent_at:
        return True
    return datetime.utcnow() - sent_at > timedelta(hours=TOKEN_EXPIRY_HOURS)


# ── Email sending ──

BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5173')
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@tennispal.app')


def send_verification_email(to_email: str, token: str) -> bool:
    """Send verification email via SendGrid. Returns True on success."""
    if not SENDGRID_API_KEY:
        print(f"[DEV] Verification link: {BASE_URL}/verify?token={token}")
        return True

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Content

        verification_url = f"{BASE_URL}/verify?token={token}"
        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #15803d; font-size: 24px; margin-bottom: 8px;">🎾 TennisPal</h1>
            <h2 style="color: #333; font-size: 20px; margin-bottom: 24px;">Verify your email</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Click the button below to verify your email address and get full access to TennisPal.
            </p>
            <a href="{verification_url}" style="display: inline-block; background: #15803d; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Verify Email
            </a>
            <p style="color: #999; font-size: 13px; margin-top: 32px;">
                This link expires in 24 hours. If you didn't create a TennisPal account, ignore this email.
            </p>
        </div>
        """

        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject='Verify your TennisPal email',
            html_content=Content("text/html", html),
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code in (200, 201, 202)
    except Exception as e:
        print(f"[ERROR] Failed to send verification email: {e}")
        return False


# ── Decorator for email-verified-only endpoints ──

def email_verified_required(f):
    """Use after @jwt_required(). Returns 403 if user's email is not verified."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        from models import User
        uid = int(get_jwt_identity())
        user = User.query.get(uid)
        if user and not user.email_verified:
            return jsonify(error="Please verify your email first."), 403
        return f(*args, **kwargs)
    return wrapper
