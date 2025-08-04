from pathlib import Path

# 自動偵測專案根目錄（假設 config.py 在 src/ 或 utils/ 內）
root_dir = Path(__file__).resolve().parent

# 定義常用路徑
FAISS_INDEX_DIR = root_dir / "data" / "faiss_data" / "faiss_index"
EMBEDDING_DIR = root_dir / "data" / "all-MiniLM-L6-v2" / "all-MiniLM-L6-v2"
BERT_DIR = root_dir / "data" / "bert-base-chinese"
DATA_DIR = root_dir / "data"
LOG_DIR = root_dir / "logs"
