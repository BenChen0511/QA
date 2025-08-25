from config import DEFAULT_EMBEDDING_MODEL
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from controllers import qa_controller, login_controller, main_controller
from services.faiss_service import safe_build_faiss
import mimetypes

print(f"啟動：檢查預設 embedding 模型 ({DEFAULT_EMBEDDING_MODEL}) 的 FAISS index")
safe_build_faiss(DEFAULT_EMBEDDING_MODEL)

# 確保 .js 以正確 MIME (application/javascript) 回傳，避免瀏覽器模組載入失敗
# Windows / 某些 Python 版本可能預設登記為 text/plain
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key="bang-secret-key",
    https_only=False
)

app.include_router(qa_controller.router)
app.include_router(login_controller.router)
app.include_router(main_controller.router)

app.mount("/static", StaticFiles(directory="static"), name="static")



