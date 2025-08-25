import os
import csv
import shutil
import logging
from datetime import datetime
from pydantic import BaseModel
from template_loader import templates
from fastapi import APIRouter, Request, Query, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from langchain_core.documents import Document
from services.retrieval_service import get_qa_components
from services.faiss_service import query_faiss, build_faiss_from_excel, safe_build_faiss
from config import DEFAULT_EMBEDDING_MODEL
from ollama._types import ResponseError
from starlette.responses import StreamingResponse
from langchain_core.documents import Document

router = APIRouter()

logger = logging.getLogger(__name__)

class Feedback(BaseModel):
    question: str
    answer: str
    feedback: str

@router.get("/search", response_class=StreamingResponse)
async def search_stream(question: str, model: str | None = Query(default=None, description="embedding model key")):
    retriever, qa_chain = get_qa_components(model)

    async def stream_answer():
        try:
            retrieved_docs = retriever.invoke({"question": question})
            modified_docs = [
                Document(
                    page_content=f"question：{doc.metadata.get('question', '')}\n answer：{doc.metadata.get('answer', '')}",
                    metadata=doc.metadata
                )
                for doc in retrieved_docs
            ]

            async for chunk in qa_chain.astream({"context": modified_docs, "question": question}):
                yield chunk
        except ResponseError as e:
            logger.error(f"發生錯誤： {str(e)}", exc_info=True)
            yield f"發生錯誤：{str(e)}\n"
        except Exception as e:
            logger.error(f"發生錯誤： {str(e)}", exc_info=True)
            yield f"未知錯誤：{str(e)}\n"

    return StreamingResponse(stream_answer(), media_type="text/plain")

@router.get("/query")
async def query(keyword: str = Query(...), top_k: int = Query(10), model: str | None = Query(default=None, description="embedding model key")):
    try:
        results = await query_faiss(keyword, top_k, model)
        return JSONResponse(content=results)
    except Exception as e:
        logger.error(f"搜尋失敗: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), model: str | None = Query(default=None, description="embedding model key")):
    try:
        filename = file.filename

        # 建立時間戳記資料夾
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_path = os.path.join("data", "uploads", timestamp)
        os.makedirs(folder_path, exist_ok=True)

        # 儲存檔案
        file_location = f"{folder_path}/{filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 建立資料庫
        build_faiss_from_excel(file_location, model_key=model)
        # 若為預設模型尚未建立則觸發 safe (或多模型手動建立) - 可選
        if model is None:
            safe_build_faiss(DEFAULT_EMBEDDING_MODEL)

        return {
            "filename": filename,
            "saved_path": file_location,
            "message": "檔案上傳建立成功"
        }
    
    except Exception as e:
        logger.error(f"建立資料庫失敗: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="建立資料庫失敗，請稍後再試")

@router.post("/api/feedback")
async def receive_feedback(request: Request, data: Feedback):
    username = request.session.get("username", "anonymous")
    
    with open("data/feedback.csv", mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        if not os.path.isfile("data/feedback.csv"):
            writer.writerow(["username", "question", "answer", "feedback"])
        writer.writerow([username, data.question, data.answer, data.feedback])

    return {"message": "回饋已收到"}


