import ssl
import httpx
from pydantic import BaseModel
from xml.etree import ElementTree
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from template_loader import templates

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/api/login")
async def login(request: Request, data: LoginRequest):
    try:
        url = "https://hcpuse.unimicron.com/HCPAPI/XUMTC_HcpAPPHandler.asmx/getXumtcPkAppLogin"
        params = {
            "SOURCE": "QA",
            "USERNAME_NO_SZ": data.username,
            "PWD": data.password,
            "SEGMENT_NO_SZ": "Unimicron"
        }
        
        ssl_context = ssl.create_default_context()
        ssl_context.options |= 0x4
        
        async with httpx.AsyncClient(verify=ssl_context) as client:
            response = await client.get(url, params=params)
        if response.status_code == 200:
            root = ElementTree.fromstring(response.text)
            result = root.text
            print(result)
            
            if result and "OK" in result:
                return templates.TemplateResponse("logoutButton.html", {"request": request, "username": data.username})
            else:
                return HTMLResponse(f"登入失敗{result}", status_code=401)
        else:
            return {"success": False, "message": f"HTTP 錯誤：{response.status_code}"}
    except Exception as e:
        print(e)
        return {"success": False, "message": f"{e}"}
        
        
@router.get("/api/logout", response_class=HTMLResponse)
async def logout(request: Request):
   return templates.TemplateResponse("loginButton.html", {"request": request})


