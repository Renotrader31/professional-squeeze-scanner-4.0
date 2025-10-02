"""
Ultimate Squeeze Scanner - Specialized squeeze detection with Ortex integration
Detects gamma squeezes, short squeezes, and options flow anomalies
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

class SqueezeAnalyzer:
    """Advanced squeeze detection and analysis"""
    
    def __init__(self, ortex_key: str = None, polygon_key: str = None, uw_key: str = None):
        """Initialize with multiple data sources"""
        self.ortex_key = ortex_key
        self.polygon_key = polygon_key 
        self.uw_key = uw_key
        
    def get_ortex_data(self, ticker: str) -> Dict:
        """Get comprehensive Ortex data for squeeze analysis"""
        if not self.ortex_key:
            return {}
            
        try:
            headers = {
                "Authorization": f"Bearer {self.ortex_key}",
                "Content-Type": "application/json"
            }
            
            # Get short interest data
            url = f"https://api.ortex.com/v1/equities/{ticker}/short-interest"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'short_interest': data.get('short_interest', 0),
                    'days_to_cover': data.get('days_to_cover', 0),
                    'utilization': data.get('utilization', 0),
                    'cost_to_borrow': data.get('cost_to_borrow', 0),
                    'short_squeeze_signal': data.get('short_squeeze_signal', 0)
                }
        except Exception as e:
            print(f"Ortex API error for {ticker}: {e}")
            
        return {}
    
    def calculate_gamma_exposure(self, ticker: str) -> Dict:
        """Calculate total gamma exposure and potential squeeze levels"""
        if not self.uw_key:
            return {}
            
        try:
            headers = {
                "Accept": "application/json", 
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            # Get options chain for gamma calculation
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/options/chain"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                total_call_gamma = 0
                total_put_gamma = 0
                gamma_levels = {}
                
                for option in data.get('data', []):
                    strike = float(option.get('strike', 0))
                    gamma = float(option.get('gamma', 0))
                    open_interest = float(option.get('open_interest', 0))
                    
                    # Calculate gamma exposure per strike
                    if option.get('option_type') == 'call':
                        gamma_exposure = gamma * open_interest * 100
                        total_call_gamma += gamma_exposure
                        gamma_levels[strike] = gamma_levels.get(strike, 0) + gamma_exposure
                    else:
                        gamma_exposure = -gamma * open_interest * 100  # Negative for puts
                        total_put_gamma += abs(gamma_exposure)
                        gamma_levels[strike] = gamma_levels.get(strike, 0) + gamma_exposure
                
                # Find maximum gamma level (potential pin level)
                max_gamma_strike = max(gamma_levels.keys(), key=lambda k: abs(gamma_levels[k])) if gamma_levels else 0
                
                return {
                    'total_call_gamma': total_call_gamma,
                    'total_put_gamma': total_put_gamma,
                    'net_gamma': total_call_gamma - total_put_gamma,
                    'max_gamma_strike': max_gamma_strike,
                    'max_gamma_level': gamma_levels.get(max_gamma_strike, 0),
                    'gamma_levels': gamma_levels
                }
                
        except Exception as e:
            print(f"Gamma calculation error: {e}")
            
        return {}
    
    def detect_unusual_options_flow(self, ticker: str) -> Dict:
        """Detect unusual options activity that could trigger squeezes"""
        if not self.uw_key:
            return {}
            
        try:
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            # Get unusual options activity
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/options/flow"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                call_volume = 0
                put_volume = 0
                large_trades = []
                
                for flow in data.get('data', []):
                    volume = float(flow.get('volume', 0))
                    premium = float(flow.get('premium', 0))
                    
                    if flow.get('option_type') == 'call':
                        call_volume += volume
                    else:
                        put_volume += volume
                    
                    # Track large unusual trades
                    if premium > 100000:  # $100k+ premium trades
                        large_trades.append({
                            'type': flow.get('option_type'),
                            'strike': flow.get('strike'),
                            'premium': premium,
                            'volume': volume,
                            'sentiment': flow.get('sentiment', 'neutral')
                        })
                
                call_put_ratio = call_volume / put_volume if put_volume > 0 else float('inf')
                
                return {
                    'call_volume': call_volume,
                    'put_volume': put_volume,
                    'call_put_ratio': call_put_ratio,
                    'large_trades': large_trades,
                    'total_premium': sum(trade['premium'] for trade in large_trades),
                    'bullish_flow': call_volume > put_volume * 2,  # Significantly more calls
                    'squeeze_potential': len([t for t in large_trades if t['premium'] > 500000])  # Mega trades
                }
                
        except Exception as e:
            print(f"Flow analysis error: {e}")
            
        return {}
    
    def calculate_squeeze_score(self, ticker: str) -> Dict:
        """Calculate comprehensive squeeze score (0-100)"""
        
        # Get all data sources
        ortex_data = self.get_ortex_data(ticker)
        gamma_data = self.calculate_gamma_exposure(ticker)
        flow_data = self.detect_unusual_options_flow(ticker)
        
        score = 0
        factors = {}
        
        # Short Interest Factor (0-30 points)
        short_interest = ortex_data.get('short_interest', 0)
        if short_interest > 20:
            factors['high_short_interest'] = min(30, short_interest)
            score += factors['high_short_interest']
        
        # Days to Cover Factor (0-20 points)
        days_to_cover = ortex_data.get('days_to_cover', 0)
        if days_to_cover > 3:
            factors['high_days_to_cover'] = min(20, days_to_cover * 3)
            score += factors['high_days_to_cover']
        
        # Utilization Factor (0-15 points)
        utilization = ortex_data.get('utilization', 0)
        if utilization > 80:
            factors['high_utilization'] = min(15, (utilization - 80) * 0.75)
            score += factors['high_utilization']
        
        # Cost to Borrow Factor (0-15 points)
        ctb = ortex_data.get('cost_to_borrow', 0)
        if ctb > 10:
            factors['high_borrow_cost'] = min(15, ctb * 1.5)
            score += factors['high_borrow_cost']
        
        # Gamma Squeeze Factor (0-10 points)
        net_gamma = gamma_data.get('net_gamma', 0)
        if net_gamma > 1000000:  # 1M+ net gamma
            factors['gamma_squeeze_risk'] = min(10, net_gamma / 500000)
            score += factors['gamma_squeeze_risk']
        
        # Options Flow Factor (0-10 points)  
        if flow_data.get('bullish_flow', False):
            factors['bullish_options_flow'] = 5
            score += 5
        
        squeeze_potential = flow_data.get('squeeze_potential', 0)
        if squeeze_potential > 0:
            factors['mega_trade_activity'] = min(5, squeeze_potential * 2)
            score += factors['mega_trade_activity']
        
        # Determine squeeze type and risk level
        squeeze_type = "None"
        if score >= 80:
            squeeze_type = "EXTREME SQUEEZE RISK"
        elif score >= 60:
            squeeze_type = "High Squeeze Risk"  
        elif score >= 40:
            squeeze_type = "Moderate Squeeze Risk"
        elif score >= 20:
            squeeze_type = "Low Squeeze Risk"
        
        return {
            'ticker': ticker,
            'squeeze_score': min(100, score),
            'squeeze_type': squeeze_type,
            'factors': factors,
            'ortex_data': ortex_data,
            'gamma_data': gamma_data,
            'flow_data': flow_data,
            'timestamp': datetime.now().isoformat()
        }
    
    def scan_squeeze_candidates(self, tickers: List[str]) -> List[Dict]:
        """Scan multiple tickers for squeeze potential"""
        
        results = []
        
        print(f"🔍 Scanning {len(tickers)} tickers for squeeze potential...")
        
        for i, ticker in enumerate(tickers):
            try:
                print(f"  📊 Analyzing {ticker} ({i+1}/{len(tickers)})")
                
                squeeze_data = self.calculate_squeeze_score(ticker)
                
                if squeeze_data['squeeze_score'] > 0:  # Only include potential squeezes
                    results.append(squeeze_data)
                    
            except Exception as e:
                print(f"  ❌ Error analyzing {ticker}: {e}")
                continue
        
        if results:
            # Sort by squeeze score
            results.sort(key=lambda x: x['squeeze_score'], reverse=True)
            return results
        else:
            return []
    
    def get_squeeze_alerts(self, min_score: float = 60) -> List[Dict]:
        """Get high-priority squeeze alerts"""
        
        # High-priority tickers to monitor
        priority_tickers = [
            'GME', 'AMC', 'BBBY', 'ATER', 'SPRT', 'IRNT', 'OPAD',
            'MRIN', 'BGFV', 'PROG', 'PHUN', 'DWAC', 'BKKT', 'MARK'
        ]
        
        alerts = []
        
        for ticker in priority_tickers:
            squeeze_data = self.calculate_squeeze_score(ticker)
            
            if squeeze_data['squeeze_score'] >= min_score:
                alerts.append({
                    'ticker': ticker,
                    'score': squeeze_data['squeeze_score'],
                    'type': squeeze_data['squeeze_type'],
                    'alert_level': 'CRITICAL' if squeeze_data['squeeze_score'] >= 80 else 'HIGH',
                    'key_factors': list(squeeze_data['factors'].keys()),
                    'timestamp': squeeze_data['timestamp']
                })
        
        return sorted(alerts, key=lambda x: x['score'], reverse=True)