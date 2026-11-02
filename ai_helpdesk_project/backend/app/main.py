from datetime import datetime, timedelta
from pathlib import Path
import shutil
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, or_, desc
from sqlalchemy.orm import Session
from .config import settings
from .db import Base, engine, get_db, SessionLocal
from .models import User, Category, Ticket, Comment, AuditLog, EmailTemplate
from .notification import Notification
from .schemas import *
from .auth import hash_password, verify_password, create_token, get_current_user, require_roles
from .seed import seed
from .services import (
    fallback_improve,
    ai_complete,
    classify,
    rag_search,
    send_resolution_email
)
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try: seed(db)
    finally: db.close()
    yield

app = FastAPI(title="AI Help Desk API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in settings.cors_origins.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)

@app.get("/api/health")
def health(): return {"status":"ok","service":"ai-helpdesk"}

@app.post("/api/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.username == data.username))
    if not u or not verify_password(data.password, u.password_hash): raise HTTPException(401, "Invalid username or password")
    return {"access_token": create_token(u), "token_type":"bearer", "user":u}

@app.post("/api/auth/register", response_model=UserOut)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(or_(User.username==data.username, User.email==data.email))): raise HTTPException(400,"Username or email already exists")
    u=User(user_code=f"USER_{db.query(User).count()+1:03d}", username=data.username, full_name=data.full_name, email=data.email, password_hash=hash_password(data.password), role="user", department=data.department)
    db.add(u); db.commit(); db.refresh(u); return u

@app.get("/api/me", response_model=UserOut)
def me(user=Depends(get_current_user)): return user


@app.patch("/api/me", response_model=UserOut)
def update_me(


    data: UserUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if data.full_name is not None:
        user.full_name = data.full_name.strip()

    if data.email is not None:
        user.email = data.email.strip()

    if data.department is not None:
        user.department = data.department.strip()

    db.commit()
    db.refresh(user)

    return user

@app.patch("/api/me/password")
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 6 characters"
        )

    user.password_hash = hash_password(data.new_password)

    db.commit()

    return {"message": "Password changed successfully"}


@app.get("/api/dashboard")
def dashboard(db: Session=Depends(get_db), user=Depends(get_current_user)):
    q = select(func.count(Ticket.id))
    base = db.scalar(q) or 0
    def count(status=None):
        stmt=select(func.count(Ticket.id))
        if status: stmt=stmt.where(Ticket.status==status)
        if user.role=="user": stmt=stmt.where(Ticket.requester_id==user.id)
        if user.role=="agent": stmt=stmt.where(Ticket.assigned_to==user.id)
        return db.scalar(stmt) or 0
    data={"total_tickets":base if user.role=="admin" else count(), "open":count("Open"), "in_progress":count("In Progress"), "pending":count("Pending"), "resolved":count("Resolved"), "closed":count("Closed"), "unassigned":db.scalar(select(func.count(Ticket.id)).where(Ticket.assigned_to==None)) or 0}
    if user.role=="admin":
        data.update({"total_users":db.scalar(select(func.count(User.id))) or 0,"active_users":db.scalar(select(func.count(User.id)).where(User.status=="Active")) or 0,"admin_users":db.scalar(select(func.count(User.id)).where(User.role=="admin")) or 0,"agent_users":db.scalar(select(func.count(User.id)).where(User.role=="agent")) or 0})
    return data

def ticket_query(db, user, search="", status="", priority="", category_id=None, assigned_to=None):
    stmt=select(Ticket).order_by(desc(Ticket.created_at))
    if user.role=="user": stmt=stmt.where(Ticket.requester_id==user.id)
    if user.role=="agent": stmt=stmt.where(Ticket.assigned_to==user.id)
    if search: stmt=stmt.where(or_(Ticket.title.ilike(f"%{search}%"), Ticket.ticket_code.ilike(f"%{search}%"), Ticket.description.ilike(f"%{search}%")))
    if status: stmt=stmt.where(Ticket.status==status)
    if priority: stmt=stmt.where(Ticket.priority==priority)
    if category_id: stmt=stmt.where(Ticket.category_id==category_id)
    if assigned_to: stmt=stmt.where(Ticket.assigned_to==assigned_to)
    return db.scalars(stmt).all()

def ticket_out(t):
    return TicketOut.model_validate(t).model_copy(update={"requester_name":t.requester.full_name,"requester_email":t.requester.email,"assignee_name":t.assignee.full_name if t.assignee else "Unassigned","category_name":t.category.name,"department":t.category.department})

@app.get("/api/tickets", response_model=list[TicketOut])
def tickets(search:str="", status:str="", priority:str="", category_id:int|None=None, assigned_to:int|None=None, db:Session=Depends(get_db), user=Depends(get_current_user)):
    return [ticket_out(t) for t in ticket_query(db,user,search,status,priority,category_id,assigned_to)]

@app.get("/api/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id:int, db:Session=Depends(get_db), user=Depends(get_current_user)):
    t=db.get(Ticket,ticket_id)
    if not t: raise HTTPException(404,"Ticket not found")
    if user.role=="user" and t.requester_id!=user.id: raise HTTPException(403,"Not allowed")
    if user.role=="agent" and t.assigned_to!=user.id: raise HTTPException(403,"Not allowed")
    return ticket_out(t)

@app.post("/api/tickets", response_model=TicketOut)
def create_ticket(data:TicketCreate, db:Session=Depends(get_db), user=Depends(get_current_user)):
    cat=db.get(Category,data.category_id)
    if not cat or cat.status!="active": raise HTTPException(400,"Invalid category")
    assignee=data.assigned_to if user.role=="admin" else None
    if assignee is None:
        assignee=db.scalar(select(User.id).where(User.role=="agent", User.status=="Active", User.department==cat.department).limit(1))
        if assignee is None: assignee=db.scalar(select(User.id).where(User.role=="agent", User.status=="Active").limit(1))
    due=data.due_date or datetime.utcnow()+timedelta(hours=cat.sla_hours)
    year=datetime.utcnow().year
    code=f"TKT-{year}-{db.query(Ticket).count()+1:03d}"
    t=Ticket(ticket_code=code,title=data.title.strip(),description=data.description.strip(),priority=data.priority,status="Open",requester_id=user.id,category_id=cat.id,assigned_to=assignee,due_date=due,attachment_url=data.attachment_url)
    db.add(t); db.flush(); db.add(AuditLog(actor_id=user.id,action="Ticket created",entity_type="ticket",entity_id=str(t.id),details=code)); db.commit(); db.refresh(t); return ticket_out(t)

@app.patch("/api/tickets/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "agent"))
):
    t = db.get(Ticket, ticket_id)

    if not t:
        raise HTTPException(404, "Ticket not found")

    if user.role == "agent" and t.assigned_to != user.id:
        raise HTTPException(403, "Not your ticket")

    old_status = t.status
    changes = []

    # Update normal ticket fields
        # Update normal ticket fields
    for field in [
    "priority",
    "status",
    "assigned_to",
    "due_date",
    "resolution",
    "resolution_attachment_url"
]:
        value = getattr(data, field, None)

        if value is not None:
            setattr(t, field, value)
            changes.append(f"{field}={value}")

# Create notification only when ticket becomes Resolved
    if data.status == "Resolved" and old_status != "Resolved":
        notification = Notification(
            user_id=t.requester_id,
            ticket_id=t.id,
            title=f"Ticket {t.ticket_code} Resolved",
            message="Your support ticket has been resolved.",
            solution=t.resolution or "Your support team has resolved your ticket.",
            notification_type="ticket_resolved",
            is_read=False
        )

    db.add(notification)
       


    if changes:

        db.add(
            AuditLog(
                actor_id=user.id,
                action="Ticket updated",
                entity_type="ticket",
                entity_id=str(t.id),
                details=", ".join(changes)
            )
        )

    db.commit()
    db.refresh(t)

    return ticket_out(t)
@app.post("/api/uploads")
async def upload_file(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".pdf",
        ".doc",
        ".docx",
        ".txt"
    }

    max_size = 10 * 1024 * 1024  # 10 MB

    extension = Path(file.filename or "").suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="File type is not allowed"
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size must be 10 MB or less"
        )

    safe_name = f"{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / safe_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": file.filename,
        "url": f"/uploads/{safe_name}"
    }

