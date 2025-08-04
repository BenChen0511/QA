import sys
import pandas as pd
import asyncio
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from config import FAISS_INDEX_DIR, DATA_DIR
from models.embedding_utils import get_embedding_model
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.document import Document

def build_faiss_from_excel():

    try:

        print("開始建立 FAISS index")
        
        excel_path = DATA_DIR / "CIM_SMS_QA收集.xlsx"
        df = pd.read_excel(excel_path, engine="openpyxl")

        documents = [
            Document(page_content=f"{row['Question.']}",
                     metadata={
                        "question": row['Question.'],
                        "answer": row['Anser.']
                    }
                )
            for _, row in df.iterrows()
            if pd.notna(row['Question.']) and pd.notna(row['Anser.'])
        ]

        embedding_model = get_embedding_model()
        faiss_db = FAISS.from_documents(documents, embedding_model)
        faiss_db.save_local(FAISS_INDEX_DIR)

        print(f"FAISS index successfully created and saved to {FAISS_INDEX_DIR}.")

    except Exception as e:
        print(f"發生錯誤：{e}")  

async def search_faiss(query_text: str, top_k: int = 5):
    try:
        def sync_search():
            embedding_model = get_embedding_model()
            faiss_db = FAISS.load_local(FAISS_INDEX_DIR, embedding_model, allow_dangerous_deserialization=True)
            docs_with_scores = faiss_db.similarity_search_with_score(query_text, k=top_k)

            # corpus_docs = faiss_db.similarity_search(query_text, k=20)
            # corpus = [doc.page_content for doc in corpus_docs]
            # expanded_results = expand_query(query_text, corpus, faiss_db, top_k=top_k)
            # merged_results = merge_results(expanded_results)


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
        return await loop.run_in_executor(None, sync_search)

    except Exception as e:
        print(f"❌ 查詢錯誤：{e}")
        return []
    

# def merge_results(results_list):
#     score_map = defaultdict(list)

#     for doc, score in results_list:
#         score_map[doc.page_content].append((doc, score))

#     merged = []
#     for text, doc_scores in score_map.items():
#         docs = [doc for doc, _ in doc_scores]
#         scores = [score for _, score in doc_scores]
#         avg_score = sum(scores) / len(scores)
#         merged.append((docs[0], avg_score))  # 保留第一個 doc 的 metadata

#     merged.sort(key=lambda x: x[1])  # 分數越低越相似
#     return merged[:5]  # List[Tuple[Document, float]]











