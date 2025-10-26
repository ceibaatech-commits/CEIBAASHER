from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from datetime import datetime

router = APIRouter()

class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    message: str

class ContactResponse(BaseModel):
    status: str
    message: str

@router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(request: ContactFormRequest):
    """
    Handle contact form submission and send email to support@ceibaa.in
    """
    try:
        # Get SendGrid API key and sender email from environment
        sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        sender_email = os.getenv('SENDER_EMAIL', 'noreply@ceibaa.in')
        
        if not sendgrid_api_key:
            raise HTTPException(status_code=500, detail="Email service not configured")
        
        # Create email content with emojis
        subject = f"📧 New Contact Form Submission from {request.name}"
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 10px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        border-radius: 10px 10px 0 0;
                        text-align: center;
                    }}
                    .content {{
                        background: white;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }}
                    .field {{
                        margin-bottom: 20px;
                        padding: 15px;
                        background-color: #f5f5f5;
                        border-left: 4px solid #667eea;
                        border-radius: 5px;
                    }}
                    .field-label {{
                        font-weight: bold;
                        color: #667eea;
                        margin-bottom: 5px;
                    }}
                    .field-value {{
                        color: #333;
                        word-wrap: break-word;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 2px solid #eee;
                        color: #999;
                        font-size: 12px;
                    }}
                    .emoji {{
                        font-size: 24px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="emoji">✉️</div>
                        <h2>New Contact Form Submission</h2>
                        <p>Ceibaa Support Portal</p>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="field-label">👤 Name:</div>
                            <div class="field-value">{request.name}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">📧 Email:</div>
                            <div class="field-value">
                                <a href="mailto:{request.email}">{request.email}</a>
                            </div>
                        </div>
                        
                        {f'''<div class="field">
                            <div class="field-label">📱 Phone:</div>
                            <div class="field-value">{request.phone}</div>
                        </div>''' if request.phone else ''}
                        
                        <div class="field">
                            <div class="field-label">💬 Message:</div>
                            <div class="field-value">{request.message}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">🕐 Submitted At:</div>
                            <div class="field-value">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This email was sent from the Ceibaa Contact Form</p>
                        <p>© 2025 Ceibaa - Unlocking Exam Potential</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Create SendGrid message - send to both support and hiring team
        message = Mail(
            from_email=sender_email,
            to_emails=['support@ceibaa.in', 'hire@ceibaa.in'],
            subject=subject,
            html_content=html_content
        )
        
        # Send email
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        
        if response.status_code == 202:
            return ContactResponse(
                status="success",
                message="Thank you for contacting us! We'll get back to you soon. 🎉"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        print(f"Error sending contact email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send your message. Please try again later or email us directly at support@ceibaa.in"
        )
