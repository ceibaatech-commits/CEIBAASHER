"""
Employee Routes for Ceibaa Platform
Handles employee authentication and management by admin
Dual-mode auth: HttpOnly cookie (preferred) + Authorization Bearer (legacy)
"""
from fastapi import APIRouter, HTTPException, Header, Depends, Request, Response
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import hashlib
import secrets
import jwt
import os

router = APIRouter()

# Global db instance (will be set from server.py)
db = None

JWT_SECRET = os.environ["JWT_SECRET"]

# Cookie configuration
EMPLOYEE_COOKIE_NAME = "ceibaa_employee_token"
EMPLOYEE_COOKIE_MAX_AGE_SEC = 24 * 60 * 60  # 24 hours
ADMIN_COOKIE_NAME = "ceibaa_admin_token"  # shared with admin_auth_routes


def init_db(database):
    global db
    db = database


def _set_employee_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=EMPLOYEE_COOKIE_NAME,
        value=token,
        max_age=EMPLOYEE_COOKIE_MAX_AGE_SEC,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )


def _clear_employee_cookie(response: Response) -> None:
    response.delete_cookie(key=EMPLOYEE_COOKIE_NAME, path="/", samesite="lax")


def _extract_token(request: Request, authorization: Optional[str], cookie_name: str) -> str:
    """Cookie-first, Authorization-header fallback."""
    token = request.cookies.get(cookie_name) if request else None
    if token:
        return token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return ""


# ==================== MODELS ====================

class EmployeeCreate(BaseModel):
    name: str
    employee_id: str
    password: str
    role: Optional[str] = "sheet_manager"  # Role: sheet_manager, content_manager, etc.


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeLogin(BaseModel):
    employee_id: str
    password: str


# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_employee_token(employee: dict) -> str:
    """Generate JWT token for employee"""
    payload = {
        "id": employee["id"],
        "employee_id": employee["employee_id"],
        "name": employee["name"],
        "role": employee["role"],
        "type": "employee",
        "exp": datetime.now(timezone.utc).timestamp() + (24 * 60 * 60)  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def verify_employee_token(request: Request, authorization: str = Header(None)):
    """Verify employee JWT token (cookie-first, Bearer fallback)"""
    token = _extract_token(request, authorization, EMPLOYEE_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

        if payload.get("type") != "employee":
            raise HTTPException(status_code=403, detail="Not an employee token")

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def verify_admin_token(request: Request, authorization: str = Header(None)):
    """Verify admin authentication for employee management (cookie-first, Bearer fallback).

    Accepts BOTH:
      - The new `ceibaa_admin_token` cookie / Bearer header (DB-backed admin session)
      - Legacy JWT tokens where the `role` field on the user doc is "admin"
    """
    token = _extract_token(request, authorization, ADMIN_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    try:
        # 1) Try admin_sessions table (set on admin login)
        admin_session = await db.admin_sessions.find_one({"token": token})
        if admin_session:
            return {
                "id": admin_session.get("user_id"),
                "user_id": admin_session.get("user_id"),
                "username": admin_session.get("username"),
                "role": admin_session.get("role", "admin"),
            }

        # 2) Legacy admin_authenticated placeholder
        if token == "admin_authenticated":
            return {"id": "admin", "user_id": "admin", "role": "admin"}

        # 3) Legacy JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

        user_id = payload.get("id") or payload.get("user_id") or payload.get("sub")
        if user_id:
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user and (user.get("is_admin") or user.get("role") in ["admin", "super_admin"]):
                return payload

        raise HTTPException(status_code=403, detail="Admin access required")
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ==================== EMPLOYEE AUTH ROUTES ====================

@router.post("/employee/login")
async def employee_login(credentials: EmployeeLogin, response: Response):
    """Employee login endpoint — dual-mode (cookie + JSON token)"""
    try:
        # Find employee by employee_id
        employee = await db.employees.find_one(
            {"employee_id": credentials.employee_id},
            {"_id": 0}
        )
        
        if not employee:
            raise HTTPException(status_code=401, detail="Invalid employee ID or password")
        
        # Check if employee is active
        if not employee.get("is_active", True):
            raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact admin.")
        
        # Verify password
        hashed_password = hash_password(credentials.password)
        if employee.get("password_hash") != hashed_password:
            raise HTTPException(status_code=401, detail="Invalid employee ID or password")
        
        # Update last login
        await db.employees.update_one(
            {"employee_id": credentials.employee_id},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Generate token
        token = generate_employee_token(employee)

        # Dual-mode: set httpOnly cookie + return token in JSON
        _set_employee_cookie(response, token)

        return {
            "success": True,
            "token": token,
            "employee": {
                "id": employee["id"],
                "employee_id": employee["employee_id"],
                "name": employee["name"],
                "role": employee["role"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employee/logout")
async def employee_logout(response: Response):
    """Logout employee — clears cookie."""
    _clear_employee_cookie(response)
    return {"success": True, "message": "Logged out"}


@router.get("/employee/me")
async def get_employee_profile(employee: dict = Depends(verify_employee_token)):
    """Get current employee profile"""
    try:
        emp = await db.employees.find_one(
            {"id": employee["id"]},
            {"_id": 0, "password_hash": 0}
        )
        
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return {"success": True, "employee": emp}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADMIN EMPLOYEE MANAGEMENT ====================

@router.get("/admin/employees")
async def get_all_employees(admin: dict = Depends(verify_admin_token)):
    """Get all employees (Admin only)"""
    try:
        employees = await db.employees.find(
            {},
            {"_id": 0, "password_hash": 0}
        ).sort("created_at", -1).to_list(1000)
        
        return {"success": True, "employees": employees}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/employees")
async def create_employee(employee_data: EmployeeCreate, admin: dict = Depends(verify_admin_token)):
    """Create a new employee (Admin only)"""
    try:
        # Check if employee_id already exists
        existing = await db.employees.find_one({"employee_id": employee_data.employee_id})
        if existing:
            raise HTTPException(status_code=400, detail="Employee ID already exists")
        
        # Create employee record
        employee = {
            "id": str(uuid.uuid4()),
            "employee_id": employee_data.employee_id,
            "name": employee_data.name,
            "password_hash": hash_password(employee_data.password),
            "role": employee_data.role,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": admin.get("id") or admin.get("user_id"),
            "last_login": None,
            "sheets_added": 0,
            "questions_added": 0
        }
        
        await db.employees.insert_one(employee)
        
        # Remove sensitive data for response
        employee.pop("password_hash", None)
        
        return {
            "success": True,
            "message": f"Employee '{employee_data.name}' created successfully",
            "employee": employee
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/employees/{employee_id}")
async def update_employee(
    employee_id: str, 
    update_data: EmployeeUpdate, 
    admin: dict = Depends(verify_admin_token)
):
    """Update employee details (Admin only)"""
    try:
        # Find employee
        employee = await db.employees.find_one({"id": employee_id})
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Build update document
        update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if update_data.name is not None:
            update_doc["name"] = update_data.name
        
        if update_data.password is not None:
            update_doc["password_hash"] = hash_password(update_data.password)
        
        if update_data.role is not None:
            update_doc["role"] = update_data.role
        
        if update_data.is_active is not None:
            update_doc["is_active"] = update_data.is_active
        
        await db.employees.update_one(
            {"id": employee_id},
            {"$set": update_doc}
        )
        
        # Get updated employee
        updated = await db.employees.find_one(
            {"id": employee_id},
            {"_id": 0, "password_hash": 0}
        )
        
        return {
            "success": True,
            "message": "Employee updated successfully",
            "employee": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/employees/{employee_id}")
async def delete_employee(employee_id: str, admin: dict = Depends(verify_admin_token)):
    """Delete an employee (Admin only)"""
    try:
        result = await db.employees.delete_one({"id": employee_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return {"success": True, "message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EMPLOYEE SHEET MANAGEMENT ====================

@router.post("/employee/sheets/add")
async def employee_add_sheet(sheet_data: dict, employee: dict = Depends(verify_employee_token)):
    """Employee adds a Google Sheet — full parity with admin flow.

    Behavior mirrors POST /admin/sheets exactly:
      1. Persist the sheet metadata to `exam_sheets`
      2. Fetch questions from the Google Sheet via GoogleSheetsService
      3. Insert every parsed question into `db.questions`
      4. Update the sheet doc with `questions_imported=True` + count
      5. Invalidate the questions cache
    """
    try:
        # Attribution + metadata
        sheet_data["added_by"] = {
            "type": "employee",
            "id": employee["id"],
            "employee_id": employee["employee_id"],
            "name": employee["name"]
        }
        sheet_data["created_at"] = datetime.now(timezone.utc).isoformat()
        sheet_data["id"] = str(uuid.uuid4())
        sheet_data["questions_imported"] = False
        sheet_data["question_count"] = 0

        # Normalize board on class-type sheets (admin does the same)
        if sheet_data.get("type") == "class":
            sheet_data["board"] = (sheet_data.get("board") or "cbse").lower()

        sheet_id = sheet_data["id"]
        sheet_link = sheet_data.get("sheet_link")

        if not sheet_link:
            raise HTTPException(status_code=400, detail="sheet_link is required")

        # 1. Save sheet metadata to exam_sheets collection (same as admin)
        await db.exam_sheets.insert_one(sheet_data.copy())

        # 2. Import questions — reuse admin's exact helpers so employee behaviour
        #    matches admin behaviour byte-for-byte (competitive exams AND classes).
        imported = 0
        import_error = None
        try:
            from admin_routes import ExamSheet, _import_sheet_questions
            exam_sheet_model = ExamSheet(
                type=sheet_data.get("type"),
                exam_name=sheet_data.get("exam_name"),
                syllabus_topic=sheet_data.get("syllabus_topic"),
                subject=sheet_data.get("subject"),
                sub_topic=sheet_data.get("sub_topic"),
                sub_sub_topic=sheet_data.get("sub_sub_topic"),
                class_name=sheet_data.get("class_name"),
                board=sheet_data.get("board"),
                chapter=sheet_data.get("chapter"),
                sheet_link=sheet_link,
            )
            imported = await _import_sheet_questions(exam_sheet_model, sheet_id)
        except Exception as e:
            import_error = str(e)
            print(f"❌ Employee sheet import failed for {sheet_id}: {e}")

        # 3. Update employee stats
        await db.employees.update_one(
            {"id": employee["id"]},
            {"$inc": {"sheets_added": 1}}
        )

        # 4. Bust any cached parses for this sheet link.
        try:
            from quiz_routes import invalidate_questions_cache
            await invalidate_questions_cache(db, sheet_url=sheet_link)
        except Exception as cache_err:
            print(f"⚠️ Cache invalidation skipped: {cache_err}")

        # 5. Return admin-shaped response so the frontend can show accurate feedback
        if imported == 0:
            return {
                "success": True,
                "message": (
                    "Sheet added but no questions were imported. "
                    "Please verify the sheet is public and has the expected columns."
                ),
                "sheet_id": sheet_id,
                "questions_imported": 0,
                "warning": import_error or "No questions parsed from the sheet."
            }
        return {
            "success": True,
            "message": f"Sheet added and {imported} question(s) imported successfully",
            "sheet_id": sheet_id,
            "questions_imported": imported
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employee/sheets")
async def get_employee_sheets(employee: dict = Depends(verify_employee_token)):
    """Get all sheets (employee can view all, same as admin)"""
    try:
        sheets = await db.exam_sheets.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        return {"success": True, "sheets": sheets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/employee/sheets/{sheet_id}")
async def employee_delete_sheet(sheet_id: str, employee: dict = Depends(verify_employee_token)):
    """Employee can delete sheets they added"""
    try:
        # Check if sheet exists and was added by this employee
        sheet = await db.exam_sheets.find_one({"id": sheet_id})
        
        if not sheet:
            raise HTTPException(status_code=404, detail="Sheet not found")
        
        # Allow deletion if employee added it or if they have admin-like role
        added_by = sheet.get("added_by", {})
        if added_by.get("id") != employee["id"] and employee.get("role") != "admin":
            raise HTTPException(status_code=403, detail="You can only delete sheets you added")
        
        await db.exam_sheets.delete_one({"id": sheet_id})
        
        # Update employee stats
        if added_by.get("id") == employee["id"]:
            await db.employees.update_one(
                {"id": employee["id"]},
                {"$inc": {"sheets_added": -1}}
            )

        # Bust any cached parses for this sheet link.
        sheet_url = sheet.get("sheet_link")
        if sheet_url:
            try:
                from quiz_routes import invalidate_questions_cache
                await invalidate_questions_cache(db, sheet_url=sheet_url)
            except Exception as cache_err:
                print(f"⚠️ Cache invalidation skipped: {cache_err}")
        
        return {"success": True, "message": "Sheet deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

