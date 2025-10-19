import pandas as pd

def fetch_sample_data(engine):
    """
    Fetch sample data from PostgreSQL fact & dimension tables.
    Adjust LIMIT for testing or full scale later.
    """
    try:
        customers = pd.read_sql("SELECT * FROM dim.dim_customer;", engine)
        transactions = pd.read_sql("SELECT * FROM fact.fact_sales;", engine)
        products = pd.read_sql("SELECT * FROM dim.dim_product;", engine)

        return {
            "customers_sample": customers.to_dict(orient="records"),
            "transactions_sample": transactions.to_dict(orient="records"),
            "products_sample": products.to_dict(orient="records")
        }
    except Exception as e:
        print("❌ fetch_sample_data error:", e, flush=True)
        return {"error": str(e)}
