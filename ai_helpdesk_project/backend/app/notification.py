from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
)

from sqlalchemy.orm import relationship

from datetime import datetime
import uuid

from .db import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # The user who should receive this notification
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Related ticket
    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id"),
        nullable=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    # Actual resolution/solution shown to the user
    solution = Column(
        Text,
        nullable=True
    )

    notification_type = Column(
        String,
        default="ticket_update"
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    user = relationship(
        "User",
        back_populates="notifications"
    )

    ticket = relationship(
        "Ticket"
    )