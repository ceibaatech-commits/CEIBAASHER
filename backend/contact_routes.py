import os
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from dotenv import load_dotenv
import uuid

load_dotenv()

router = APIRouter()
logger = logging.getLogger(__name__)

# Database connection will be injected
db = None

def init_db(database):
    """Initialize database connection"""
    global db
    db = database

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "ceibaatech@gmail.com")


class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    message: str


class ContactResponse(BaseModel):
    success: bool
    message: str


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None


@router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(request: ContactFormRequest):
    """
    Handle contact form submission - saves to database for admin panel
    """
    try:
        # Create support ticket document
        ticket = {
            "id": str(uuid.uuid4()),
            "name": request.name,
            "email": request.email,
            "phone": request.phone or "",
            "message": request.message,
            "status": "new",  # new, in_progress, resolved, closed
            "admin_notes": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Save to database
        await db.support_tickets.insert_one(ticket)
        
        logger.info(f"Support ticket created: {ticket['id']} from {request.email}")
        
        return ContactResponse(
            success=True,
            message="Thank you for contacting us! We'll get back to you soon. 🎉"
        )
        
    except Exception as e:
        logger.error(f"Failed to save contact form: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit. Please try again or contact us directly at {ADMIN_EMAIL}"
        )


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/support-tickets")
async def get_support_tickets(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """
    Get all support tickets for admin panel
    """
    try:
        query = {}
        if status:
            query["status"] = status
        
        tickets = await db.support_tickets.find(
            query, 
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.support_tickets.count_documents(query)
        
        # Count by status
        status_counts = {
            "new": await db.support_tickets.count_documents({"status": "new"}),
            "in_progress": await db.support_tickets.count_documents({"status": "in_progress"}),
            "resolved": await db.support_tickets.count_documents({"status": "resolved"}),
            "closed": await db.support_tickets.count_documents({"status": "closed"})
        }
        
        return {
            "success": True,
            "tickets": tickets,
            "total": total,
            "status_counts": status_counts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tickets: {str(e)}")


@router.get("/admin/support-tickets/{ticket_id}")
async def get_ticket_details(ticket_id: str):
    """
    Get single ticket details
    """
    try:
        ticket = await db.support_tickets.find_one({"id": ticket_id}, {"_id": 0})
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        return {
            "success": True,
            "ticket": ticket
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ticket: {str(e)}")


@router.put("/admin/support-tickets/{ticket_id}")
async def update_ticket(ticket_id: str, update_data: TicketUpdateRequest):
    """
    Update ticket status or add admin notes
    """
    try:
        ticket = await db.support_tickets.find_one({"id": ticket_id})
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if update_data.status:
            update_fields["status"] = update_data.status
        
        if update_data.admin_notes is not None:
            update_fields["admin_notes"] = update_data.admin_notes
        
        await db.support_tickets.update_one(
            {"id": ticket_id},
            {"$set": update_fields}
        )
        
        return {
            "success": True,
            "message": "Ticket updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating ticket: {str(e)}")


@router.delete("/admin/support-tickets/{ticket_id}")
async def delete_ticket(ticket_id: str):
    """
    Delete a support ticket
    """
    try:
        result = await db.support_tickets.delete_one({"id": ticket_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        return {
            "success": True,
            "message": "Ticket deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting ticket: {str(e)}")
