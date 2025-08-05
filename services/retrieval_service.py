import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from config import FAISS_INDEX_DIR
from models.embedding_utils import get_embedding_model

from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.runnables import RunnableLambda

def get_qa_components():

    embedding_model = get_embedding_model()
    llm = OllamaLLM(model="mistral")
    db = FAISS.load_local(str(FAISS_INDEX_DIR), embedding_model, allow_dangerous_deserialization=True)
    retriever = db.as_retriever()
    retriever_runnable = RunnableLambda(lambda x: retriever.invoke(x["question"]))
    prompt = PromptTemplate.from_template("""
    你是專門負責技術文件分析與問題解決的工程師，擅長從多段資料中歸納重點並提出建議，
    請根據以下文件內容，以專業且簡潔的語氣回答問題，並進行必要的整合與推理。

    注意事項：
    1. 回答請以文件內容為基礎，進行合理推論與歸納，請勿加入外部知識。
    2. 回答請使用繁體中文，必要時可輔以英文技術術語。
    3. 若問題與文件內容無關，請直接回答：「與知識庫資料不相符。」

    文件內容：
    {context}

    問題：
    {question}

    回答：
    """)
    
    qa_chain = create_stuff_documents_chain(llm=llm, prompt=prompt)
    
    return retriever_runnable, qa_chain

