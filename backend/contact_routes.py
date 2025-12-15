import os
import asyncio
import logging
import resend
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
logger = logging.getLogger(__name__)

# Resend Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
# In Resend test mode, emails can only go to the account owner's email
# For production, verify your domain at https://resend.com/domains
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "aviitanwar1@gmail.com")

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY not found in environment variables")


class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    message: str


class ContactResponse(BaseModel):
    success: bool
    message: str


@router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(request: ContactFormRequest):
    """
    Handle contact form submission and send email to ceibaatech@gmail.com
    """
    if not RESEND_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Email service not configured. Please contact admin."
        )
    
    try:
        # Create HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .field {{
                    margin-bottom: 20px;
                }}
                .label {{
                    font-weight: bold;
                    color: #667eea;
                    display: block;
                    margin-bottom: 5px;
                }}
                .value {{
                    background: #f5f5f5;
                    padding: 10px;
                    border-radius: 5px;
                    border-left: 3px solid #667eea;
                }}
                .message-box {{
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 3px solid #667eea;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📧 New Contact Form Submission</h1>
                    <p>Ceibaa Website</p>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">👤 Name:</span>
                        <div class="value">{request.name}</div>
                    </div>
                    
                    <div class="field">
                        <span class="label">📧 Email:</span>
                        <div class="value">{request.email}</div>
                    </div>
                    
                    {f'''<div class="field">
                        <span class="label">📱 Phone:</span>
                        <div class="value">{request.phone}</div>
                    </div>''' if request.phone else ''}
                    
                    <div class="field">
                        <span class="label">💬 Message:</span>
                        <div class="message-box">{request.message}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated message from your Ceibaa contact form.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Prepare email parameters
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "reply_to": request.email,  # Allow easy reply
            "subject": f"New Contact Form - {request.name}",
            "html": html_content
        }
        
        # Send email (non-blocking)
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Contact form email sent successfully. Email ID: {email_result.get('id')}")
        
        return ContactResponse(
            success=True,
            message="Thank you for contacting us! We'll get back to you soon. 🎉"
        )
        
    except Exception as e:
        logger.error(f"Failed to send contact form email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email. Please try again later or contact us directly at {ADMIN_EMAIL}"
        )
