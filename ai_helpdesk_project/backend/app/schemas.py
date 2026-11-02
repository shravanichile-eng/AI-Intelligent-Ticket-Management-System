from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class LoginIn(BaseModel):
    username: str
    password: str

class RegisterIn(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str
    department: str = "IT Support"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; user_code: str; username: str; full_name: str; email: str; role: str; department: str; phone: str; status: str; created_at: datetime
class UserCreate(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str
    role: str = "user"
    department: str = "IT Support"
    phone: str = ""
    status: str = "Active"

class AdminUserUpdate(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    role: str
    department: str
    phone: str = ""
    status: str = "Active"
    password: str | None = None

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    department: str | None = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class CategoryIn(BaseModel):
    name: str; description: str = ""; department: str = "IT Support"; color: str = "#0074D9"; sla_hours: int = 24; status: str = "active"
class CategoryOut(CategoryIn):
    model_config = ConfigDict(from_attributes=True)
    id: int; category_code: str; created_at: datetime; created_by: str
class TicketCreate(BaseModel):
    title: str
    description: str
    category_id: int
    priority: str = "Medium"
    assigned_to: int | None = None
    due_date: datetime | None = None
    attachment_url: str = ""

class TicketUpdate(BaseModel):

    priority: str | None = None
    status: str | None = None
    assigned_to: int | None = None
    due_date: datetime | None = None
    resolution: str | None = None
    resolution_attachment_url: str | None = None
class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_code: str
    title: str
    description: str
    priority: str
    status: str
    requester_id: int
    category_id: int
    assigned_to: int | None
    due_date: datetime | None
    attachment_url: str = ""
    resolution_attachment_url: str = ""
    resolution: str | None = None
    created_at: datetime
    updated_at: datetime

    requester_name: str = ""
    requester_email: str = ""
    assignee_name: str = ""
    category_name: str = ""
    department: str = ""

    
class CommentIn(BaseModel):
    body: str; internal: bool = False; attachment_url: str = ""
class CommentOut(CommentIn):
    model_config = ConfigDict(from_attributes=True)
    id: int; ticket_id: int; user_id: int; created_at: datetime; author_name: str = ""

class AITextIn(BaseModel):
    text: str
class AIClassifyIn(BaseModel):
    title: str; description: str
class RAGIn(BaseModel):
    question: str

class EmailTemplateIn(BaseModel):
    name: str; subject: str; body_html: str; status: str = "Active"
class EmailTemplateOut(EmailTemplateIn):
    model_config = ConfigDict(from_attributes=True)
    id: int; created_at: datetime


class SendEmailIn(BaseModel):
    message: str
    attachment_url: str = ""