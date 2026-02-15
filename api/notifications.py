"""
Notification service for TennisPal.
Sends real SMS (Twilio) and email (SendGrid) notifications.
Falls back gracefully if credentials are not configured.
"""
import os
import logging

logger = logging.getLogger(__name__)

# ── Twilio config ──
TWILIO_SID = os.environ.get('TWILIO_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE = os.environ.get('TWILIO_PHONE')

# ── SendGrid config ──
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@tennispal.app')


def _get_twilio_client():
    if not all([TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE]):
        return None
    try:
        from twilio.rest import Client
        return Client(TWILIO_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        logger.warning(f"Twilio client init failed: {e}")
        return None


def send_sms(to_phone: str, body: str) -> bool:
    """Send an SMS via Twilio. Returns True on success."""
    if not to_phone:
        return False
    client = _get_twilio_client()
    if not client:
        logger.info(f"SMS skipped (no Twilio credentials): {to_phone}")
        return False
    try:
        client.messages.create(body=body, from_=TWILIO_PHONE, to=to_phone)
        logger.info(f"SMS sent to {to_phone}")
        return True
    except Exception as e:
        logger.error(f"SMS failed to {to_phone}: {e}")
        return False


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SendGrid. Returns True on success."""
    if not to_email or not SENDGRID_API_KEY:
        if not SENDGRID_API_KEY:
            logger.info(f"Email skipped (no SendGrid credentials): {to_email}")
        return False
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=f"""
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #16a34a; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">🎾 TennisPal</h2>
                </div>
                <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 8px 8px;">
                    <p>{body}</p>
                </div>
            </div>
            """,
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email failed to {to_email}: {e}")
        return False


def notify_user(user, message: str, subject: str = "TennisPal Notification"):
    """
    Send notification to a user based on their preferences.
    Always creates an in-app notification (caller handles that).
    This sends the external SMS/email if the user opted in.
    """
    if user.notify_sms and user.phone:
        send_sms(user.phone, message)
    if user.notify_email and user.email:
        send_email(user.email, subject, message)
