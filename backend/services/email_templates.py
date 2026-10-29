import os
from datetime import UTC, datetime
from html import escape

# Link used by the "Open TaskMaster" buttons
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://fastapi-task-manager-khaki.vercel.app").rstrip("/")

BRAND = "#2563eb"        # brand-600, same blue as the app
BRAND_DARK = "#1d4ed8"   # brand-700
BRAND_NAVY = "#1e3a8a"   # brand-900, start of the header gradient
TEXT = "#1f2937"
MUTED = "#6b7280"
PRIORITY_COLORS = {"high": ("#fef2f2", "#dc2626"), "medium": ("#fffbeb", "#b45309"), "low": ("#f1f5f9", "#475569")}

# Emails must use inline styles and tables: most email apps ignore <style> blocks and flexbox.
LOGO = f"""
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background:#ffffff;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;
               font-size:24px;font-weight:bold;color:{BRAND};line-height:40px;">&#10003;</td>
    <td style="padding-left:12px;font-size:24px;font-weight:bold;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">TaskMaster</td>
  </tr>
</table>
"""


def button(label: str, path: str = "/login") -> str:
    return f"""
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
  <tr>
    <td style="background:{BRAND};border-radius:8px;">
      <a href="{FRONTEND_URL}{path}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;
         font-weight:bold;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">{escape(label)}</a>
    </td>
  </tr>
</table>
"""


def code_box(code: str) -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:{BRAND_DARK};margin-bottom:8px;">Your code</div>
      <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:{TEXT};font-family:'Courier New',monospace;">{escape(code)}</div>
    </td>
  </tr>
</table>
"""


def layout(heading: str, content_html: str, preheader: str) -> str:
    year = datetime.now(UTC).year
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f5fb;font-family:Arial,Helvetica,sans-serif;">
  <!-- Preview text shown next to the subject in the inbox -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{escape(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
        <tr>
          <td style="background:{BRAND};background-image:linear-gradient(135deg,{BRAND_NAVY},{BRAND});padding:28px 32px;text-align:center;">
            {LOGO}
            <div style="margin-top:8px;font-size:13px;color:#dbeafe;">Stay organized, stay focused</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 28px;color:{TEXT};font-size:15px;line-height:1.6;">
            <h1 style="margin:0 0 16px;font-size:22px;color:{TEXT};">{escape(heading)}</h1>
            {content_html}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:{MUTED};font-size:12px;line-height:1.5;text-align:center;">
            You're receiving this email because you have a TaskMaster account.<br>
            &copy; {year} TaskMaster. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def verification_email(name: str, code: str):
    name = name or "there"
    html = layout(
        "Verify your email address",
        f"""<p style="margin:0 0 12px;">Hi {escape(name)},</p>
            <p style="margin:0;">Thanks for signing up for TaskMaster. Enter the code below to verify your email address and activate your account.</p>
            {code_box(code)}
            <p style="margin:0;color:{MUTED};font-size:13px;">This code expires in <strong>10 minutes</strong>. If you didn't create a TaskMaster account, you can safely ignore this email.</p>""",
        preheader=f"Your TaskMaster verification code is {code}"
    )
    text = (f"Hi {name},\n\nThanks for signing up for TaskMaster.\n\n"
            f"Your verification code is: {code}\n\nIt expires in 10 minutes. "
            f"If you didn't create a TaskMaster account, you can ignore this email.\n\n- The TaskMaster team")
    return text, html


def password_reset_email(name: str, code: str):
    name = name or "there"
    html = layout(
        "Reset your password",
        f"""<p style="margin:0 0 12px;">Hi {escape(name)},</p>
            <p style="margin:0;">We received a request to reset the password for your TaskMaster account. Use the code below to choose a new password.</p>
            {code_box(code)}
            <p style="margin:0;color:{MUTED};font-size:13px;">This code expires in <strong>10 minutes</strong>. If you didn't request a password reset, you can ignore this email; your password will stay the same.</p>""",
        preheader=f"Your TaskMaster password reset code is {code}"
    )
    text = (f"Hi {name},\n\nWe received a request to reset your TaskMaster password.\n\n"
            f"Your reset code is: {code}\n\nIt expires in 10 minutes. "
            f"If you didn't request this, you can ignore this email.\n\n- The TaskMaster team")
    return text, html


def reminder_email(name: str, title: str, priority: str, description: str, due_text: str, minutes_left: int):
    name = name or "there"
    background, color = PRIORITY_COLORS.get(priority, PRIORITY_COLORS["medium"])
    description_html = (
        f'<div style="margin-top:10px;color:{MUTED};font-size:14px;">{escape(description)}</div>' if description else ""
    )
    html = layout(
        "Your task is due soon",
        f"""<p style="margin:0 0 12px;">Hi {escape(name)},</p>
            <p style="margin:0;">This is a friendly reminder that one of your tasks is due in about <strong>{minutes_left} minutes</strong>.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
              <tr>
                <td style="border:1px solid #e5e7eb;border-left:4px solid {color};border-radius:12px;padding:18px 20px;">
                  <div style="font-size:17px;font-weight:bold;color:{TEXT};">{escape(title)}</div>
                  <div style="margin-top:8px;font-size:13px;color:{MUTED};">
                    <span style="display:inline-block;background:{background};color:{color};font-weight:bold;
                                 border-radius:999px;padding:2px 10px;text-transform:capitalize;">{escape(priority)} priority</span>
                    &nbsp; Due {escape(due_text)}
                  </div>
                  {description_html}
                </td>
              </tr>
            </table>
            {button("Open TaskMaster", "/tasks")}""",
        preheader=f'"{title}" is due in about {minutes_left} minutes'
    )
    text = (f"Hi {name},\n\nYour {priority} priority task \"{title}\" is due in about {minutes_left} minutes "
            f"({due_text}).\n\n{description or ''}\n\nOpen TaskMaster: {FRONTEND_URL}/tasks\n\n- The TaskMaster team")
    return text, html
