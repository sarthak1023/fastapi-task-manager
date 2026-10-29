from services.email_templates import password_reset_email, reminder_email, verification_email


def test_verification_email_has_code_in_both_versions():
    text, html = verification_email("Sam", "123456")

    assert "123456" in text
    assert "123456" in html
    assert "TaskMaster" in html
    assert "Hi Sam" in html


def test_password_reset_email_has_code():
    text, html = password_reset_email("Sam", "654321")
    assert "654321" in text and "654321" in html


def test_user_content_is_html_escaped():
    # Task titles and names come from users, so they must not be able to inject HTML into emails
    _, html = reminder_email(
        name="<b>Sam</b>",
        title='<script>alert("x")</script>',
        priority="high",
        description="<img src=x>",
        due_text="26 Oct 2026, 09:30 UTC",
        minutes_left=30
    )

    assert "<script>" not in html and "&lt;script&gt;" in html
    assert "<img src=x>" not in html
    assert "<b>Sam</b>" not in html


def test_missing_name_falls_back_to_there():
    text, html = verification_email("", "111111")
    assert "Hi there" in text and "Hi there" in html
