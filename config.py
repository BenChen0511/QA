from pathlib import Path

# 專案根目錄
root_dir = Path(__file__).resolve().parent

# ==== 模型與資料路徑設定 ====
MINI_EMBEDDING_DIR = root_dir / "data" / "all-MiniLM-L6-v2"
E5_EMBEDDING_DIR = root_dir / "data" / "multilingual-e5-large"
BERT_DIR = root_dir / "data" / "bert-base-chinese"

DATA_DIR = root_dir / "data"
LOG_DIR = root_dir / "logs"

# 統一的 FAISS Index 根目錄 (各模型分資料夾存放)
FAISS_INDEX_ROOT = root_dir / "data" / "faiss_data"

# 支援的 embedding 模型映射
EMBEDDING_MODEL_PATHS = {
	"mini": MINI_EMBEDDING_DIR,
	"e5": E5_EMBEDDING_DIR,
}

DEFAULT_EMBEDDING_MODEL = "e5"

def get_faiss_index_dir(model_key: str | None = None):
	if not model_key:
		model_key = DEFAULT_EMBEDDING_MODEL
	return FAISS_INDEX_ROOT / model_key / "faiss_index"

