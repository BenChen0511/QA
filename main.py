from config import FAISS_INDEX_DIR
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from controllers import qa_controller, login_controller
from services.faiss_service import build_faiss_from_excel

@asynccontextmanager
async def lifespan(app: FastAPI):

    print(f"檢查路徑:{FAISS_INDEX_DIR}")
    if FAISS_INDEX_DIR.exists():

        print("已有資料庫")

    else:
        print("建立資料庫")
        build_faiss_from_excel()
        print("建立資料庫完成")
    yield # 如果有需要在關閉時做清理，可以在 yield 之後加上程式碼


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(qa_controller.router)
app.include_router(login_controller.router)
app.mount("/static", StaticFiles(directory="static"), name="static")



