"""
Semantic Search Engine — KSP Crime Intelligence Platform
Uses TF-IDF vectorization for offline semantic similarity without external APIs.
Can be extended to use sentence-transformers or OpenAI embeddings.
"""

from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re


class SemanticSearchEngine:
    """
    TF-IDF based semantic search engine for police case documents.
    Operates fully offline with no external API dependencies.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),
            stop_words='english',
            max_features=5000,
            min_df=1,
            sublinear_tf=True,  # Apply log normalization
        )
        self._corpus: List[str] = []
        self._metadata: List[Dict[str, Any]] = []
        self._fitted = False

    def index_documents(self, documents: List[Dict[str, Any]], text_field: str = 'text') -> None:
        """
        Index a list of documents for semantic search.
        Each document must have a `text_field` key and any additional metadata.
        """
        self._corpus = [self._preprocess(doc.get(text_field, '')) for doc in documents]
        self._metadata = documents

        if len(self._corpus) > 0:
            self.vectorizer.fit(self._corpus)
            self._fitted = True

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search indexed documents for the most semantically similar results.
        Returns top_k results sorted by similarity score.
        """
        if not self._fitted or len(self._corpus) == 0:
            return []

        query_processed = self._preprocess(query)
        query_vec = self.vectorizer.transform([query_processed])
        corpus_vecs = self.vectorizer.transform(self._corpus)

        similarities = cosine_similarity(query_vec, corpus_vecs)[0]
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            if similarities[idx] > 0.01:  # Minimum similarity threshold
                result = dict(self._metadata[idx])
                result['similarity_score'] = float(similarities[idx])
                results.append(result)

        return results

    def get_related(self, document_idx: int, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Find documents most similar to a given document by index.
        Used for 'Related Cases' recommendations.
        """
        if not self._fitted or document_idx >= len(self._corpus):
            return []

        corpus_vecs = self.vectorizer.transform(self._corpus)
        doc_vec = corpus_vecs[document_idx]

        similarities = cosine_similarity(doc_vec, corpus_vecs)[0]
        top_indices = np.argsort(similarities)[::-1][1:top_k + 1]  # Exclude self

        results = []
        for idx in top_indices:
            if similarities[idx] > 0.05:
                result = dict(self._metadata[idx])
                result['similarity_score'] = float(similarities[idx])
                results.append(result)

        return results

    def extract_keywords(self, text: str, top_n: int = 8) -> List[str]:
        """
        Extract the most important keywords from a text using TF-IDF scores.
        """
        if not self._fitted:
            return []

        processed = self._preprocess(text)
        vec = self.vectorizer.transform([processed])
        feature_names = self.vectorizer.get_feature_names_out()
        scores = vec.toarray()[0]
        top_indices = np.argsort(scores)[::-1][:top_n]

        return [feature_names[i] for i in top_indices if scores[i] > 0]

    def _preprocess(self, text: str) -> str:
        """Lowercase, remove special chars, normalize whitespace."""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text


# Singleton instance
semantic_engine = SemanticSearchEngine()


def build_case_index(cases: List[Dict[str, Any]]) -> None:
    """
    Index a batch of FIR cases from the database.
    Expected fields: fir_number, summary, category, station, address
    """
    documents = []
    for case in cases:
        combined_text = ' '.join(filter(None, [
            case.get('fir_number', ''),
            case.get('summary', ''),
            case.get('category', ''),
            case.get('station', ''),
            case.get('address', ''),
        ]))
        doc = dict(case)
        doc['text'] = combined_text
        documents.append(doc)

    semantic_engine.index_documents(documents, text_field='text')


def search_cases(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    return semantic_engine.search(query, top_k=top_k)


def get_related_cases(case_index: int, top_k: int = 3) -> List[Dict[str, Any]]:
    return semantic_engine.get_related(case_index, top_k=top_k)


def extract_investigation_keywords(text: str) -> List[str]:
    return semantic_engine.extract_keywords(text)
