import pandas as pd
from datetime import datetime

def calculate_rfm(customers_df, transactions_df, products_df=None):
    """
    Calculates RFM metrics for each customer.

    Args:
        customers_df (pd.DataFrame)
        transactions_df (pd.DataFrame)
        products_df (pd.DataFrame, optional)
    Returns:
        pd.DataFrame: RFM per customer
    """

    # --- Step 1: Ensure correct data types ---
    transactions_df['date_id'] = pd.to_datetime(transactions_df['date_id'], errors='coerce')
    transactions_df['total_amount'] = pd.to_numeric(transactions_df['total_amount'], errors='coerce')

    # --- Step 2: Recency ---
    current_date = transactions_df['date_id'].max() + pd.Timedelta(days=1)
    recency_df = transactions_df.groupby('customer_id')['date_id'].max().reset_index()
    recency_df['Recency'] = (current_date - recency_df['date_id']).dt.days
    recency_df.drop(columns=['date_id'], inplace=True)

    # --- Step 3: Frequency ---
    frequency_df = transactions_df.groupby('customer_id')['date_id'].count().reset_index()
    frequency_df.rename(columns={'date_id': 'Frequency'}, inplace=True)

    # --- Step 4: Monetary ---
    monetary_df = transactions_df.groupby('customer_id')['total_amount'].sum().reset_index()
    monetary_df.rename(columns={'total_amount': 'Monetary'}, inplace=True)

    # --- Step 5: Merge with customers ---
    rfm_df = customers_df[['customer_id', 'customer_code']].merge(recency_df, on='customer_id', how='left')
    rfm_df = rfm_df.merge(frequency_df, on='customer_id', how='left')
    rfm_df = rfm_df.merge(monetary_df, on='customer_id', how='left')

    # --- Step 6: Handle missing / inactive customers ---
    rfm_df['Recency'] = rfm_df['Recency'].fillna(-1)
    rfm_df['Frequency'] = rfm_df['Frequency'].fillna(0)
    rfm_df['Monetary'] = rfm_df['Monetary'].fillna(0)

    # --- Step 7: Derived features ---
    rfm_df['AvgOrderValue'] = rfm_df.apply(
        lambda x: x['Monetary']/x['Frequency'] if x['Frequency'] > 0 else 0, axis=1
    )

    if products_df is not None:
        merged = transactions_df.merge(products_df[['product_id', 'category']], on='product_id', how='left')
        pref_cat = merged.groupby('customer_id')['category'].agg(lambda x: x.value_counts().idxmax()).reset_index()
        pref_cat.rename(columns={'category': 'PreferredCategory'}, inplace=True)
        rfm_df = rfm_df.merge(pref_cat, on='customer_id', how='left')
        rfm_df['PreferredCategory'] = rfm_df['PreferredCategory'].fillna("None")

    return rfm_df
