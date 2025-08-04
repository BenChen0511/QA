from models.embedding_utils import get_SentenceTransformer_model, get_bert_model
from sklearn.metrics.pairwise import cosine_similarity
from keybert import KeyBERT
import torch

# def expand_query(query: str, top_n: int = 5) -> str:
#     embedding_model = get_SentenceTransformer_model()
#     keywords = kw_model.extract_keywords(query, 
#                                          keyphrase_ngram_range=(1, 3), 
#                                          stop_words=None,
#                                          top_n=top_n)
#     expanded_terms = [kw[0] for kw in keywords]
#     return query + " " + " ".join(expanded_terms)

# def expand_query(query_text: str, corpus: list[str], faiss_db, top_k: int = 3) -> list[tuple[str, float]]:
#     tokenizer, model = get_bert_model()
#     try:
#         # 查詢向量
#         inputs = tokenizer(query_text, return_tensors="pt", truncation=True, padding=True)
#         with torch.no_grad():
#             query_vec = model(**inputs).last_hidden_state[:, 0, :].squeeze(0).numpy()

#         # 語料向量
#         corpus_vecs = []
#         for text in corpus:
#             inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
#             with torch.no_grad():
#                 vec = model(**inputs).last_hidden_state[:, 0, :].squeeze(0).numpy()
#             corpus_vecs.append(vec)

#         # 計算相似度
#         similarities = cosine_similarity([query_vec], corpus_vecs)[0]
#         top_indices = similarities.argsort()[-top_k:][::-1]

#         # 擴展查詢語句
#         expanded_queries = [corpus[i] for i in top_indices]

#         # 執行 FAISS 搜尋
#         all_results = []
#         for q in expanded_queries:
#             results = faiss_db.similarity_search_with_score(q, k=top_k)
#             all_results.extend(results)

#         return all_results
#     except Exception as e:
#         print(e)