@app.get("/api/tickets/{ticket_id}/comments", response_model=list[CommentOut])
def comments(ticket_id:int,db:Session=Depends(get_db),user=Depends(get_current_user)):
    t=db.get(Ticket,ticket_id)
    if not t: raise HTTPException(404,"Ticket not found")
    rows=db.scalars(select(Comment).where(Comment.ticket_id==ticket_id).order_by(Comment.created_at)).all()
    result=[]
    for c in rows:
        if c.internal and user.role=="user": continue
        result.append(CommentOut.model_validate(c).model_copy(update={"author_name":c.user.full_name}))
    return result

@app.post("/api/tickets/{ticket_id}/comments", response_model=CommentOut)
def add_comment(ticket_id:int,data:CommentIn,db:Session=Depends(get_db),user=Depends(get_current_user)):
    t=db.get(Ticket,ticket_id)
    if not t: raise HTTPException(404,"Ticket not found")
    if data.internal and user.role=="user": raise HTTPException(403,"Users cannot create internal notes")
    c=Comment(ticket_id=ticket_id,user_id=user.id,body=data.body,internal=data.internal,attachment_url=data.attachment_url)
    db.add(c); db.add(AuditLog(actor_id=user.id,action="Comment added",entity_type="ticket",entity_id=str(t.id),details="Internal" if data.internal else "Public")); db.commit(); db.refresh(c)
    return CommentOut.model_validate(c).model_copy(update={"author_name":user.full_name})

