from template_loader import templates
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "base.html",
        {
            "request": request,
            "admin": bool(request.session.get("admin", False)),
            "username": request.session.get("username"),
        },
    )