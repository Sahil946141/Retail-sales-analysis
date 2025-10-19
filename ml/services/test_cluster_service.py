# services/test_cluster_service.py
from utils.db_connection import get_db_engine
from services.cluster_service import run_kmeans_clustering

def test_clusters(k=4, top_n=5):
    engine = get_db_engine()
    return run_kmeans_clustering(engine, k=k, top_n=top_n)

# Example usage:
if __name__ == "__main__":
    result = test_clusters()
    print(result)