@app.get("/api/categories", response_model=list[CategoryOut])
def categories(db:Session=Depends(get_db),user=Depends(get_current_user)): return db.scalars(select(Category).order_by(Category.id)).all()

@app.post("/api/categories", response_model=CategoryOut)
def create_category(data:CategoryIn,db:Session=Depends(get_db),user=Depends(require_roles("admin"))):
    code=f"CAT_{db.query(Category).count()+1:03d}"; c=Category(category_code=code,created_by=user.username,**data.model_dump()); db.add(c); db.commit(); db.refresh(c); return c

@app.put("/api/categories/{category_id}", response_model=CategoryOut)
def edit_category(category_id:int,data:CategoryIn,db:Session=Depends(get_db),user=Depends(require_roles("admin"))):
    c=db.get(Category,category_id)
    if not c: raise HTTPException(404,"Category not found")
    for k,v in data.model_dump().items(): setattr(c,k,v)
    db.commit(); db.refresh(c); return c

@app.delete("/api/categories/{category_id}")
def delete_category(category_id:int,db:Session=Depends(get_db),user=Depends(require_roles("admin"))):
    c=db.get(Category,category_id)
    if not c: raise HTTPException(404,"Category not found")
    if db.scalar(select(func.count(Ticket.id)).where(Ticket.category_id==category_id)): raise HTTPException(400,"Category is used by tickets")
    db.delete(c); db.commit(); return {"message":"Category deleted"}

@app.get("/api/users",response_model=list[UserOut])
def users(db:Session=Depends(get_db),user=Depends(require_roles("admin"))): return db.scalars(select(User).order_by(User.id)).all()

