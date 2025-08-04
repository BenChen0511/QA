from fastapi import APIRouter, Request, Query
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from template_loader import templates
from pydantic import BaseModel
from services.retrieval_service import get_qa_components
from services.faiss_service import search_faiss
from langchain_core.documents import Document
import httpx

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("base.html", {"request": request})

@router.get("/query", response_class=StreamingResponse)
async def query_stream(question: str):
    llm, retriever, qa_chain = get_qa_components()   

    async def stream_answer():
        #corpus = [doc.page_content for doc in retriever.vectorstore.similarity_search(question, k=20)]
        #results_list = expand_query(question, corpus, retriever.vectorstore, top_k=3)
        #merged_results = merge_results(results_list)
        retrieved_docs = retriever.invoke({"question": question})
        modified_docs = [
            Document(
                page_content=f"問題：{doc.metadata.get('question', '')}\n回答：{doc.metadata.get('answer', '')}",
                metadata=doc.metadata 
            )
            for doc in retrieved_docs
        ]

        # RAG：將文件與問題餵給 QA Chain
        async for chunk in qa_chain.astream({"context": modified_docs, "question": question}):
            yield chunk

    return StreamingResponse(stream_answer(), media_type="text/plain")

@router.get("/search")
async def search(keyword: str = Query(...), top_k: int = Query(5)):
    try:
        results = await search_faiss(keyword, top_k)

        return JSONResponse(content=results)
    except Exception as e:
        print(e)
        return JSONResponse(status_code=500, content={"error": str(e)})
    
    
    
class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/api/login")
async def login(data: LoginRequest):
    try:
        url = "https://hcpuse.unimicron.com/HCPAPI/XUMTC_HcpAPPHandler.asmx/getXumtcPkAppLogin"
        params = {
            "SOURCE": "QA",
            "USERNAME_NO_SZ": data.username,
            "PWD": data.password,
            "SEGMENT_NO_SZ": "Unimicron"
        }
        print(params)
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)

        if response.status_code == 200:
            # 解析 XML 回傳內容
            from xml.etree import ElementTree as ET
            root = ET.fromstring(response.text)
            result = root.text  # 取得 <string> 的內容
            print(result)
            # 根據 result 判斷登入是否成功（你可以根據實際內容調整）
            if result and "OK" in result:
                return {"success": True, "message": result}
            else:
                return {"success": False, "message": result}
        else:
            return {"success": False, "message": f"HTTP 錯誤：{response.status_code}"}
    except Exception as e:
        print(e)





