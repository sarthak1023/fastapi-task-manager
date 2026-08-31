import random
import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")


def generate_verification_code():
    return str(random.randint(100000, 999999))


def send_verification_email(to_email: str, code: str):
    html_body = f"""
    <html>
      <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="400" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

                <tr>
                  <td style="background:#4f46e5; padding:24px; text-align:center;">
                    <span style="color:#ffffff; font-size:20px; font-weight:bold;">&#10003; TaskMaster</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 32px 16px;">
                    <p style="font-size:16px; color:#374151; margin:0 0 16px;">
                      Hi there,
                    </p>
                    <p style="font-size:15px; color:#6b7280; margin:0 0 24px;">
                      Use the code below to verify your email address and finish setting up your account.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 24px; text-align:center;">
                    <div style="background:#eef2ff; border-radius:10px; padding:20px; display:inline-block;">
                      <span style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#4f46e5;">
                        {code}
                      </span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 32px 32px;">
                    <p style="font-size:13px; color:#9ca3af; margin:0; text-align:center;">
                      This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """

    resend.Emails.send({
        "from": "TaskMaster <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Verify your email - TaskMaster",
        "html": html_body,
    })