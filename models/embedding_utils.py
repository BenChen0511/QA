from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
from transformers import BertTokenizer, BertModel
from config import EMBEDDING_MODEL_PATHS, BERT_DIR, DEFAULT_EMBEDDING_MODEL

def get_embedding_model(model_key: str | None = None):
    """取得指定 key 的 HuggingFaceEmbeddings (未指定用預設 e5)。"""
    if not model_key:
        model_key = DEFAULT_EMBEDDING_MODEL
    model_path = EMBEDDING_MODEL_PATHS.get(model_key)
    if model_path is None:
        raise ValueError(f"未知的 embedding model key: {model_key}; 可用: {list(EMBEDDING_MODEL_PATHS.keys())}")
    return HuggingFaceEmbeddings(
        model_name=str(model_path),
        model_kwargs={"device": "cpu"}
    )

def get_SentenceTransformer_model(model_key: str | None = None):
    if not model_key:
        model_key = DEFAULT_EMBEDDING_MODEL
    model_path = EMBEDDING_MODEL_PATHS.get(model_key)
    if model_path is None:
        raise ValueError(f"未知的 embedding model key: {model_key}")
    return SentenceTransformer(str(model_path))

def get_bert_model():
    tokenizer = BertTokenizer.from_pretrained(BERT_DIR)
    model = BertModel.from_pretrained(BERT_DIR)
    return tokenizer, model
    
