from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
from transformers import BertTokenizer, BertModel
from config import EMBEDDING_DIR, BERT_DIR

def get_embedding_model():
    return HuggingFaceEmbeddings(
        model_name = str(EMBEDDING_DIR),
        model_kwargs = {"device": "cpu"}
    )

def get_SentenceTransformer_model():
    return SentenceTransformer(str(EMBEDDING_DIR))

def get_bert_model():
    tokenizer = BertTokenizer.from_pretrained(BERT_DIR)
    model = BertModel.from_pretrained(BERT_DIR)
    return tokenizer, model
    
