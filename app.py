"""
Options Scanner Web Dashboard - Professional Trading Platform Style
Run with: streamlit run options_scanner_web.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import time
from options_scanner import OptionsScanner  # Import your existing scanner

# Page config - MUST be first
st.set_page_config(
    page_title="Options Scanner Pro",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Professional Dark Theme CSS
st.markdown("""
    <style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    /* Main app background */
    .stApp {
        background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
        font-family: 'Inter', sans-serif;
    }
    
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%);
        border-right: 1px solid #2d2d3d;
    }
    
    section[data-testid="stSidebar"] .stMarkdown {
        color: #e0e0e0;
    }
    
    /* Headers */
    h1 {
        color: #ffffff;
        font-weight: 700;
        letter-spacing: -0.5px;
        text-shadow: 0 0 20px rgba(100, 200, 255, 0.3);
    }
    
    h2, h3 {
        color: #ffffff;
        font-weight: 600;
    }
    
    /* Metric containers - Modern card style */
    [data-testid="metric-container"] {
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
        border: 1px solid rgba(100, 200, 255, 0.2);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    [data-testid="metric-container"]:hover {
        transform: translateY(-2px);
        box-shadow: 
            0 8px 30px rgba(100, 200, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        border-color: rgba(100, 200, 255, 0.4);
    }
    
    /* Metric values - Gradient text effect */
    [data-testid="metric-container"] [data-testid="stMetricValue"] {
        background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 2.5rem;
        font-weight: 700;
        text-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
    }
    
    /* Metric labels */
    [data-testid="metric-container"] [data-testid="stMetricLabel"] {
        color: #a0a0b0;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    
    /* Metric delta */
    [data-testid="metric-container"] [data-testid="stMetricDelta"] {
        color: #00ff88;
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    /* Buttons - Modern gradient style */
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 600;
        font-size: 16px;
        letter-spacing: 0.5px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
    }
    
    .stButton > button[type="primary"] {
        background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
        box-shadow: 0 4px 15px rgba(0, 255, 136, 0.4);
    }
    
    /* Input fields */
    .stTextInput > div > div > input,
    .stSelectbox > div > div > select,
    .stMultiSelect > div > div {
        background-color: #1a1a2e !important;
        border: 1px solid #3a3a4e !important;
        border-radius: 8px;
        color: #ffffff !important;
        transition: all 0.3s ease;
    }
    
    .stTextInput > div > div > input:focus,
    .stSelectbox > div > div > select:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
    }
    
    /* Tabs - Modern style */
    .stTabs [data-baseweb="tab-list"] {
        background: rgba(26, 26, 46, 0.5);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 8px;
        gap: 8px;
        border: 1px solid rgba(100, 200, 255, 0.1);
    }
    
    .stTabs [data-baseweb="tab"] {
        background: transparent;
        color: #a0a0b0;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .stTabs [data-baseweb="tab"]:hover {
        background: rgba(102, 126, 234, 0.1);
        color: #ffffff;
    }
    
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
    }
    
    /* DataFrames - Dark theme */
    .dataframe {
        background-color: #1a1a2e !important;
        color: #ffffff !important;
        border: 1px solid #3a3a4e !important;
        border-radius: 8px;
    }
    
    .dataframe th {
        background: linear-gradient(180deg, #2a2a3e 0%, #1e1e2e 100%) !important;
        color: #00ff88 !important;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 1px;
        border-bottom: 2px solid #3a3a4e !important;
    }
    
    .dataframe td {
        background-color: #1a1a2e !important;
        color: #e0e0e0 !important;
        border-bottom: 1px solid #2a2a3e !important;
    }
    
    .dataframe tr:hover td {
        background-color: #2a2a3e !important;
    }
    
    /* Success/Info/Warning boxes */
    .stAlert {
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
        border: 1px solid #3a3a4e;
        border-radius: 12px;
        color: #ffffff;
    }
    
    div[data-baseweb="notification"] {
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
        border-left: 4px solid #00ff88;
    }
    
    /* Expander */
    .streamlit-expanderHeader {
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
        border: 1px solid rgba(100, 200, 255, 0.2);
        border-radius: 8px;
        color: #ffffff;
    }
    
    /* Slider */
    .stSlider > div > div {
        background: linear-gradient(90deg, #667eea 0%, #00ff88 100%);
    }
    
    /* Progress bar */
    .stProgress > div > div > div {
        background: linear-gradient(90deg, #667eea 0%, #00ff88 100%);
    }
    
    /* Checkbox */
    .stCheckbox > label > span {
        color: #e0e0e0 !important;
    }
    
    /* Divider line */
    hr {
        border-color: #3a3a4e;
        opacity: 0.5;
    }
    
    /* Custom gradient text class */
    .gradient-text {
        background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 700;
        font-size: 2.5rem;
    }
    
    /* Glow effect for important elements */
    .glow {
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }
    
    ::-webkit-scrollbar-track {
        background: #1a1a2e;
    }
    
    ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        border-radius: 5px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #764ba2 0%, #667eea 100%);
    }
    
    /* Animation for new data */
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .pulse {
        animation: pulse 2s infinite;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        [data-testid="metric-container"] [data-testid="stMetricValue"] {
            font-size: 1.8rem;
        }
    }
    </style>
""", unsafe_allow_html=True)

# Initialize session state
if 'scanner' not in st.session_state:
    st.session_state.scanner = None
if 'results' not in st.session_state:
    st.session_state.results = pd.DataFrame()
if 'scan_history' not in st.session_state:
    st.session_state.scan_history = []
if 'current_api_key' not in st.session_state:
    st.session_state.current_api_key = None

# Header with gradient text
st.markdown('<h1 class="gradient-text">🎯 Options Scanner Pro</h1>', unsafe_allow_html=True)
st.markdown('<p style="color: #a0a0b0; font-size: 1.1rem; margin-top: -20px;">Professional Options Strategy Analysis Platform</p>', unsafe_allow_html=True)
st.markdown("---")

# Sidebar Configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    
    # API Key inputs
    st.subheader("🔑 API Keys")
    
    polygon_key = st.text_input(
        "Polygon API Key (Optional)",
        type="password",
        value="",
        help="Enter your Polygon.io API key"
    )
    
    uw_key = st.text_input(
        "Unusual Whales API Key (Optional)",
        type="password",
        value="",
        help="Enter your Unusual Whales API key for better data"
    )
    
    # Check which APIs are configured
    if polygon_key or uw_key:
        if not st.session_state.scanner:
            st.session_state.scanner = OptionsScanner(
                polygon_key if polygon_key else None,
                uw_key if uw_key else None
            )
            st.session_state.current_polygon_key = polygon_key
            st.session_state.current_uw_key = uw_key
            
            if uw_key and polygon_key:
                st.success("✅ Both APIs loaded! Using UW as primary, Polygon as backup")
            elif uw_key:
                st.success("✅ Unusual Whales API loaded!")
            elif polygon_key:
                st.success("✅ Polygon API loaded!")
        elif (st.session_state.get('current_polygon_key') != polygon_key or 
              st.session_state.get('current_uw_key') != uw_key):
            st.session_state.scanner = OptionsScanner(
                polygon_key if polygon_key else None,
                uw_key if uw_key else None
            )
            st.session_state.current_polygon_key = polygon_key
            st.session_state.current_uw_key = uw_key
            st.success("✅ API keys updated!")
    else:
        st.warning("⚠️ Please enter at least one API key")
    
    st.markdown("---")
    
    # Ticker Selection
    st.subheader("📊 Tickers")
    
    # Predefined lists
    ticker_lists = {
        "Mega Tech": ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"],
        "ETFs": ["SPY", "QQQ", "IWM", "DIA", "XLF", "XLE", "GLD"],
        "Meme Stocks": ["GME", "AMC", "BBBY", "BB", "NOK"],
        "Finance": ["JPM", "BAC", "GS", "MS", "WFC", "C"],
        "All Popular": ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", 
                       "SPY", "QQQ", "IWM", "JPM", "BAC", "GS", "AMD", "NFLX"],
        "Custom": []
    }
    
    # Quick ticker selector
    selected_list = st.selectbox("Quick select ticker list:", list(ticker_lists.keys()))
    
    # Show available tickers for adding back
    if selected_list != "Custom":
        available_tickers = ticker_lists[selected_list]
    else:
        # For custom, show all common tickers
        available_tickers = list(set(
            ticker_lists["Mega Tech"] + 
            ticker_lists["ETFs"] + 
            ticker_lists["Finance"]
        ))
    
    # Main ticker selector with ability to add/remove
    tickers = st.multiselect(
        "Select tickers to scan (you can type to add custom):",
        options=available_tickers,
        default=available_tickers[:3] if selected_list != "Custom" else ["AAPL", "MSFT", "NVDA"],
        help="Remove tickers by clicking the X. Add them back by selecting from dropdown or typing."
    )
    
    # Additional custom ticker input
    custom_ticker = st.text_input(
        "Add a custom ticker:",
        placeholder="Enter ticker symbol",
        help="Type a ticker symbol and press Enter to add it to the scan"
    )
    
    if custom_ticker and custom_ticker.upper() not in tickers:
        tickers.append(custom_ticker.upper())
    
    st.markdown("---")
    
    # Scanning Parameters
    st.subheader("🎯 Parameters")
    
    days_to_exp = st.slider(
        "Days to Expiration",
        min_value=7,
        max_value=90,
        value=30,
        step=1,
        help="Target expiration date in days"
    )
    
    min_return = st.slider(
        "Minimum Return (%)",
        min_value=5,
        max_value=100,
        value=20,
        step=5,
        help="Minimum expected return percentage"
    )
    
    # Strategy Selection
    st.subheader("📋 Strategies")
    
    all_strategies = [
        "Long Calls",
        "Long Puts",
        "Short Calls (Naked)",
        "Short Puts (Naked)",
        "Bull Call Spreads",
        "Bear Put Spreads", 
        "Cash-Secured Puts",
        "Covered Calls",
        "Long Straddles",
        "Long Strangles",
        "Iron Condors",
        "Credit Spreads"
    ]
    
    # Strategy presets
    strategy_presets = {
        "All Strategies": all_strategies,
        "Basic Options": ["Long Calls", "Long Puts", "Covered Calls", "Cash-Secured Puts"],
        "Spreads Only": ["Bull Call Spreads", "Bear Put Spreads", "Credit Spreads"],
        "Income Strategies": ["Covered Calls", "Cash-Secured Puts", "Short Puts (Naked)", "Credit Spreads"],
        "Volatility Plays": ["Long Straddles", "Long Strangles", "Iron Condors"],
        "Bullish": ["Long Calls", "Bull Call Spreads", "Short Puts (Naked)", "Cash-Secured Puts"],
        "Bearish": ["Long Puts", "Bear Put Spreads", "Short Calls (Naked)"],
        "Custom": []
    }
    
    preset = st.selectbox("Strategy preset:", list(strategy_presets.keys()))
    
    if preset == "Custom":
        selected_strategies = st.multiselect(
            "Select strategies to scan:",
            all_strategies,
            default=["Long Calls", "Long Puts", "Bull Call Spreads"]
        )
    else:
        selected_strategies = st.multiselect(
            "Select strategies to scan:",
            all_strategies,
            default=strategy_presets[preset]
        )
    
    st.markdown("---")
    
    # Scan Button
    scan_button = st.button(
        "🚀 Run Scan",
        use_container_width=True,
        disabled=not (polygon_key or uw_key) or not tickers,
        type="primary"
    )

# Main Content Area
if not (polygon_key or uw_key):
    st.warning("👈 Please enter at least one API key in the sidebar to begin")
    st.markdown("""
    ### Getting Started:
    1. Enter your Polygon and/or Unusual Whales API key in the sidebar
    2. Select tickers to scan
    3. Adjust parameters as needed
    4. Click 'Run Scan' to find opportunities
    
    **Note:** Unusual Whales typically has better options data coverage!
    """)
    
elif scan_button and st.session_state.scanner:
    # Run scan with progress indicator
    with st.spinner(f"🔍 Scanning {len(tickers)} tickers..."):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        # Run the scan with better error handling
        try:
            # Add a container for errors
            error_container = st.container()
            
            results = st.session_state.scanner.scan_all_strategies(
                tickers=tickers,
                days=days_to_exp,
                min_return=min_return
            )
            
            if not results.empty:
                st.session_state.results = results
                st.session_state.scan_history.append({
                    'timestamp': datetime.now(),
                    'tickers': tickers,
                    'count': len(results)
                })
                progress_bar.progress(100)
                status_text.text("✅ Scan complete!")
                time.sleep(1)
                progress_bar.empty()
                status_text.empty()
                st.success(f"Found {len(results)} opportunities!")
            else:
                progress_bar.empty()
                status_text.empty()
                st.warning("""
                No opportunities found. This could be because:
                - The market is closed (options data may not be available)
                - Rate limits on the API (try fewer tickers)
                - The criteria is too restrictive (try lowering minimum return)
                - Some tickers don't have options available
                
                Try scanning SPY or AAPL individually first to test.
                """)
                
        except Exception as e:
            progress_bar.empty()
            status_text.empty()
            st.error(f"""
            Error during scan: {str(e)[:200]}
            
            Troubleshooting tips:
            - Try scanning just 1-2 tickers first (SPY or AAPL)
            - Check if the market is open
            - Your API key may have hit rate limits
            - Try again in a few seconds
            """)

# Display Results with Professional Styling
if not st.session_state.results.empty:
    results = st.session_state.results
    
    # Summary Metrics with gradient cards
    st.markdown('<h2 style="color: #ffffff; margin-bottom: 20px;">📊 Market Overview</h2>', unsafe_allow_html=True)
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        total_ops = len(results)
        st.metric(
            "Total Opportunities",
            f"{total_ops:,}",
            f"↑ {results['ticker'].nunique()} tickers",
            delta_color="normal"
        )
    
    with col2:
        best_return = results['return'].max()
        best_ticker = results.iloc[0]['ticker']
        st.metric(
            "Best Return",
            f"{best_return:.1f}%",
            f"{best_ticker}",
            delta_color="normal"
        )
    
    with col3:
        avg_return = results['return'].mean()
        median_return = results['return'].median()
        st.metric(
            "Avg Return",
            f"{avg_return:.1f}%",
            f"Median: {median_return:.1f}%",
            delta_color="normal"
        )
    
    with col4:
        strategy_count = results['strategy'].nunique()
        top_strategy = results['strategy'].value_counts().index[0]
        st.metric(
            "Strategies",
            strategy_count,
            f"{top_strategy[:12]}...",
            delta_color="normal"
        )
    
    with col5:
        avg_dte = results['dte'].mean()
        dte_range = f"{results['dte'].min()}-{results['dte'].max()}"
        st.metric(
            "Avg DTE",
            f"{avg_dte:.0f}d",
            dte_range,
            delta_color="normal"
        )
    
    st.markdown("---")
    
    # Professional Tabs
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "🏆 Top Opportunities", 
        "📈 Market Analysis", 
        "🎯 Strategy Breakdown", 
        "🧮 Greeks & Volatility", 
        "📉 P&L Calculator", 
        "📋 Full Scanner"
    ])
    
    with tab1:
        st.subheader("🏆 Top 10 Opportunities")
        
        # Format top opportunities
        top_10 = results.head(10).copy()
        
        # Create display columns based on what's available
        base_cols = ['ticker', 'strategy', 'expiration', 'dte', 'return', 'current_price']
        optional_cols = ['breakeven', 'strike', 'premium', 'iv', 'delta', 'volume', 'open_interest']
        
        display_cols = base_cols + [col for col in optional_cols if col in top_10.columns]
        
        # Add a note if Greeks are available
        if any(greek in top_10.columns for greek in ['iv', 'delta', 'gamma', 'theta', 'vega']):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.success("🎯 Greeks and IV data available from Unusual Whales!")
            with col2:
                show_greeks = st.checkbox("Show Greeks", value=True)
                
            if show_greeks and 'delta' in top_10.columns:
                display_cols.extend([g for g in ['gamma', 'theta', 'vega'] if g in top_10.columns])
        
        # Format dictionary
        format_dict = {
            'return': '{:.1f}%',
            'current_price': '${:.2f}',
            'strike': '${:.2f}',
            'premium': '${:.2f}',
            'breakeven': '${:.2f}',
            'iv': '{:.1f}%',
            'delta': '{:.3f}',
            'gamma': '{:.4f}',
            'theta': '{:.3f}',
            'vega': '{:.3f}'
        }
        
        # Filter format dict to only include existing columns
        format_dict = {k: v for k, v in format_dict.items() if k in display_cols}
        
        # Style the dataframe
        styled_df = top_10[display_cols].style.format(format_dict).background_gradient(
            subset=['return'], cmap='RdYlGn'
        )
        
        # Add IV gradient if available
        if 'iv' in display_cols:
            styled_df = styled_df.background_gradient(subset=['iv'], cmap='YlOrRd')
        
        st.dataframe(styled_df, use_container_width=True, height=400)
        
        # Quick actions
        col1, col2 = st.columns(2)
        with col1:
            if st.button("📥 Export to CSV"):
                csv = results.to_csv(index=False)
                st.download_button(
                    label="Download CSV",
                    data=csv,
                    file_name=f"options_scan_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                    mime="text/csv"
                )
        
    with tab2:
        st.markdown('<h3 style="color: #ffffff;">📈 Market Analysis</h3>', unsafe_allow_html=True)
        
        # Configure Plotly dark theme
        plotly_layout = dict(
            plot_bgcolor='#1a1a2e',
            paper_bgcolor='#1a1a2e',
            font=dict(color='#e0e0e0'),
            xaxis=dict(gridcolor='#2a2a3e', zerolinecolor='#2a2a3e'),
            yaxis=dict(gridcolor='#2a2a3e', zerolinecolor='#2a2a3e'),
        )
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Return distribution with gradient
            fig_hist = go.Figure()
            fig_hist.add_trace(go.Histogram(
                x=results['return'],
                nbinsx=20,
                marker=dict(
                    color=results['return'],
                    colorscale=[[0, '#667eea'], [0.5, '#00ff88'], [1, '#00d4ff']],
                    line=dict(color='#3a3a4e', width=1)
                ),
                hovertemplate='Return: %{x:.1f}%<br>Count: %{y}<extra></extra>'
            ))
            fig_hist.update_layout(
                title=dict(text="Return Distribution", font=dict(color='#00ff88')),
                xaxis_title="Return (%)",
                yaxis_title="Count",
                height=350,
                **plotly_layout
            )
            st.plotly_chart(fig_hist, use_container_width=True)
            
            # Strategy breakdown - Modern donut chart
            strategy_counts = results['strategy'].value_counts()
            fig_pie = go.Figure(data=[go.Pie(
                labels=strategy_counts.index,
                values=strategy_counts.values,
                hole=0.7,
                marker=dict(
                    colors=['#667eea', '#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d', '#a8e6cf', '#ff8cc8', '#6bcf7f'],
                    line=dict(color='#1a1a2e', width=2)
                ),
                textposition='outside',
                textinfo='label+percent',
                hovertemplate='%{label}<br>Count: %{value}<br>%{percent}<extra></extra>'
            )])
            
            # Add center text
            fig_pie.add_annotation(
                text=f'{len(strategy_counts)}<br>Strategies',
                x=0.5, y=0.5,
                font=dict(size=20, color='#00ff88'),
                showarrow=False
            )
            
            fig_pie.update_layout(
                title=dict(text="Strategy Distribution", font=dict(color='#00ff88')),
                height=350,
                showlegend=False,
                **plotly_layout
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        
        with col2:
            # Returns by ticker - Modern bar chart
            ticker_returns = results.groupby('ticker')['return'].agg(['mean', 'max', 'count'])
            
            fig_bar = go.Figure()
            
            # Add gradient bars
            fig_bar.add_trace(go.Bar(
                x=ticker_returns.index,
                y=ticker_returns['max'],
                name='Max Return',
                marker=dict(
                    color=ticker_returns['max'],
                    colorscale=[[0, '#667eea'], [1, '#00ff88']],
                    line=dict(color='#3a3a4e', width=1)
                ),
                hovertemplate='%{x}<br>Max: %{y:.1f}%<extra></extra>'
            ))
            
            fig_bar.add_trace(go.Bar(
                x=ticker_returns.index,
                y=ticker_returns['mean'],
                name='Avg Return',
                marker=dict(
                    color='#00d4ff',
                    opacity=0.6,
                    line=dict(color='#3a3a4e', width=1)
                ),
                hovertemplate='%{x}<br>Avg: %{y:.1f}%<extra></extra>'
            ))
            
            fig_bar.update_layout(
                title=dict(text="Returns by Ticker", font=dict(color='#00ff88')),
                xaxis_title="Ticker",
                yaxis_title="Return (%)",
                barmode='group',
                height=350,
                showlegend=True,
                legend=dict(
                    bgcolor='rgba(26, 26, 46, 0.8)',
                    bordercolor='#3a3a4e',
                    borderwidth=1
                ),
                **plotly_layout
            )
            st.plotly_chart(fig_bar, use_container_width=True)
            
            # DTE vs Return scatter - Modern style
            fig_scatter = go.Figure()
            
            # Create color map for strategies
            unique_strategies = results['strategy'].unique()
            colors = ['#667eea', '#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d', '#a8e6cf', '#ff8cc8', '#6bcf7f']
            
            for i, strategy in enumerate(unique_strategies):
                strategy_data = results[results['strategy'] == strategy]
                fig_scatter.add_trace(go.Scatter(
                    x=strategy_data['dte'],
                    y=strategy_data['return'],
                    mode='markers',
                    name=strategy[:15],
                    marker=dict(
                        size=10,
                        color=colors[i % len(colors)],
                        line=dict(color='#1a1a2e', width=1),
                        symbol='circle'
                    ),
                    hovertemplate='%{text}<br>DTE: %{x}<br>Return: %{y:.1f}%<extra></extra>',
                    text=strategy_data['ticker']
                ))
            
            fig_scatter.update_layout(
                title=dict(text="DTE vs Return Analysis", font=dict(color='#00ff88')),
                xaxis_title="Days to Expiration",
                yaxis_title="Return (%)",
                height=350,
                showlegend=True,
                legend=dict(
                    bgcolor='rgba(26, 26, 46, 0.8)',
                    bordercolor='#3a3a4e',
                    borderwidth=1,
                    font=dict(size=10)
                ),
                **plotly_layout
            )
            st.plotly_chart(fig_scatter, use_container_width=True)
    
    with tab3:
        st.subheader("🎯 Strategy Performance")
        
        # Strategy comparison
        strategy_stats = results.groupby('strategy').agg({
            'return': ['mean', 'max', 'min', 'std'],
            'ticker': 'count'
        }).round(1)
        
        strategy_stats.columns = ['Avg Return', 'Max Return', 'Min Return', 'Std Dev', 'Count']
        
        st.dataframe(
            strategy_stats.style.background_gradient(subset=['Avg Return'], cmap='RdYlGn'),
            use_container_width=True
        )
        
        # Best strategy for each ticker
        st.subheader("🏆 Best Strategy per Ticker")
        best_per_ticker = results.loc[results.groupby('ticker')['return'].idxmax()]
        
        display_cols = ['ticker', 'strategy', 'return', 'expiration']
        st.dataframe(
            best_per_ticker[display_cols].style.format({'return': '{:.1f}%'}),
            use_container_width=True
        )
    
    with tab4:
        st.subheader("🧮 Greeks & IV Analysis")
        
        # Check if Greeks data is available
        has_greeks = any(col in results.columns for col in ['iv', 'delta', 'gamma', 'theta', 'vega'])
        
        if has_greeks:
            # Greeks explanation
            with st.expander("📚 Understanding Greeks & IV"):
                st.markdown("""
                **IV (Implied Volatility):** Market's expectation of future volatility. Higher IV = higher premiums.
                - 🟢 Low IV (<30%): Quiet market, cheaper options
                - 🟡 Medium IV (30-60%): Normal volatility
                - 🔴 High IV (>60%): High volatility, expensive options
                
                **Delta:** Rate of price change relative to stock movement (-1 to 1)
                - Calls: 0 to 1 (0.5 = ATM)
                - Puts: -1 to 0 (-0.5 = ATM)
                
                **Gamma:** Rate of Delta change (acceleration)
                
                **Theta:** Time decay per day (negative = losing value)
                
                **Vega:** Sensitivity to IV changes
                """)
            
            # Filter for options with Greeks
            greeks_data = results.dropna(subset=['iv'] if 'iv' in results.columns else [])
            
            if not greeks_data.empty and 'iv' in greeks_data.columns:
                col1, col2 = st.columns(2)
                
                with col1:
                    # IV Distribution
                    fig_iv = go.Figure()
                    fig_iv.add_trace(go.Histogram(
                        x=greeks_data['iv'],
                        nbinsx=20,
                        marker_color='orange',
                        name='IV Distribution'
                    ))
                    fig_iv.update_layout(
                        title="Implied Volatility Distribution",
                        xaxis_title="IV (%)",
                        yaxis_title="Count",
                        height=350
                    )
                    st.plotly_chart(fig_iv, use_container_width=True)
                    
                    # High IV Opportunities
                    if len(greeks_data[greeks_data['iv'] > greeks_data['iv'].median()]) > 0:
                        st.subheader("🔥 High IV Opportunities (Premium Selling)")
                        high_iv = greeks_data.nlargest(5, 'iv')[['ticker', 'strategy', 'strike', 'iv', 'return']]
                        st.dataframe(
                            high_iv.style.format({
                                'iv': '{:.1f}%',
                                'return': '{:.1f}%',
                                'strike': '${:.2f}'
                            }),
                            use_container_width=True
                        )
                
                with col2:
                    # Greeks heatmap if available
                    if 'delta' in greeks_data.columns:
                        # Delta distribution by strategy
                        fig_delta = go.Figure()
                        for strategy in greeks_data['strategy'].unique():
                            strategy_data = greeks_data[greeks_data['strategy'] == strategy]
                            if 'delta' in strategy_data.columns:
                                fig_delta.add_trace(go.Box(
                                    y=strategy_data['delta'],
                                    name=strategy[:15],  # Truncate long names
                                    boxmean=True
                                ))
                        
                        fig_delta.update_layout(
                            title="Delta Distribution by Strategy",
                            yaxis_title="Delta",
                            height=350,
                            showlegend=False
                        )
                        st.plotly_chart(fig_delta, use_container_width=True)
                    
                    # Low IV Opportunities
                    if len(greeks_data[greeks_data['iv'] < greeks_data['iv'].median()]) > 0:
                        st.subheader("💎 Low IV Opportunities (Premium Buying)")
                        low_iv = greeks_data.nsmallest(5, 'iv')[['ticker', 'strategy', 'strike', 'iv', 'return']]
                        st.dataframe(
                            low_iv.style.format({
                                'iv': '{:.1f}%',
                                'return': '{:.1f}%',
                                'strike': '${:.2f}'
                            }),
                            use_container_width=True
                        )
                
                # Theta decay analysis if available
                if 'theta' in greeks_data.columns:
                    st.subheader("⏰ Theta Decay Analysis")
                    
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        avg_theta = greeks_data['theta'].mean()
                        st.metric("Average Theta", f"{avg_theta:.3f}", 
                                 "Daily decay" if avg_theta < 0 else "Daily gain")
                    
                    with col2:
                        if 'premium' in greeks_data.columns:
                            # Calculate theta as % of premium
                            greeks_data['theta_pct'] = (greeks_data['theta'] / greeks_data['premium']) * 100
                            avg_theta_pct = greeks_data['theta_pct'].mean()
                            st.metric("Avg Theta %", f"{avg_theta_pct:.1f}%", "of premium/day")
                    
                    with col3:
                        # Best theta plays (most decay for selling)
                        if len(greeks_data[greeks_data['theta'] < 0]) > 0:
                            best_theta = greeks_data.nsmallest(1, 'theta')['ticker'].values[0]
                            st.metric("Highest Decay", best_theta, 
                                     f"{greeks_data.nsmallest(1, 'theta')['theta'].values[0]:.3f}")
            else:
                st.info("No Greeks data available. This data is provided by Unusual Whales API.")
        else:
            st.warning("""
            📊 Greeks and IV data not available with current data source.
            
            To see Greeks and IV analysis:
            1. Add your Unusual Whales API key in the sidebar
            2. Re-run the scan
            
            Greeks help you understand:
            - Risk levels (Delta, Gamma)
            - Time decay (Theta)
            - Volatility exposure (Vega)
            - Better entry/exit points
            """)
    
    with tab7:
        st.subheader("📉 P&L Calculator")
        
        # Select a specific trade
        trade_options = [f"{row['ticker']} - {row['strategy']} - {row['return']:.1f}%" 
                         for _, row in results.head(20).iterrows()]
        
        selected_trade_idx = st.selectbox(
            "Select a trade to analyze:",
            range(len(trade_options[:20])),
            format_func=lambda x: trade_options[x]
        )
        
        if selected_trade_idx is not None:
            trade = results.iloc[selected_trade_idx]
            
            col1, col2 = st.columns([2, 1])
            
            with col1:
                # Create P&L chart
                current_price = trade['current_price']
                price_range = np.linspace(current_price * 0.8, current_price * 1.2, 100)
                
                # Calculate P&L based on strategy
                pnl = []
                strategy = trade['strategy']
                
                if strategy == 'Bull Call Spread':
                    for price in price_range:
                        if price <= trade['long_strike']:
                            profit = -trade['debit']
                        elif price >= trade['short_strike']:
                            profit = trade['max_profit']
                        else:
                            profit = (price - trade['long_strike']) - trade['debit']
                        pnl.append(profit * 100)
                        
                elif strategy == 'Cash-Secured Put':
                    for price in price_range:
                        if price >= trade['strike']:
                            profit = trade['premium']
                        else:
                            profit = trade['premium'] - (trade['strike'] - price)
                        pnl.append(profit * 100)
                
                else:
                    # Default flat line for unsupported strategies
                    pnl = [0] * len(price_range)
                
                # Create Plotly figure
                fig = go.Figure()
                
                # Add P&L line
                fig.add_trace(go.Scatter(
                    x=price_range,
                    y=pnl,
                    mode='lines',
                    name='P&L',
                    line=dict(color='blue', width=3)
                ))
                
                # Add break-even line
                fig.add_hline(y=0, line_dash="dash", line_color="black", opacity=0.5)
                
                # Add current price line
                fig.add_vline(x=current_price, line_dash="dash", line_color="red", 
                            annotation_text=f"Current: ${current_price:.2f}")
                
                # Add breakeven if exists
                if 'breakeven' in trade and pd.notna(trade['breakeven']):
                    fig.add_vline(x=trade['breakeven'], line_dash="dot", line_color="green",
                                annotation_text=f"B/E: ${trade['breakeven']:.2f}")
                
                fig.update_layout(
                    title=f"{trade['ticker']} {trade['strategy']} - Profit/Loss Diagram",
                    xaxis_title="Stock Price at Expiration ($)",
                    yaxis_title="Profit/Loss ($)",
                    height=400,
                    hovermode='x'
                )
                
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.markdown("### Trade Details")
                st.markdown(f"**Ticker:** {trade['ticker']}")
                st.markdown(f"**Strategy:** {trade['strategy']}")
                st.markdown(f"**Current Price:** ${trade['current_price']:.2f}")
                st.markdown(f"**Expiration:** {trade['expiration']}")
                st.markdown(f"**DTE:** {trade['dte']} days")
                st.markdown(f"**Expected Return:** {trade['return']:.1f}%")
                
                if 'max_profit' in trade and pd.notna(trade['max_profit']):
                    st.markdown(f"**Max Profit:** ${trade['max_profit']:.2f}")
                if 'max_loss' in trade and pd.notna(trade['max_loss']):
                    st.markdown(f"**Max Loss:** ${trade['max_loss']:.2f}")
                if 'breakeven' in trade and pd.notna(trade['breakeven']):
                    st.markdown(f"**Breakeven:** ${trade['breakeven']:.2f}")
    
    with tab5:
        st.markdown('<h3 style="color: #ffffff;">🔥 Market Greeks & Flow Analysis</h3>', unsafe_allow_html=True)
        
        # Ticker selector for Greek analysis
        col1, col2 = st.columns([1, 3])
        with col1:
            greek_ticker = st.selectbox(
                "Select Ticker for Greek Analysis:",
                ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META"],
                key="greek_ticker"
            )
            
            if st.button("🔄 Load Greek Data", key="load_greeks"):
                with st.spinner(f"Loading Greek data for {greek_ticker}..."):
                    if st.session_state.scanner and st.session_state.scanner.uw_key:
                        # Get Greek exposure data
                        exposure_data = st.session_state.scanner.get_greek_exposure(greek_ticker)
                        flow_data = st.session_state.scanner.get_greek_flow(greek_ticker)
                        
                        st.session_state['greek_exposure'] = exposure_data
                        st.session_state['greek_flow'] = flow_data
                        st.success("Greek data loaded!")
                    else:
                        st.warning("Please configure Unusual Whales API key")
        
        # Display Greek Heat Map
        if 'greek_exposure' in st.session_state and st.session_state['greek_exposure']:
            st.markdown("### 🗺️ Greek Exposure Heat Map")
            
            exposure = st.session_state['greek_exposure']
            
            # Create heat map data
            strikes = []
            call_deltas = []
            put_deltas = []
            call_gammas = []
            put_gammas = []
            
            for item in exposure[:20]:  # Limit to 20 strikes for visibility
                strike = float(item.get('strike', 0))
                if strike:
                    strikes.append(strike)
                    call_deltas.append(float(item.get('call_delta', 0)))
                    put_deltas.append(float(item.get('put_delta', 0)))
                    call_gammas.append(float(item.get('call_gamma', 0)))
                    put_gammas.append(float(item.get('put_gamma', 0)))
            
            if strikes:
                # Create subplots for heat maps
                fig = make_subplots(
                    rows=2, cols=2,
                    subplot_titles=('Call Delta Exposure', 'Put Delta Exposure', 
                                   'Call Gamma Exposure', 'Put Gamma Exposure'),
                    vertical_spacing=0.12,
                    horizontal_spacing=0.1
                )
                
                # Call Delta
                fig.add_trace(
                    go.Bar(x=strikes, y=call_deltas, 
                          marker=dict(color=call_deltas, colorscale='RdYlGn'),
                          name='Call Delta'),
                    row=1, col=1
                )
                
                # Put Delta
                fig.add_trace(
                    go.Bar(x=strikes, y=put_deltas,
                          marker=dict(color=put_deltas, colorscale='RdYlGn_r'),
                          name='Put Delta'),
                    row=1, col=2
                )
                
                # Call Gamma
                fig.add_trace(
                    go.Bar(x=strikes, y=call_gammas,
                          marker=dict(color=call_gammas, colorscale='Viridis'),
                          name='Call Gamma'),
                    row=2, col=1
                )
                
                # Put Gamma
                fig.add_trace(
                    go.Bar(x=strikes, y=put_gammas,
                          marker=dict(color=put_gammas, colorscale='Viridis'),
                          name='Put Gamma'),
                    row=2, col=2
                )
                
                fig.update_layout(
                    height=600,
                    showlegend=False,
                    plot_bgcolor='#1a1a2e',
                    paper_bgcolor='#1a1a2e',
                    font=dict(color='#e0e0e0')
                )
                
                fig.update_xaxes(title_text="Strike", gridcolor='#2a2a3e')
                fig.update_yaxes(title_text="Exposure", gridcolor='#2a2a3e')
                
                st.plotly_chart(fig, use_container_width=True)
        
        # Display Greek Flow
        if 'greek_flow' in st.session_state and st.session_state['greek_flow']:
            st.markdown("### 📊 Directional Greek Flow")
            
            flow = st.session_state['greek_flow']
            
            if flow:
                # Create metrics for latest flow
                latest_flow = flow[0] if isinstance(flow, list) else flow
                
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    total_delta = float(latest_flow.get('total_delta_flow', 0))
                    st.metric(
                        "Total Delta Flow",
                        f"{total_delta:,.0f}",
                        delta="Bullish" if total_delta > 0 else "Bearish"
                    )
                
                with col2:
                    total_vega = float(latest_flow.get('total_vega_flow', 0))
                    st.metric(
                        "Total Vega Flow",
                        f"{total_vega:,.0f}",
                        delta="Vol Long" if total_vega > 0 else "Vol Short"
                    )
                
                with col3:
                    dir_delta = float(latest_flow.get('dir_delta_flow', 0))
                    st.metric(
                        "Directional Delta",
                        f"{dir_delta:,.0f}",
                        delta="Smart Money" if abs(dir_delta) > 10000 else "Retail"
                    )
                
                with col4:
                    volume = int(latest_flow.get('volume', 0))
                    st.metric(
                        "Flow Volume",
                        f"{volume:,}",
                        delta=f"{latest_flow.get('transactions', 0)} trades"
                    )
                
                # Flow Direction Gauge
                st.markdown("### 🎯 Market Direction Indicator")
                
                # Calculate directional score (-100 to 100)
                max_delta = 1000000  # Normalize factor
                direction_score = min(100, max(-100, (total_delta / max_delta) * 100))
                
                # Create gauge chart
                fig = go.Figure(go.Indicator(
                    mode="gauge+number+delta",
                    value=direction_score,
                    title={'text': "Market Sentiment"},
                    delta={'reference': 0},
                    gauge={
                        'axis': {'range': [-100, 100]},
                        'bar': {'color': "#00ff88" if direction_score > 0 else "#ff6b6b"},
                        'steps': [
                            {'range': [-100, -50], 'color': '#ff0000'},
                            {'range': [-50, -20], 'color': '#ff6b6b'},
                            {'range': [-20, 20], 'color': '#ffff00'},
                            {'range': [20, 50], 'color': '#90ee90'},
                            {'range': [50, 100], 'color': '#00ff00'}
                        ],
                        'threshold': {
                            'line': {'color': "white", 'width': 4},
                            'thickness': 0.75,
                            'value': direction_score
                        }
                    }
                ))
                
                fig.update_layout(
                    height=300,
                    plot_bgcolor='#1a1a2e',
                    paper_bgcolor='#1a1a2e',
                    font=dict(color='#e0e0e0', size=16)
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Interpretation
                if direction_score > 50:
                    st.success("🚀 **STRONG BULLISH FLOW** - Smart money is aggressively buying calls")
                elif direction_score > 20:
                    st.info("📈 **BULLISH FLOW** - Moderate call buying detected")
                elif direction_score > -20:
                    st.warning("➡️ **NEUTRAL FLOW** - Mixed directional signals")
                elif direction_score > -50:
                    st.warning("📉 **BEARISH FLOW** - Moderate put buying detected")
                else:
                    st.error("🐻 **STRONG BEARISH FLOW** - Smart money is aggressively buying puts")
        
        else:
            st.info("👆 Select a ticker and click 'Load Greek Data' to see heat maps and flow analysis")
    
    with tab6:
        st.subheader("📋 All Results")
        
        # Filters
        col1, col2, col3 = st.columns(3)
        
        with col1:
            filter_ticker = st.multiselect(
                "Filter by ticker:",
                results['ticker'].unique(),
                default=results['ticker'].unique()
            )
        
        with col2:
            filter_strategy = st.multiselect(
                "Filter by strategy:",
                results['strategy'].unique(),
                default=results['strategy'].unique()
            )
        
        with col3:
            min_return_filter = st.slider(
                "Minimum return:",
                min_value=int(results['return'].min()),
                max_value=int(results['return'].max()),
                value=int(results['return'].min())
            )
        
        # Apply filters
        filtered = results[
            (results['ticker'].isin(filter_ticker)) &
            (results['strategy'].isin(filter_strategy)) &
            (results['return'] >= min_return_filter)
        ]
        
        st.markdown(f"Showing {len(filtered)} of {len(results)} results")
        
        # Determine which columns to show
        base_cols = ['ticker', 'strategy', 'expiration', 'dte', 'return', 'current_price']
        
        # Add optional columns if they exist
        optional_cols = ['strike', 'premium', 'breakeven', 'iv', 'delta', 'gamma', 'theta', 
                        'volume', 'open_interest', 'max_profit', 'max_loss']
        
        display_cols = base_cols + [col for col in optional_cols if col in filtered.columns]
        
        # Format the dataframe
        format_dict = {
            'return': '{:.1f}%',
            'current_price': '${:.2f}',
            'strike': '${:.2f}',
            'premium': '${:.2f}',
            'breakeven': '${:.2f}',
            'max_profit': '${:.2f}',
            'max_loss': '${:.2f}',
            'iv': '{:.1f}%',
            'delta': '{:.3f}',
            'gamma': '{:.4f}',
            'theta': '{:.3f}',
            'vega': '{:.3f}',
            'upside': '{:.1f}%',
            'if_called': '{:.1f}%'
        }
        
        # Only apply formats for columns that exist
        format_dict = {k: v for k, v in format_dict.items() if k in display_cols}
        
        # Display with Greeks highlighted if available
        if 'iv' in display_cols or 'delta' in display_cols:
            st.info("📊 Greeks and IV data available! Scroll right to see all columns.")
        
        # Display filtered results
        st.dataframe(
            filtered[display_cols].style.format(format_dict).background_gradient(
                subset=['return'], cmap='RdYlGn'
            ).background_gradient(
                subset=['iv'] if 'iv' in display_cols else [], 
                cmap='YlOrRd'
            ),
            use_container_width=True,
            height=600
        )

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray;'>
    Options Scanner Dashboard | Data provided by Polygon.io | 
    Last scan: {timestamp}
</div>
""".format(
    timestamp=st.session_state.scan_history[-1]['timestamp'].strftime('%Y-%m-%d %H:%M:%S') 
    if st.session_state.scan_history else "No scans yet"
), unsafe_allow_html=True)

# Auto-refresh option
if st.sidebar.checkbox("Auto-refresh (5 min)", value=False):
    time.sleep(300)
    st.rerun()
