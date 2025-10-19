import pandas as pd
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from utils.db_connection import get_db_engine
from services.test_db_service import fetch_sample_data
from services.rfm_service import calculate_rfm
from services.test_rfm_service import test_rfm
from services.cluster_service import run_kmeans_clustering
from services.forecast_service import forecast_sales

app = FastAPI(title="ML Service - RFM Module")

# ✅ Startup test
@app.on_event("startup")
def startup_event():
    try:
        engine = get_db_engine()
        print("✅ Connected to PostgreSQL at startup.", flush=True)
    except Exception as e:
        print("❌ DB connection failed:", e, flush=True)

@app.get("/")
def root():
    return {"message": "RFM ML Service is running ✅"}

@app.get("/test-db")
def test_db_connection():
    try:
        engine = get_db_engine()
        data = fetch_sample_data(engine)
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/rfm")
def get_rfm_metrics():
    """
    Compute RFM metrics for all customers.
    """
    try:
        engine = get_db_engine()
        data = fetch_sample_data(engine)
        customers_df = pd.DataFrame(data['customers_sample'])
        transactions_df = pd.DataFrame(data['transactions_sample'])
        products_df = pd.DataFrame(data['products_sample'])

        rfm_df = calculate_rfm(customers_df, transactions_df, products_df)
        return jsonable_encoder(rfm_df.to_dict(orient="records"))
    except Exception as e:
        return {"error": str(e)}

@app.get("/test-rfm")
def test_rfm_endpoint():
    return jsonable_encoder(test_rfm())
@app.get("/clusters")
def get_clusters(k: int = 4, top_n: int = 5):
    """
    Run KMeans clustering on RFM metrics
    - k: number of clusters (default 4)
    - top_n: number of top customers per cluster (default 5)
    """
    try:
        engine = get_db_engine()
        result = run_kmeans_clustering(engine, k=k, top_n=top_n)
        return result
    except Exception as e:
        return {"error": str(e)}
@app.get("/cluster-counts")
def cluster_counts():
    from utils.db_connection import get_db_engine
    from services.cluster_service import run_kmeans_clustering
    import pandas as pd

    engine = get_db_engine()
    result = run_kmeans_clustering(engine, k=4)
    clusters_df = pd.DataFrame(result['clusters'])
    counts = clusters_df['cluster'].value_counts().sort_index()
    return counts.to_dict()
@app.get("/forecast")
def get_sales_forecast(periods: int = 30):
    """
    Forecast total sales for the next 'periods' days.
    Returns clean, dashboard-friendly data.
    """
    try:
        engine = get_db_engine()
        result = forecast_sales(engine, periods)
        return result
    except Exception as e:
        return {"error": str(e)}
