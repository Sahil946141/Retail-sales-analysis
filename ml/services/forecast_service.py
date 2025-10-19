import pandas as pd
from prophet import Prophet

def forecast_sales(engine, periods=30):
    """
    Generate sales forecast using Prophet
    Returns a clean, user-friendly JSON format suitable for frontend charts
    """
    # Corrected SQL with your table and column names
    query = """
    SELECT
        d.full_date AS ds, 
        SUM(f.total_amount) AS y
    FROM fact.fact_sales f
    JOIN dim.dim_date d ON f.date_id = d.date_id
    GROUP BY d.full_date
    ORDER BY d.full_date;
    """
    
    # Load historical sales
    df = pd.read_sql(query, con=engine)
    
    # Ensure ds column is datetime
    df['ds'] = pd.to_datetime(df['ds'])
    
    # Train the Prophet model
    model = Prophet(daily_seasonality=True)
    model.fit(df)
    
    # Create future dataframe for forecasting
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)
    
    # Merge historical and forecast
    forecast['ds'] = pd.to_datetime(forecast['ds'])
    merged = pd.merge(
        forecast[['ds', 'yhat']],
        df[['ds', 'y']],
        on='ds',
        how='left'
    )
    
    # Label type for frontend clarity
    merged['type'] = merged['y'].apply(lambda x: 'historical' if pd.notnull(x) else 'forecast')
    
    # Prepare final output
    merged['sales'] = merged['yhat'].round(2)
    merged['date'] = merged['ds'].dt.strftime('%Y-%m-%d')
    final_df = merged[['date', 'sales', 'type']]
    
    return final_df.to_dict(orient='records')
