import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from config import get_faiss_index_dir, DEFAULT_EMBEDDING_MODEL
from models.embedding_utils import get_embedding_model

from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.runnables import RunnableLambda

def get_qa_components(model_key: str | None = None):
    if not model_key:
        model_key = DEFAULT_EMBEDDING_MODEL
    embedding_model = get_embedding_model(model_key)
    llm = OllamaLLM(model="mistral", options={"num_thread": 4})
    db = FAISS.load_local(str(get_faiss_index_dir(model_key)), embedding_model, allow_dangerous_deserialization=True)
    retriever = db.as_retriever()
    retriever.search_kwargs["k"] = 8
    retriever_runnable = RunnableLambda(lambda x: retriever.invoke(x["question"]))

    prompt = PromptTemplate.from_template("""
    You are a technical documentation analyst and problem-solving engineer. Your task is to analyze multiple documents and provide concise, professional answers based strictly on the provided content.

    Instructions:
    1. Base your answer solely on the document content. Do not use any external knowledge.
    2. Respond in Traditional Chinese. Use English technical terms when necessary.
    3. Before answering, determine whether the user's question is relevant to the document content. If not, reply only with: 「與知識庫資料不相符。」
    4. Present your answer in bullet points.
    5. Use a professional and concise tone.
    6. Only answer the question provided by the user. Do not address unrelated topics.

    Document Section Start --
    {context}
    -- Document Section End.

    User Question Start --
    {question}
    -- User Question End.

    Answer:
    """)

    
    qa_chain = create_stuff_documents_chain(llm=llm, prompt=prompt)
    
    return retriever_runnable, qa_chain

