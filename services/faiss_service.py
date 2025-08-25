import os
import sys
import pandas as pd
import asyncio
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from typing import Optional
from config import DATA_DIR, get_faiss_index_dir, DEFAULT_EMBEDDING_MODEL
from models.embedding_utils import get_embedding_model
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.document import Document

LOCK_FILE = "faiss_index.lock"

def safe_build_faiss(model_key: str | None = None):
    """若指定模型的 FAISS index 不存在則建立。
    以 multilingual-e5-large 為預設。"""
    if not model_key:
        model_key = DEFAULT_EMBEDDING_MODEL
    faiss_dir = get_faiss_index_dir(model_key)
    if not faiss_dir.exists():
        faiss_dir.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(f"{model_key}_{LOCK_FILE}", "x"):
                print(f"建立 {model_key} 資料庫")
                build_faiss_from_excel(model_key=model_key)
                print(f"建立 {model_key} 資料庫完成")
        except FileExistsError:
            print(f"其他 worker 正在建立 {model_key} 資料庫，等待完成")
            while not faiss_dir.exists():
                import time; time.sleep(1)
        finally:
            lock_path = f"{model_key}_{LOCK_FILE}"
            if os.path.exists(lock_path):
                os.remove(lock_path)
    else:
        print(f"{model_key} 已有資料庫")

def build_faiss_from_excel(excel_path: Optional[str] = None, model_key: str | None = None):
    try:
        print("開始建立 FAISS index")
        if excel_path is None:
            excel_path = str(DATA_DIR / "CIM_SMS_QA收集.xlsx")
        if not Path(excel_path).exists():
            raise FileNotFoundError(f"找不到 Excel 檔案：{excel_path}")

        df = pd.read_excel(excel_path, engine="openpyxl")
        documents = [
            Document(
                page_content=f"{row['Question.']}",
                metadata={
                    "question": row['Question.'],
                    "answer": row['Anser.']
                }
            )
            for _, row in df.iterrows()
            if pd.notna(row['Question.']) and pd.notna(row['Anser.'])
        ]

        embedding_model = get_embedding_model(model_key)
        faiss_db = FAISS.from_documents(documents, embedding_model)
        target_dir = get_faiss_index_dir(model_key)
        faiss_db.save_local(target_dir)
        print(f"FAISS資料庫成功建立至 {target_dir}.")
    except Exception as e:
        print(f"發生錯誤：{e}")

async def query_faiss(query_text: str, top_k: int = 5, model_key: str | None = None):
    try:
        def sync_query():
            embedding_model = get_embedding_model(model_key)
            faiss_db = FAISS.load_local(get_faiss_index_dir(model_key), embedding_model, allow_dangerous_deserialization=True)
            docs_with_scores = faiss_db.similarity_search_with_score(query_text, k=top_k)

            results = []
            for i, (doc, score) in enumerate(docs_with_scores):
                results.append({
                    "index": i,
                    "score": float(score),
                    "data": {
                        "question": doc.metadata.get("question", ""),
                        "answer": doc.metadata.get("answer", ""),
                        "text": doc.page_content
                    }
                })

            return results

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, sync_query)

    except Exception as e:
        print(f"查詢錯誤：{e}")
        return []












