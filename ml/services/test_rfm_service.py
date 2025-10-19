import pandas as pd
from utils.db_connection import get_db_engine
from services.test_db_service import fetch_sample_data
from services.rfm_service import calculate_rfm

def test_rfm():
    """
    Loads data from DB and returns RFM metrics as JSON-ready dict.
    """
    engine = get_db_engine()
    data = fetch_sample_data(engine)

    customers_df = pd.DataFrame(data['customers_sample'])
    transactions_df = pd.DataFrame(data['transactions_sample'])
    products_df = pd.DataFrame(data['products_sample'])

    rfm_df = calculate_rfm(customers_df, transactions_df, products_df)

    # Make JSON-safe
    rfm_df = rfm_df.fillna('')
    for col in rfm_df.columns:
        if pd.api.types.is_datetime64_any_dtype(rfm_df[col]):
            rfm_df[col] = rfm_df[col].astype(str)
        elif pd.api.types.is_numeric_dtype(rfm_df[col]):
            rfm_df[col] = rfm_df[col].astype(float)
    return rfm_df.to_dict(orient="records")
