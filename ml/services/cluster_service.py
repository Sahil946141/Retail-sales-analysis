# services/cluster_service.py
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from fastapi.encoders import jsonable_encoder

from services.test_db_service import fetch_sample_data
from services.rfm_service import calculate_rfm

def prepare_rfm_for_clustering(customers_df, transactions_df, products_df=None):
    """
    Returns an RFM dataframe prepared for clustering.
    - calculates RFM (via calculate_rfm)
    - replaces sentinel Recency -1 for inactive customers with a large number
    """
    rfm_df = calculate_rfm(customers_df, transactions_df, products_df)

    # Convert types
    for col in ['Recency', 'Frequency', 'Monetary']:
        if col in rfm_df.columns:
            rfm_df[col] = pd.to_numeric(rfm_df[col], errors='coerce')

    # Replace Recency -1 (no purchases) with max_recency + 1
    if 'Recency' in rfm_df.columns:
        max_rec = rfm_df.loc[rfm_df['Recency'] >= 0, 'Recency'].max()
        if pd.isna(max_rec):
            max_rec = 0
        rfm_df['Recency'] = rfm_df['Recency'].apply(
            lambda x: (max_rec + 1) if (x is None or (isinstance(x, (int,float)) and x < 0)) else x
        )

    # Fill remaining NaNs
    rfm_df['Frequency'] = rfm_df['Frequency'].fillna(0)
    rfm_df['Monetary'] = rfm_df['Monetary'].fillna(0)
    rfm_df['AvgOrderValue'] = rfm_df['AvgOrderValue'].fillna(0)

    return rfm_df

def run_kmeans_clustering(engine, k=4, top_n=5):
    """
    Perform RFM clustering with KMeans (default k=4)
    """
    # Fetch sample data
    data = fetch_sample_data(engine)
    customers_df = pd.DataFrame(data['customers_sample'])
    transactions_df = pd.DataFrame(data['transactions_sample'])
    products_df = pd.DataFrame(data['products_sample'])

    # Prepare RFM
    rfm_df = prepare_rfm_for_clustering(customers_df, transactions_df, products_df)

    # Features for clustering
    features = ['Recency', 'Frequency', 'Monetary']
    X = rfm_df[features].values

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # KMeans clustering
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    # Attach cluster labels
    rfm_df['cluster'] = labels

    # Cluster summary
    cluster_summary = (
        rfm_df.groupby('cluster')[['Recency', 'Frequency', 'Monetary']]
        .agg(['count', 'mean', 'median'])
        .reset_index()
    )
    # Flatten multiindex
    cluster_summary.columns = [
        '_'.join(col).strip('_') if isinstance(col, tuple) else col
        for col in cluster_summary.columns
    ]

    # Top customers per cluster
    top_customers = {}
    for c in sorted(rfm_df['cluster'].unique()):
        top = (
            rfm_df[rfm_df['cluster'] == c]
            .sort_values('Monetary', ascending=False)
            .head(top_n)
            [['customer_id', 'customer_code', 'Recency', 'Frequency', 'Monetary', 'AvgOrderValue', 'PreferredCategory']]
        )
        top_customers[int(c)] = top.to_dict(orient='records')

    # Full clusters list
    clusters_list = rfm_df[['customer_id', 'customer_code', 'Recency', 'Frequency', 'Monetary',
                            'AvgOrderValue', 'PreferredCategory', 'cluster']]
    clusters_json = clusters_list.to_dict(orient='records')

    # Return JSON serializable result
    result = {
        "clusters": jsonable_encoder(clusters_json),
        "cluster_summary": jsonable_encoder(cluster_summary.to_dict(orient='records')),
        "top_customers": jsonable_encoder(top_customers),
        "k": k
    }
    return result
