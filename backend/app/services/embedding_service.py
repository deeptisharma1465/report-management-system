from functools import lru_cache

import numpy as np

from app.core.config import settings


@lru_cache(maxsize=1)
def _get_model():
    # Imported lazily so the API starts fast; the model loads on first use.
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.embedding_model_name)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    vectors = _get_model().encode(
        texts,
        normalize_embeddings=True,  # unit vectors: dot product == cosine
        batch_size=32,
        show_progress_bar=False,
    )
    return np.asarray(vectors, dtype=np.float32).tolist()


def embed_query(query: str) -> list[float]:
    return embed_texts([query])[0]