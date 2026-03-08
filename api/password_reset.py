"""Password reset via email with time-limited tokens."""
import os
import secrets
from datetime import datetime, timedelta
from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash
from models import db, User

password_reset_bp = Blueprint('password_reset', __name__)

TOKEN_EXPIRY_HOURS = 1
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5173')
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@tennispal.app')


def _generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def _send_reset_email(to_email: str, token: str) -> bool:
    """Send password reset email via SendGrid. Falls back to console logging."""
    reset_url = f"{BASE_URL}/reset-password?token={token}"

    if not SENDGRID_API_KEY:
        print(f"[DEV] Password reset link: {reset_url}")
        print(f"[DEV] Reset token: {token}")
        return True

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Content

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #15803d; font-size: 24px; margin-bottom: 8px;">🎾 TennisPal</h1>
            <h2 style="color: #333; font-size: 20px; margin-bottom: 24px;">Reset your password</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                We received a request to reset your password. Click the button below to choose a new one.
            </p>
            <a href="{reset_url}" style="display: inline-block; background: #15803d; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Reset Password
            </a>
            <p style="color: #999; font-size: 13px; margin-top: 32px;">
                This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>
        """

        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject='Reset your TennisPal password',
            html_content=Content("text/html", html),
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code in (200, 201, 202)
    except Exception as e:
        print(f"[ERROR] Failed to send reset email: {e}")
        return False


@password_reset_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify(error='Email is required.'), 400

    # Always return success to avoid email enumeration
    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify(message='If an account with that email exists, a reset link has been sent.')

    token = _generate_reset_token()
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)
    db.session.commit()

    _send_reset_email(user.email, token)
    return jsonify(message='If an account with that email exists, a reset link has been sent.')


@password_reset_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()
    new_password = data.get('password', '')

    if not token:
        return jsonify(error='Reset token is required.'), 400
    if not new_password or len(new_password) < 6:
        return jsonify(error='Password must be at least 6 characters.'), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return jsonify(error='Invalid or expired reset token.'), 400

    if not user.reset_token_expires or datetime.utcnow() > user.reset_token_expires:
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        return jsonify(error='Reset token has expired. Please request a new one.'), 400

    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify(message='Password has been reset successfully. You can now log in.')
