from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/ai/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "DBSCAN_Clustering" in data["models"]

def test_predict_hotspots_insufficient_data():
    # Send empty coordinates list, should handle gracefully
    payload = {
        "coordinates": [],
        "min_samples": 2
    }
    response = client.post("/api/ai/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "hotspots" in data
    assert len(data["hotspots"]) == 0

def test_predict_hotspots_clustering():
    # Send mock coordinates near Indiranagar signal
    payload = {
        "coordinates": [
            {"lat": 12.9718, "lng": 77.6411},
            {"lat": 12.9719, "lng": 77.6412},
            {"lat": 12.9717, "lng": 77.6410}
        ],
        "eps_meters": 500.0,
        "min_samples": 2
    }
    response = client.post("/api/ai/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "hotspots" in data
    assert data["cluster_count"] >= 1
    assert data["hotspots"][0]["risk_index"] == "MEDIUM"

def test_network_analysis():
    payload = {
        "edges": [
            {"source": "Ramesh", "target": "Manjunath"},
            {"source": "Shaji", "target": "Syed"},
            {"source": "Ramesh", "target": "Shaji"}
        ]
    }
    response = client.post("/api/ai/network", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "centrality_ranking" in data
    assert "community_groupings" in data
    # Ramesh is linked to both Manjunath and Shaji, should have highest centrality
    assert data["centrality_ranking"][0]["node"] == "Ramesh"
