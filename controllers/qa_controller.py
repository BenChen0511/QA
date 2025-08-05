from template_loader import templates
from fastapi import APIRouter, Request, Query
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from langchain_core.documents import Document
from services.retrieval_service import get_qa_components
from services.faiss_service import search_faiss
from ollama._types import ResponseError
from starlette.responses import StreamingResponse
from langchain_core.documents import Document

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("base.html", {"request": request})

@router.get("/query", response_class=StreamingResponse)
async def query_stream(question: str):
    retriever, qa_chain = get_qa_components()

    async def stream_answer():
        try:
            retrieved_docs = retriever.invoke({"question": question})
            modified_docs = [
                Document(
                    page_content=f"問題：{doc.metadata.get('question', '')}\n回答：{doc.metadata.get('answer', '')}",
                    metadata=doc.metadata
                )
                for doc in retrieved_docs
            ]

            async for chunk in qa_chain.astream({"context": modified_docs, "question": question}):
                yield chunk
        except ResponseError as e:
            if "model requires more system memory" in str(e):
                yield "⚠️ 系統記憶體不足，請考慮使用較小的模型或釋放更多記憶體。\n"
            else:
                yield f"❌ 發生錯誤：{str(e)}\n"
        except Exception as e:
            yield f"❌ 未知錯誤：{str(e)}\n"

    return StreamingResponse(stream_answer(), media_type="text/plain")


@router.get("/search")
async def search(keyword: str = Query(...), top_k: int = Query(5)):
    try:
        results = await search_faiss(keyword, top_k)

        return JSONResponse(content=results)
    except Exception as e:
        print(e)
        return JSONResponse(status_code=500, content={"error": str(e)})