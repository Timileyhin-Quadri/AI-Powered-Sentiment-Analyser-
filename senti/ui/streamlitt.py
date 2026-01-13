# frontend/ui.py
import streamlit as st
import requests
import pandas as pd
import plotly.express as px

# Configuration
API_URL = "http://127.0.0.1:8000/analyze_sentiment"

st.set_page_config(page_title="NaijaPulse AI", layout="wide")

st.title("🇳🇬 NaijaPulse: AI Opinion Tracker")
st.markdown("Disconnected Architecture: Streamlit UI ↔️ FastAPI Backend")

# --- SIDEBAR ---
with st.sidebar:
    st.header("Control Panel")
    topic = st.text_input("Target Brand/Product", "GTBank")
    limit = st.slider("Sample Size", 10, 50, 20)
    
    analyze_btn = st.button("🚀 Analyze Live Data")

# --- MAIN LOGIC ---
if analyze_btn:
    with st.spinner(f"📡 Contacting API to analyze '{topic}'..."):
        try:
            # 1. Send Request to Backend
            payload = {"keyword": topic, "limit": limit}
            response = requests.post(API_URL, json=payload)
            
            # 2. Handle Errors
            if response.status_code == 404:
                st.error("No tweets found! The topic might be too obscure.")
            elif response.status_code != 200:
                st.error(f"API Error: {response.text}")
                
            else:
                # 3. Parse JSON Data
                data = response.json()
                summary = data['summary']
                tweets = data['tweets']
                
                # --- DASHBOARD ---
                
                # Row A: Metrics
                c1, c2, c3, c4 = st.columns(4)
                c1.metric("Opinion Score", f"{summary['sentiment_score']:.1f}")
                c2.metric("Positive", summary['positive'])
                c3.metric("Negative", summary['negative'])
                c4.metric("Total Scanned", summary['total'])
                
                st.divider()
                
                # Row B: Visuals + Data
                col_chart, col_raw = st.columns([1, 2])
                
                with col_chart:
                    # create simple DF for chart
                    chart_data = pd.DataFrame({
                        "Sentiment": ["Positive", "Negative", "Neutral"],
                        "Count": [summary['positive'], summary['negative'], summary['neutral']]
                    })
                    fig = px.pie(chart_data, values='Count', names='Sentiment', 
                                 color='Sentiment',
                                 color_discrete_map={'Positive':'#00CC96', 'Negative':'#EF553B', 'Neutral':'#636EFA'},
                                 hole=0.4)
                    st.plotly_chart(fig, use_container_width=True)
                
                with col_raw:
                    st.subheader("📝 Recent Opinions")
                    # Convert JSON tweets back to DF for display
                    tweets_df = pd.DataFrame(tweets)
                    
                    # Highlight negative ones
                    def highlight_neg(row):
                        return ['background-color: #ffcccc' if row.sentiment == 'Negative' else '' for _ in row]
                    
                    st.dataframe(
                        tweets_df[['text', 'sentiment', 'confidence']], 
                        hide_index=True,
                        use_container_width=True
                    )

        except requests.exceptions.ConnectionError:
            st.error("❌ Could not connect to Backend. Is FastAPI running? (uvicorn backend.main:app)")