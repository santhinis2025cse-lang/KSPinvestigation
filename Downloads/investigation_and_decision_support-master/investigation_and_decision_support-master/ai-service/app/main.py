import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
import networkx as nx

try:
    from .llm import chat as llm_chat
    from .semantic import build_case_index, search_cases, extract_investigation_keywords
except ImportError:  # pragma: no cover - supports direct script execution
    from llm import chat as llm_chat
    from semantic import build_case_index, search_cases, extract_investigation_keywords

app = FastAPI(
    title="KSP Crime Intelligence Platform — AI Core Service",
    description="""
FastAPI microservice providing:
- **DBSCAN Crime Hotspot Clustering** (Scikit-learn)
- **Criminal Network Analysis** (NetworkX centrality & community detection)
- **Semantic FIR Search** (TF-IDF vector similarity)
- **LLM Investigation Copilot** (OpenAI / Azure / Ollama / Mock)
- **Explainable AI** reasoning metadata
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Input Schemas ──────────────────────────────────────────────────────────────

class Coordinate(BaseModel):
    lat: float
    lng: float
    weight: Optional[float] = 1.0

class HotspotRequest(BaseModel):
    coordinates: List[Coordinate]
    eps_meters: Optional[float] = 500.0
    min_samples: Optional[int] = 3

class Edge(BaseModel):
    source: str
    target: str
    weight: Optional[float] = 1.0

class NetworkRequest(BaseModel):
    edges: List[Edge]

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""
    user_role: Optional[str] = "POLICE_OFFICER"
    district: Optional[str] = None

class CaseIndexRequest(BaseModel):
    cases: List[Dict[str, Any]]

class SemanticSearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


# ── Health Check ───────────────────────────────────────────────────────────────

@app.get("/api/ai/health", tags=["System"])
def health_check():
    """Returns the operational status and loaded models."""
    llm_provider = os.getenv("LLM_PROVIDER", "mock")
    return {
        "status": "ONLINE",
        "version": "2.0.0",
        "models": {
            "clustering": "DBSCAN (Scikit-learn)",
            "network_analysis": "NetworkX Centrality + Community Detection",
            "semantic_search": "TF-IDF Cosine Similarity",
            "llm_provider": llm_provider.upper(),
        },
        "capabilities": [
            "crime_hotspot_prediction",
            "criminal_network_analysis",
            "semantic_fir_search",
            "ai_copilot_chat",
            "explainable_ai"
        ]
    }


# ── Crime Hotspot Clustering ───────────────────────────────────────────────────

@app.post("/api/ai/predict", tags=["Geospatial"])
def predict_hotspots(req: HotspotRequest):
    """
    **DBSCAN Crime Hotspot Clustering**
    
    Groups incident coordinates into density-based clusters.
    Returns cluster centers, radii, risk levels, and incident counts.
    """
    if len(req.coordinates) < req.min_samples:
        return {
            "hotspots": [],
            "total_points": len(req.coordinates),
            "cluster_count": 0,
            "message": f"Need at least {req.min_samples} coordinate points to compute clusters."
        }

    df = pd.DataFrame([{"lat": c.lat, "lng": c.lng, "weight": c.weight or 1.0} for c in req.coordinates])

    # Convert epsilon from meters to radians
    kms_per_radian = 6371.0088
    epsilon = (req.eps_meters / 1000.0) / kms_per_radian

    coords = np.radians(df[['lat', 'lng']])
    dbscan = DBSCAN(eps=epsilon, min_samples=req.min_samples, algorithm='ball_tree', metric='haversine')
    dbscan.fit(coords)
    df['cluster'] = dbscan.labels_

    clusters = []
    unique_labels = set(dbscan.labels_)
    for label in unique_labels:
        if label == -1:
            continue

        cluster_points = df[df['cluster'] == label]
        center_lat = float(cluster_points['lat'].mean())
        center_lng = float(cluster_points['lng'].mean())
        incident_count = len(cluster_points)
        weighted_density = float(cluster_points['weight'].sum())

        # Calculate spread radius from farthest point
        dists = np.sqrt(
            ((cluster_points['lat'] - center_lat) ** 2) +
            ((cluster_points['lng'] - center_lng) ** 2)
        )
        radius_deg = float(dists.max()) if len(dists) > 0 else 0
        radius_meters = radius_deg * 111000  # approx 111km per degree

        risk_index = "HIGH" if incident_count >= 8 or weighted_density >= 6 else \
                     "MEDIUM" if incident_count >= 4 else "LOW"

        clusters.append({
            "id": f"cluster-{label}",
            "center": {"lat": center_lat, "lng": center_lng},
            "incident_count": incident_count,
            "weighted_density": round(weighted_density, 2),
            "estimated_radius_meters": round(max(radius_meters, req.eps_meters * 0.5), 1),
            "risk_index": risk_index,
        })

    return {
        "hotspots": sorted(clusters, key=lambda x: x["incident_count"], reverse=True),
        "total_points": len(df),
        "cluster_count": len(clusters),
        "noise_points": int((df['cluster'] == -1).sum()),
    }


# ── Criminal Network Analysis ─────────────────────────────────────────────────

@app.post("/api/ai/network", tags=["Network Analysis"])
def analyze_network(req: NetworkRequest):
    """
    **NetworkX Criminal Association Graph Analysis**
    
    Computes degree centrality, betweenness centrality, and community groupings
    from criminal association edges. Identifies key influencers and gang clusters.
    """
    if not req.edges:
        raise HTTPException(status_code=400, detail="Edges list cannot be empty")

    G = nx.Graph()
    for edge in req.edges:
        G.add_edge(edge.source, edge.target, weight=edge.weight)

    nodes = list(G.nodes())
    if len(nodes) == 0:
        return {"centrality_ranking": [], "community_groupings": [], "edge_count": 0, "node_count": 0}

    # Degree centrality — relative node influence
    degree_centrality = nx.degree_centrality(G)

    # Betweenness centrality — broker/coordinator nodes (only for smaller graphs)
    betweenness_centrality: Dict[str, float] = {}
    if len(nodes) <= 500:
        betweenness_centrality = nx.betweenness_centrality(G, normalized=True)

    # PageRank — overall importance score
    pagerank: Dict[str, float] = {}
    try:
        pagerank = nx.pagerank(G, alpha=0.85, max_iter=100)
    except Exception:
        pass

    influence_ranking = []
    for node in nodes:
        influence_ranking.append({
            "node": node,
            "degree_centrality": round(float(degree_centrality.get(node, 0)), 4),
            "betweenness_centrality": round(float(betweenness_centrality.get(node, 0)), 4),
            "pagerank": round(float(pagerank.get(node, 0)), 4),
            "connections": G.degree(node),
            "risk_category": "KEY_PLAYER" if degree_centrality.get(node, 0) > 0.5
                             else "COORDINATOR" if degree_centrality.get(node, 0) > 0.2
                             else "PERIPHERAL",
        })

    # Community detection via connected components (Louvain not available offline)
    components = list(nx.connected_components(G))
    communities = []
    for idx, comp in enumerate(sorted(components, key=len, reverse=True)):
        communities.append({
            "community_id": idx,
            "members": list(comp),
            "size": len(comp),
            "risk": "HIGH" if len(comp) >= 5 else "MEDIUM" if len(comp) >= 3 else "LOW",
        })

    return {
        "centrality_ranking": sorted(influence_ranking, key=lambda x: x["degree_centrality"], reverse=True),
        "community_groupings": communities[:20],  # Top 20 communities
        "edge_count": len(req.edges),
        "node_count": len(nodes),
        "key_players": [n["node"] for n in influence_ranking if n["risk_category"] == "KEY_PLAYER"],
    }


# ── Semantic FIR Search & Indexing ────────────────────────────────────────────

@app.post("/api/ai/index", tags=["Semantic Search"])
def index_cases(req: CaseIndexRequest):
    """Index FIR case documents for semantic search."""
    build_case_index(req.cases)
    return {"status": "indexed", "document_count": len(req.cases)}


@app.post("/api/ai/search", tags=["Semantic Search"])
def semantic_search(req: SemanticSearchRequest):
    """
    **Semantic FIR Search using TF-IDF**
    
    Finds FIR cases most semantically similar to the query string.
    Returns ranked results with similarity scores.
    """
    results = search_cases(req.query, top_k=req.top_k)
    keywords = extract_investigation_keywords(req.query)
    return {
        "results": results,
        "keywords": keywords,
        "query": req.query,
        "total_results": len(results),
    }


# ── AI Investigation Copilot ─────────────────────────────────────────────────

@app.post("/api/ai/chat", tags=["AI Copilot"])
def chat_copilot(req: ChatRequest):
    """
    **LLM Investigation Copilot**
    
    Routes natural language queries to the configured LLM provider.
    Enriches responses with semantic search results and XAI explanations.
    Supports: OpenAI, Azure OpenAI, Ollama (local), and intelligent mock mode.
    """
    # Run semantic search on the query for context enrichment
    semantic_results = search_cases(req.message, top_k=3)
    keywords = extract_investigation_keywords(req.message)

    # Build enriched context
    enriched_context = req.context or ""
    if semantic_results:
        enriched_context += "\n\nSemantically Related Cases:\n"
        for r in semantic_results:
            enriched_context += f"- {r.get('fir_number', 'N/A')}: {str(r.get('summary', ''))[:150]}\n"

    # Call LLM
    llm_result = llm_chat(req.message, enriched_context)

    return {
        "response": llm_result["response"],
        "recommendations": llm_result["recommendations"],
        "explainable_ai": llm_result["explainable_ai"],
        "semantic_matches": semantic_results[:3],
        "extracted_keywords": keywords,
        "provider": llm_result["provider"],
        "table": [],  # Populated by Express backend from DB
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
