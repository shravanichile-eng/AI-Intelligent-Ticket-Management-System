import re
import httpx
import mimetypes
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .models import KnowledgeArticle
from sentence_transformers import SentenceTransformer
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def fallback_improve(text: str, kind: str) -> str:
    t = _clean(text)
    if not t:
        return ""
    if kind == "title":
        return t[:1].upper() + t[1:].rstrip(".")
    return t.rstrip(".") + ". Please include the exact error message, steps already attempted, and the business impact if available."

async def ai_complete(prompt: str) -> str:
    if not settings.ai_base_url or not settings.ai_model:
        return ""
    headers = {"Content-Type": "application/json"}
    if settings.ai_api_key:
        headers["Authorization"] = f"Bearer {settings.ai_api_key}"
    payload = {
    "model": settings.ai_model,
    "messages": [{"role": "user", "content": prompt}],
    "temperature": 0.1,
    "max_tokens": 200,
    "keep_alive": "10m"
}  
    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout) as client:
            r = await client.post(settings.ai_base_url.rstrip("/") + "/chat/completions", json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print("AI ERROR:", repr(e))
        return ""


def classify(title: str, description: str):
    text = (title + " " + description).lower()
    rules = [
        ("Account & Access", "Urgent", ["login", "password", "account", "access", "locked"]),
        ("Network & Connectivity", "High", ["wifi", "wi-fi", "internet", "vpn", "network", "connection"]),
        ("Hardware & Devices", "High", ["printer", "laptop", "keyboard", "mouse", "monitor", "computer", "device"]),
        ("Software & Applications", "Medium", ["software", "application", "install", "installation", "license", "outlook"]),
        ("Email & Communication", "Medium", ["email", "mail", "teams", "outlook"]),
        ("Facilities & Maintenance", "Medium", [ "air conditioner","air conditioning","ac not","ac unit","ac is","electricity","electrical","light","fan","plumbing","water leakage","lift","elevator","building maintenance","room maintenance","office maintenance"]),
        ("Human Resources", "Medium", [
            "human resources",
            "hr",
            "employee",
            "employee record",
            "onboarding",
            "offboarding",
            "attendance",
            "leave",
            "salary",
            "payroll",
            "employee information",
            "hr policy",
            "company policy",
            "benefits",
            "training",
            "performance review",
            "shift",
            "schedule"
        ]),
        ]

    for category, priority, words in rules:
        if any(w in text for w in words):
            return {"category": category, "priority": priority, "confidence": 0.92}
    return {"category": "Software & Applications", "priority": "Medium", "confidence": 0.55}


def rag_search(db: Session, question: str, limit: int = 5):
    question_embedding = embedding_model.encode(
        question,
        normalize_embeddings=True
    ).tolist()

    articles = db.scalars(
        select(KnowledgeArticle)
        .where(KnowledgeArticle.embedding.is_not(None))
        .order_by(
            KnowledgeArticle.embedding.cosine_distance(
                question_embedding
            )
        )
        .limit(limit)
    ).all()

    return articles


import smtplib
from email.message import EmailMessage

from .config import settings


def send_resolution_email(
    recipient_email: str,
    ticket_code: str,
    ticket_title: str,
    resolution: str,
    attachment_url: str = ""
):
    message = EmailMessage()

    message["Subject"] = f"Ticket {ticket_code} Update"
    message["From"] = settings.smtp_from
    message["To"] = recipient_email

    email_body = f"""Hello,

Regarding your support ticket {ticket_code}:

Ticket: {ticket_title}

{resolution}

Thank you,
IT Support Team
"""

    message.set_content(email_body)

    # Add attachment if an uploaded file was selected
    if attachment_url and attachment_url.startswith("/uploads/"):
        filename = Path(attachment_url).name
        file_path = Path("uploads") / filename

        if file_path.exists():
            file_data = file_path.read_bytes()
            mime_type, _ = mimetypes.guess_type(str(file_path))

            if mime_type:
                maintype, subtype = mime_type.split("/", 1)
            else:
                maintype, subtype = "application", "octet-stream"

            message.add_attachment(
                file_data,
                maintype=maintype,
                subtype=subtype,
                filename=filename
            )

    # If the user pasted an external URL, include it in the email
    elif attachment_url:
        message.set_content(
            email_body +
            f"\n\nAdditional link:\n{attachment_url}"
        )

    if settings.email_mode == "console":
        print("\n===== EMAIL =====")
        print("To:", recipient_email)
        print("Subject:", message["Subject"])
        print()
        print(email_body)

        if attachment_url:
            print("Attachment/Link:", attachment_url)

        print("=================\n")
        return

    with smtplib.SMTP(
        settings.smtp_host,
        settings.smtp_port
    ) as server:

        server.starttls()

        server.login(
            settings.smtp_username,
            settings.smtp_password
        )

        server.send_message(message)