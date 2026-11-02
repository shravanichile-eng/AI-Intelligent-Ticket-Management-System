from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import User, Category, Ticket, Comment, EmailTemplate, KnowledgeArticle
from .auth import hash_password


def seed(db: Session):
    if db.query(User).count():
        return
    admin = User(user_code="USER_001", username="admin1", full_name="System Administrator", email="admin@example.com", password_hash=hash_password("admin123"), role="admin", department="IT Support", phone="+91 9000000001")
    agent = User(user_code="USER_002", username="support_agent", full_name="Support Agent", email="agent@example.com", password_hash=hash_password("agent123"), role="agent", department="Help Desk", phone="+91 9000000002")
    user = User(user_code="USER_003", username="user1", full_name="Sales User", email="user@example.com", password_hash=hash_password("user123"), role="user", department="IT Support", phone="+91 9000000003")
    db.add_all([admin, agent, user]); db.flush()
    cats = [
        Category(category_code="CAT_001", name="Email & Communication", description="Email, Outlook, Teams, and communication tools", department="IT Support", color="#0074D9", sla_hours=24, created_by="admin1"),
        Category(category_code="CAT_002", name="Software & Applications", description="Software installation, updates, and licensing issues", department="IT Support", color="#34A853", sla_hours=48, created_by="admin1"),
        Category(category_code="CAT_003", name="Hardware & Devices", description="Computer, printer, phone, and device issues", department="IT Support", color="#EA4335", sla_hours=72, created_by="admin1"),
        Category(category_code="CAT_004", name="Network & Connectivity", description="Internet, Wi-Fi, VPN, and network access", department="IT Support", color="#FBBC04", sla_hours=24, created_by="admin1"),
        Category(category_code="CAT_005", name="Account & Access", description="Password resets, account permissions, and access requests", department="Help Desk", color="#9B59B6", sla_hours=12, created_by="admin1"),
        Category(category_code="CAT_006",name="Facilities & Maintenance",description="Issues related to building facilities, air conditioning, electrical, plumbing, lighting, and other maintenance services.",department="Facilities",sla_hours=24,status="active"),
        Category(
            category_code="CAT_007",
            name="Human Resources",
            description="Issues and requests related to employee HR services, employee records, onboarding, offboarding, attendance, leave, employee information, company policies, and other human resource matters.",
            department="HR",
            sla_hours=24,
            status="active"
        ),
    ]
    db.add_all(cats); db.flush()
    now = datetime.utcnow()
    tickets = [
        Ticket(ticket_code="TKT-2026-001", title="Unable to Log in to Website", description="Login fails after entering valid credentials.", priority="Urgent", status="Open", requester_id=user.id, category_id=cats[4].id, assigned_to=agent.id, due_date=now+timedelta(hours=12)),
        Ticket(ticket_code="TKT-2026-002", title="Printer not working on 3rd floor", description="Printer shows offline status.", priority="Medium", status="In Progress", requester_id=user.id, category_id=cats[2].id, assigned_to=agent.id, due_date=now+timedelta(hours=48)),
        Ticket(ticket_code="TKT-2026-003", title="Request software installation - Adobe Creative Suite", description="Need approved software installation.", priority="Low", status="Pending", requester_id=user.id, category_id=cats[1].id, assigned_to=None, due_date=now+timedelta(hours=48)),
        Ticket(ticket_code="TKT-2026-004", title="Slow internet connection in conference room", description="Wi-Fi is slow in conference room.", priority="High", status="Resolved", requester_id=user.id, category_id=cats[3].id, assigned_to=agent.id, due_date=now-timedelta(hours=2)),
    ]
    db.add_all(tickets)
    db.flush()
    db.add(EmailTemplate(name="Ticket Update", subject="My ticket {{ticketid}}", body_html="<p>Hello {{requester_name}},</p><p>Your ticket <b>{{ticketid}}</b> is now <b>{{ticket_status}}</b>.</p><p>{{resolution}}</p><p>Regards,<br>Support Team</p>"))
    db.add_all([
        KnowledgeArticle(title="Password reset", category="Account & Access", content="To reset your password, open the account portal, choose Forgot Password, verify your email, and set a new password. If the account is locked, contact the Help Desk."),
        KnowledgeArticle(title="VPN connection", category="Network & Connectivity", content="Install the approved VPN client, sign in with your corporate account, select the nearest gateway, and connect. If authentication fails, verify MFA and contact support."),
        KnowledgeArticle(title="Printer troubleshooting", category="Hardware & Devices", content="Check power and network status, confirm the correct printer is selected, clear the print queue, and restart the printer. If it remains offline, create a ticket."),
    ])
    db.add(Comment(ticket_id=tickets[0].id, user_id=agent.id, body="I am checking the account access logs.", internal=False))
    db.commit()