@app.put("/api/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    target = db.get(User, user_id)

    if not target:
        raise HTTPException(404, "User not found")

    existing = db.scalar(
        select(User).where(
            or_(
                User.username == data.username,
                User.email == data.email
            ),
            User.id != user_id
        )
    )

    if existing:
        raise HTTPException(
            400,
            "Username or email already exists"
        )

    target.username = data.username.strip()
    target.full_name = data.full_name.strip()
    target.email = data.email
    target.role = data.role
    target.department = data.department.strip()
    target.phone = data.phone.strip()
    target.status = data.status

    if data.password:
        if len(data.password) < 6:
            raise HTTPException(
                400,
                "Password must be at least 6 characters"
            )
        target.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(target)

    return target
@app.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    target = db.get(User, user_id)

    if not target:
        raise HTTPException(404, "User not found")

    if target.id == user.id:
        raise HTTPException(
            400,
            "You cannot delete your own account"
        )

    ticket_count = db.scalar(
        select(func.count(Ticket.id)).where(
            or_(
                Ticket.requester_id == user_id,
                Ticket.assigned_to == user_id
            )
        )
    ) or 0

    if ticket_count > 0:
        raise HTTPException(
            400,
            "User is linked to tickets and cannot be deleted. Set the user to Inactive instead."
        )

    db.delete(target)
    db.commit()

    return {"message": "User deleted successfully"}

@app.post("/api/users", response_model=UserOut)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    existing = db.scalar(
        select(User).where(
            or_(
                User.username == data.username,
                User.email == data.email
            )
        )
    )

    if existing:
        raise HTTPException(
            400,
            "Username or email already exists"
        )

    new_user = User(
        user_code=f"USER_{db.query(User).count()+1:03d}",
        username=data.username.strip(),
        full_name=data.full_name.strip(),
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        department=data.department,
        phone=data.phone,
        status=data.status
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.put("/api/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    target = db.get(User, user_id)

    if not target:
        raise HTTPException(404, "User not found")

    existing = db.scalar(
        select(User).where(
            or_(
                User.username == data.username,
                User.email == data.email
            ),
            User.id != user_id
        )
    )

    if existing:
        raise HTTPException(
            400,
            "Username or email already exists"
        )

    target.username = data.username.strip()
    target.full_name = data.full_name.strip()
    target.email = data.email
    target.role = data.role
    target.department = data.department.strip()
    target.phone = data.phone.strip()
    target.status = data.status

    if data.password:
        if len(data.password) < 6:
            raise HTTPException(
                400,
                "Password must be at least 6 characters"
            )
        target.password_hash = hash_password(data.password)

    db.commit()
    db.refresh(target)

    return target

@app.get("/api/agents",response_model=list[UserOut])
def agents(db:Session=Depends(get_db),user=Depends(get_current_user)): return db.scalars(select(User).where(User.role=="agent",User.status=="Active")).all()

@app.get("/api/email-templates",response_model=list[EmailTemplateOut])
def email_templates(db:Session=Depends(get_db),user=Depends(require_roles("admin"))): return db.scalars(select(EmailTemplate).order_by(desc(EmailTemplate.created_at))).all()

@app.post("/api/email-templates",response_model=EmailTemplateOut)
def create_email_template(data:EmailTemplateIn,db:Session=Depends(get_db),user=Depends(require_roles("admin"))):
    t=EmailTemplate(**data.model_dump()); db.add(t); db.commit(); db.refresh(t); return t

@app.put("/api/email-templates/{template_id}",response_model=EmailTemplateOut)
def edit_email_template(template_id:int,data:EmailTemplateIn,db:Session=Depends(get_db),user=Depends(require_roles("admin"))):
    t=db.get(EmailTemplate,template_id)
    if not t: raise HTTPException(404,"Template not found")
    for k,v in data.model_dump().items(): setattr(t,k,v)
    db.commit(); db.refresh(t); return t

@app.delete("/api/email-templates/{template_id}")
def delete_email_template(template_id:int,db:Session=Depends(get_db),user=Depends(require_roles("admin"))):
    t=db.get(EmailTemplate,template_id)
    if not t: raise HTTPException(404,"Template not found")
    db.delete(t); db.commit(); return {"message":"Template deleted"}

@app.get("/api/audit-logs")
def audit_logs(db:Session=Depends(get_db),user=Depends(require_roles("admin"))):
    rows=db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(200)).all()
    return [{"id":r.id,"action":r.action,"entity_type":r.entity_type,"entity_id":r.entity_id,"details":r.details,"actor":r.actor.full_name if r.actor else "System","created_at":r.created_at} for r in rows]

@app.get("/api/my-logs")
def my_logs(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    rows = db.scalars(
        select(AuditLog)
        .where(AuditLog.actor_id == user.id)
        .order_by(desc(AuditLog.created_at))
        .limit(200)
    ).all()

    return [
        {
            "id": r.id,
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "details": r.details,
            "actor": r.actor.full_name if r.actor else "System",
            "created_at": r.created_at
        }
        for r in rows
    ]

@app.post("/api/ai/improve-title")
async def improve_title(data:AITextIn,user=Depends(get_current_user)):
    result=await ai_complete(f"Improve this IT support ticket title. Return only the improved concise title. Text: {data.text}")
    return {"result":result or fallback_improve(data.text,"title"),"mode":"ai" if result else "local-fallback"}

@app.post("/api/ai/improve-description")
async def improve_description(data: AITextIn, user=Depends(get_current_user)):
    result = await ai_complete(
    f"""
Improve this IT support ticket description.

If the description is very short, expand it into 1-2 clear,
professional sentences that explain the issue and its impact.
Keep the original meaning. Do not provide a solution or
troubleshooting steps.

Example:
Input: WiFi is not working.
Output: I am experiencing an issue with the WiFi connection
and am unable to access the internet. Please check the network
connection and assist with resolving the issue.

If the description is already detailed, improve only its
grammar, clarity, and sentence structure.

Return only the improved description.

Input: {data.text}
"""
)
    return {
        "result": result or fallback_improve(data.text, "description"),
        "mode": "ai" if result else "local-fallback"
    }



@app.post("/api/ai/draft-email")
async def draft_email(data: AITextIn, user=Depends(get_current_user)):
    prompt = f"""
You are an AI IT Support Engineer.

Analyze the user's ticket and create a practical solution for the actual IT problem.

Ticket information:
{data.text}

Instructions:
- Identify the actual problem from the user's description.
- Give a practical solution or troubleshooting steps.
- Provide no more than 5 steps.
- Keep the response concise and easy for a normal user to understand.
- Do not give generic statements that do not address the issue.
- Do not invent information.
- If the information is insufficient, clearly state what needs to be checked.
- Write the result as a professional message that can be sent to the ticket requester.
- Do not include a subject line.

Return only the final solution/email message.
"""

    result = await ai_complete(prompt)

    if not result:
        result = (
            "Hello,\n\n"
            "We are writing regarding your IT support ticket.\n\n"
            "Our support team has reviewed your request and "
            "updated the ticket accordingly.\n\n"
            "Please reply to this email if you need further assistance.\n\n"
            "Regards,\n"
            "IT Support Team"
        )

    return {
        "result": result,
        "mode": "ai"
    }

@app.post("/api/tickets/{ticket_id}/send-email")
def send_ticket_email(
    ticket_id: int,
    data: SendEmailIn,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "agent"))
):
    t = db.get(Ticket, ticket_id)

    if not t:
        raise HTTPException(404, "Ticket not found")

    if user.role == "agent" and t.assigned_to != user.id:
        raise HTTPException(403, "Not your ticket")

    if not t.requester.email:
        raise HTTPException(400, "Ticket requester has no email address")

    if not data.message.strip():
        raise HTTPException(400, "Email message cannot be empty")

    send_resolution_email(
    recipient_email=t.requester.email,
    ticket_code=t.ticket_code,
    ticket_title=t.title,
    resolution=data.message.strip(),
    attachment_url=data.attachment_url
)

    return {
        "message": "Email sent successfully",
        "recipient": t.requester.email
    }


@app.post("/api/ai/draft-solution")
async def draft_solution(
    data: AITextIn,
    user=Depends(get_current_user)
):
    prompt = f"""
You are an IT support agent.

Write a SHORT, professional solution for the support ticket below.

Ticket information:
{data.text}

Requirements:
- Write the solution as one short professional paragraph.
- Keep it between 2 and 4 sentences.
- Clearly explain what the user should do to resolve the issue.
- Use simple and professional language.
- Be helpful and direct.
- Do not use numbered lists.
- Do not use bullet points.
- Do not add a greeting.
- Do not add a subject line.
- Do not add a signature.
- Do not add unnecessary explanations.
- Do not invent information.
- Do not claim that an action was completed unless the ticket information confirms it.
- If the exact fix is unknown, provide the most relevant troubleshooting action.
- Return only the solution paragraph.

Example style:
"We understand you are experiencing difficulty accessing your account. Please verify your login credentials and try signing in again. If the issue continues, reset your password or contact the IT support team for further assistance."
"""

    result = await ai_complete(prompt)

    if not result:
        result = (
            "Please review the reported issue and follow the "
            "appropriate troubleshooting steps. Verify the result "
            "before marking the ticket as resolved."
        )

    return {
        "result": result,
        "mode": "ai" if result else "fallback"
    }

@app.post("/api/ai/classify")
async def ai_classify(
    data: AIClassifyIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    local = classify(data.title, data.description)

    # Get only categories that actually exist in the database
    categories = db.scalars(
        select(Category).order_by(Category.id)
    ).all()

    category_names = [c.name for c in categories]

    prompt = f"""
You are an IT helpdesk ticket classifier.

Classify the following ticket.

TITLE:
{data.title}

DESCRIPTION:
{data.description}

AVAILABLE CATEGORIES:
{category_names}

IMPORTANT RULES:
1. Select ONLY one category from AVAILABLE CATEGORIES.
2. Do NOT invent a new category.
3. Do NOT use a category that is not in the list.
4. Select the category that best matches the actual problem.
5. Return ONLY valid JSON.
6. JSON format:
{{"category": "exact category name", "priority": "Low|Medium|Urgent"}}
"""
    result = await ai_complete(prompt)

    if result:
        import json

        try:
            parsed = json.loads(result)

            ai_category = parsed.get("category")
            ai_priority = parsed.get("priority")

            # Accept AI category only if it exists in the database
            valid_category = next(
                (
                    name for name in category_names
                    if name.lower() == str(ai_category).strip().lower()
                ),
                None
            )

            if valid_category:
                return {
                    "category": valid_category,
                    "priority": ai_priority,
                    "mode": "ai"
                }

        except Exception:
            pass

    return {
        **local,
        "mode": "local-fallback"
    }
@app.post("/api/ai/rag")
async def rag(data:RAGIn,db:Session=Depends(get_db),user=Depends(get_current_user)):
    articles=rag_search(db,data.question)
    context="\n\n".join([f"{a.title}: {a.content}" for a in articles])
    if not context: return {"answer":"I could not find a matching knowledge article. Please create a ticket for support.","sources":[]}
    answer=await ai_complete(f"Answer using only this helpdesk knowledge base. Question: {data.question}\nKnowledge:\n{context}")
    if not answer:
        answer="\n".join([f"• {a.title}: {a.content}" for a in articles[:3]])
    return {"answer":answer,"sources":[{"id":a.id,"title":a.title,"category":a.category} for a in articles]}

@app.get("/api/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Notifications are only available to normal users
    if user.role != "user":
        raise HTTPException(
            status_code=403,
            detail="Notifications are available only to users"
        )

    notifications = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(desc(Notification.created_at))
    ).all()

    return [
        {
            "id": n.id,
            "ticket_id": n.ticket_id,
            "title": n.title,
            "message": n.message,
            "solution": n.solution,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifications
    ]


@app.get("/api/notifications/count")
def get_notification_count(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Notifications are only available to normal users
    if user.role != "user":
        raise HTTPException(
            status_code=403,
            detail="Notifications are available only to users"
        )

    count = db.scalar(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == user.id,
            Notification.is_read == False
        )
    ) or 0

    return {"count": count}


@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Notifications are only available to normal users
    if user.role != "user":
        raise HTTPException(
            status_code=403,
            detail="Notifications are available only to users"
        )

    notification = db.get(Notification, notification_id)

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    if notification.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Not allowed"
        )

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}