"""
Enhanced Options Strategy Scanner
Supports: Bull/Bear Spreads, Cash-Secured Puts, Covered Calls, Straddles, Strangles, Iron Condors
Compatible with Polygon.io API (and extensible for Unusual Whales)
"""

import os
from polygon import RESTClient
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import warnings
import requests
import json
warnings.filterwarnings('ignore')

class OptionsScanner:
    """Main options scanner class with support for multiple strategies"""
    
    def __init__(self, polygon_key: str, unusual_whales_key: str = None):
        """Initialize scanner with API keys"""
        self.polygon_client = RESTClient(polygon_key) if polygon_key else None
        self.uw_key = unusual_whales_key
        self.results = []
        
        # Set data source priority
        self.use_unusual_whales = bool(unusual_whales_key)
        
    def get_current_price_uw(self, ticker: str) -> Optional[float]:
        """Get current price from Unusual Whales"""
        if not self.uw_key:
            return None
            
        try:
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            # Try stock quote endpoint
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/quote"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data:
                    return float(data['data'].get('last_price', 0)) or float(data['data'].get('close', 0))
            
            # Fallback to options chain to get underlying price
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/options/chain"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and len(data['data']) > 0:
                    # Get underlying price from first option
                    return float(data['data'][0].get('underlying_price', 0))
                    
        except Exception as e:
            print(f"UW price error for {ticker}: {str(e)[:100]}")
            
        return None
    
    def get_greeks_uw(self, ticker: str, exp_date: str = None) -> Dict:
        """Get Greeks data from Unusual Whales greek endpoint"""
        if not self.uw_key:
            return {}
            
        try:
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            # Use the greeks endpoint
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/greeks"
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data:
                    print(f"  📊 Retrieved Greeks data from Unusual Whales")
                    return data['data']
            else:
                print(f"Greeks API response: {response.status_code}")
                
        except Exception as e:
            print(f"Error getting Greeks: {str(e)[:100]}")
            
        return []
    
    def get_options_chain_uw(self, ticker: str, exp_date: str) -> Tuple[Dict, Dict]:
        """Get options chain from Unusual Whales using option-contracts endpoint"""
        calls = {}
        puts = {}
        
        if not self.uw_key:
            return calls, puts
            
        try:
            headers = {
                "Accept": "application/json", 
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            # Get the option contracts
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/option-contracts"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Get Greeks data separately
                greeks_data = self.get_greeks_uw(ticker)
                greeks_by_strike = {}
                
                # Process Greeks data - it's organized by strike and date
                if greeks_data and isinstance(greeks_data, list):
                    for greek_item in greeks_data:
                        strike = greek_item.get('strike', 0)
                        expiry = greek_item.get('expiry', greek_item.get('date', ''))
                        if strike and expiry == exp_date:
                            greeks_by_strike[strike] = greek_item
                
                if 'data' in data:
                    contracts = data['data']
                    if isinstance(contracts, list):
                        for contract in contracts:
                            # Check if this contract matches our expiration
                            contract_exp = contract.get('expiry', contract.get('expiration', ''))
                            if contract_exp != exp_date:
                                continue
                                
                            strike = float(contract.get('strike', 0))
                            opt_type = contract.get('type', contract.get('option_type', '')).lower()
                            
                            # Get price data
                            ask = float(contract.get('ask', 0))
                            bid = float(contract.get('bid', 0))
                            last = float(contract.get('last', contract.get('last_price', 0)))
                            
                            # Calculate midpoint or use last
                            if ask > 0 and bid > 0:
                                price = (ask + bid) / 2
                            elif last > 0:
                                price = last
                            else:
                                price = ask or bid
                            
                            if price > 0 and strike > 0:
                                # Get Greeks for this strike if available
                                greek_info = greeks_by_strike.get(strike, {})
                                
                                # Build option data with Greeks from the greeks endpoint
                                if 'call' in opt_type or opt_type == 'c':
                                    option_data = {
                                        'price': price,
                                        'volume': contract.get('volume', 0),
                                        'oi': contract.get('open_interest', 0),
                                        'iv': contract.get('implied_volatility', greek_info.get('call_volatility', 0)),
                                        'delta': greek_info.get('call_delta', 0),
                                        'gamma': greek_info.get('call_gamma', 0),
                                        'theta': greek_info.get('call_theta', 0),
                                        'vega': greek_info.get('call_vega', 0),
                                        'ticker': contract.get('option_symbol', '')
                                    }
                                    calls[strike] = option_data
                                    
                                elif 'put' in opt_type or opt_type == 'p':
                                    option_data = {
                                        'price': price,
                                        'volume': contract.get('volume', 0),
                                        'oi': contract.get('open_interest', 0),
                                        'iv': contract.get('implied_volatility', greek_info.get('put_volatility', 0)),
                                        'delta': greek_info.get('put_delta', 0),
                                        'gamma': greek_info.get('put_gamma', 0),
                                        'theta': greek_info.get('put_theta', 0),
                                        'vega': greek_info.get('put_vega', 0),
                                        'ticker': contract.get('option_symbol', '')
                                    }
                                    puts[strike] = option_data
                    
                    # Debug output
                    if calls or puts:
                        sample_call = next(iter(calls.values())) if calls else None
                        if sample_call and sample_call.get('delta'):
                            print(f"  ✅ Greeks loaded! Delta: {sample_call['delta']:.3f}")
                    
                    print(f"  📊 Using Unusual Whales data - Found {len(calls)} calls, {len(puts)} puts")
                                
        except Exception as e:
            print(f"UW chain error for {ticker}: {str(e)[:100]}")
            
        return calls, puts
    
    def get_expirations_uw(self, ticker: str) -> List[str]:
        """Get available expirations from Unusual Whales"""
        if not self.uw_key:
            return []
            
        try:
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            # First try to get from option-contracts endpoint
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/option-contracts"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data:
                    # Extract unique expiration dates
                    expirations = set()
                    for contract in data['data']:
                        exp = contract.get('expiry', contract.get('expiration', ''))
                        if exp:
                            expirations.add(exp)
                    return sorted(list(expirations))
                    
        except Exception as e:
            print(f"UW expirations error: {str(e)[:100]}")
            
        return []
        
    def scan_all_strategies(self, tickers: List[str], days: int = 30, 
                           min_return: float = 20, iv_rank_min: float = None) -> pd.DataFrame:
        """Scan all available strategies across multiple tickers"""
        
        if isinstance(tickers, str):
            tickers = [tickers]
            
        all_results = []
        
        for ticker in tickers:
            print(f"\n{'='*50}")
            print(f"Scanning {ticker}...")
            print('='*50)
            
            try:
                # Get current price
                price = self.get_current_price(ticker)
                if not price:
                    print(f"⚠️  No price data for {ticker}")
                    continue
                
                print(f"📊 Current price: ${price:.2f}")
                
                # Get closest expiration
                exp_date, dte = self.get_target_expiration(ticker, days)
                if not exp_date:
                    print(f"⚠️  No options available for {ticker}")
                    continue
                    
                print(f"📅 Using expiration: {exp_date} ({dte} days)")
                
                # Get full options chain
                calls, puts = self.get_full_chain(ticker, exp_date)
                
                if not calls and not puts:
                    print(f"⚠️  No options data available")
                    continue
                    
                print(f"📈 Found {len(calls)} calls and {len(puts)} puts")
                
                # Get IV if available
                iv = self.get_implied_volatility(ticker, exp_date)
                if iv:
                    print(f"📊 Implied Volatility: {iv:.1f}%")
                
                # Scan each strategy type
                strategies = {
                    'Long Calls': self.find_long_calls,
                    'Long Puts': self.find_long_puts,
                    'Short Calls (Naked)': self.find_short_calls,
                    'Short Puts (Naked)': self.find_short_puts,
                    'Bull Call Spreads': self.find_bull_call_spreads,
                    'Bear Put Spreads': self.find_bear_put_spreads,
                    'Cash-Secured Puts': self.find_cash_secured_puts,
                    'Covered Calls': self.find_covered_calls,
                    'Long Straddles': self.find_straddles,
                    'Long Strangles': self.find_strangles,
                    'Iron Condors': self.find_iron_condors,
                    'Credit Spreads': self.find_credit_spreads
                }
                
                for strategy_name, strategy_func in strategies.items():
                    try:
                        if strategy_name in ['Long Straddles', 'Long Strangles', 'Iron Condors']:
                            results = strategy_func(ticker, price, exp_date, dte, calls, puts, min_return)
                        elif strategy_name in ['Covered Calls', 'Long Calls', 'Short Calls (Naked)']:
                            results = strategy_func(ticker, price, exp_date, dte, calls, min_return)
                        elif strategy_name in ['Cash-Secured Puts', 'Long Puts', 'Short Puts (Naked)']:
                            results = strategy_func(ticker, price, exp_date, dte, puts, min_return)
                        elif strategy_name == 'Credit Spreads':
                            results = strategy_func(ticker, price, exp_date, dte, calls, puts, min_return)
                        else:
                            if strategy_name == 'Bull Call Spreads':
                                results = strategy_func(ticker, price, exp_date, dte, calls, min_return)
                            else:
                                results = strategy_func(ticker, price, exp_date, dte, puts, min_return)
                        
                        if results:
                            all_results.extend(results)
                            print(f"  ✅ {strategy_name}: {len(results)} opportunities")
                    except Exception as e:
                        print(f"  ❌ Error scanning {strategy_name}: {e}")
                        
            except Exception as e:
                print(f"❌ Error processing {ticker}: {e}")
        
        # Convert to DataFrame and sort by return
        if all_results:
            df = pd.DataFrame(all_results)
            df = df.sort_values('return', ascending=False)
            self.results = df
            return df
        else:
            print("\n⚠️  No viable strategies found")
            return pd.DataFrame()
    
    def get_current_price(self, ticker: str) -> Optional[float]:
        """Get current stock price - try UW first, then Polygon"""
        # Try Unusual Whales first if available
        if self.use_unusual_whales:
            price = self.get_current_price_uw(ticker)
            if price:
                return price
        
        # Fallback to Polygon
        if self.polygon_client:
            try:
                today = datetime.now()
                start = (today - timedelta(days=10)).strftime("%Y-%m-%d")
                end = today.strftime("%Y-%m-%d")
                
                # Try to get recent price data
                for days_back in [5, 10, 20]:
                    try:
                        start = (today - timedelta(days=days_back)).strftime("%Y-%m-%d")
                        aggs = list(self.polygon_client.list_aggs(
                            ticker, 1, "day", start, end, limit=5
                        ))
                        if aggs:
                            return aggs[-1].close
                    except Exception:
                        continue
                        
                # If still no data, try minute bars for today
                try:
                    aggs = list(self.polygon_client.list_aggs(
                        ticker, 1, "minute", end, end, limit=1
                    ))
                    if aggs:
                        return aggs[-1].close
                except:
                    pass
                    
            except Exception as e:
                print(f"Polygon error for {ticker}: {str(e)[:100]}")
                
        return None
    
    def get_target_expiration(self, ticker: str, target_days: int) -> Tuple[Optional[str], Optional[int]]:
        """Get expiration date closest to target days - try UW first"""
        today = datetime.now()
        
        # Try Unusual Whales first
        if self.use_unusual_whales:
            expirations = self.get_expirations_uw(ticker)
            if expirations:
                best_exp = None
                best_diff = float('inf')
                
                for exp in expirations:
                    exp_dt = datetime.strptime(exp, "%Y-%m-%d")
                    dte = (exp_dt - today).days
                    if dte > 0:
                        diff = abs(dte - target_days)
                        if diff < best_diff:
                            best_diff = diff
                            best_exp = exp
                            best_dte = dte
                
                if best_exp:
                    return best_exp, best_dte
        
        # Fallback to Polygon
        if self.polygon_client:
            try:
                target = (today + timedelta(days=target_days)).strftime("%Y-%m-%d")
                
                contracts = list(self.polygon_client.list_options_contracts(
                    underlying_ticker=ticker,
                    expiration_date_gte=today.strftime("%Y-%m-%d"),
                    limit=100
                ))
                
                if not contracts:
                    return None, None
                
                # Find closest expiration to target
                expirations = {}
                for contract in contracts:
                    exp = contract.expiration_date
                    if exp not in expirations:
                        exp_dt = datetime.strptime(exp, "%Y-%m-%d")
                        dte = (exp_dt - today).days
                        if dte > 0:  # Only future dates
                            expirations[exp] = abs(dte - target_days)
                
                if not expirations:
                    return None, None
                    
                # Get closest expiration
                best_exp = min(expirations, key=expirations.get)
                best_dte = (datetime.strptime(best_exp, "%Y-%m-%d") - today).days
                
                return best_exp, best_dte
                
            except Exception as e:
                print(f"Error getting expiration: {str(e)[:100]}")
                
        return None, None
    
    def get_full_chain(self, ticker: str, exp_date: str) -> Tuple[Dict, Dict]:
        """Get full options chain - try UW first, then Polygon"""
        # Try Unusual Whales first
        if self.use_unusual_whales:
            calls, puts = self.get_options_chain_uw(ticker, exp_date)
            if calls or puts:
                print(f"  📊 Using Unusual Whales data")
                return calls, puts
        
        # Fallback to Polygon
        calls = {}
        puts = {}
        
        if self.polygon_client:
            try:
                today = datetime.now()
                start = (today - timedelta(days=5)).strftime("%Y-%m-%d")
                end = today.strftime("%Y-%m-%d")
                
                # Get all contracts for this expiration
                for contract in self.polygon_client.list_options_contracts(
                    underlying_ticker=ticker,
                    expiration_date=exp_date,
                    limit=250
                ):
                    try:
                        # Get latest price for this contract
                        aggs = list(self.polygon_client.list_aggs(
                            contract.ticker, 1, "day", start, end, limit=1
                        ))
                        
                        if aggs and aggs[-1].close > 0:
                            if contract.contract_type == "call":
                                calls[contract.strike_price] = {
                                    'price': aggs[-1].close,
                                    'volume': aggs[-1].volume if hasattr(aggs[-1], 'volume') else 0,
                                    'ticker': contract.ticker
                                }
                            else:
                                puts[contract.strike_price] = {
                                    'price': aggs[-1].close,
                                    'volume': aggs[-1].volume if hasattr(aggs[-1], 'volume') else 0,
                                    'ticker': contract.ticker
                                }
                    except:
                        pass
                        
            except Exception as e:
                print(f"Polygon chain error: {str(e)[:100]}")
                
        return calls, puts
    
    def get_implied_volatility(self, ticker: str, exp_date: str) -> Optional[float]:
        """Get average implied volatility for ATM options"""
        # This would require additional calculation or API endpoint
        # Placeholder for now - you could integrate with Unusual Whales here
        return None
    
    def find_bull_call_spreads(self, ticker: str, price: float, exp_date: str, 
                               dte: int, calls: Dict, min_return: float) -> List[Dict]:
        """Find bull call spread opportunities"""
        results = []
        strikes = sorted(calls.keys())
        
        for i, long_strike in enumerate(strikes):
            # Look for strikes near the money
            if long_strike < price * 0.9 or long_strike > price * 1.05:
                continue
                
            for short_strike in strikes[i+1:]:
                # Reasonable spread width
                if short_strike > long_strike * 1.15:
                    break
                    
                long_price = calls[long_strike]['price']
                short_price = calls[short_strike]['price']
                
                debit = long_price - short_price
                if debit <= 0:
                    continue
                    
                max_profit = (short_strike - long_strike) - debit
                if max_profit <= 0:
                    continue
                    
                ror = (max_profit / debit) * 100
                prob_profit = self.calculate_probability_itm(ticker, price, long_strike, dte)
                
                if ror >= min_return:
                    results.append({
                        'ticker': ticker,
                        'strategy': 'Bull Call Spread',
                        'expiration': exp_date,
                        'dte': dte,
                        'current_price': price,
                        'long_strike': long_strike,
                        'short_strike': short_strike,
                        'debit': round(debit, 2),
                        'max_profit': round(max_profit, 2),
                        'max_loss': round(debit, 2),
                        'return': round(ror, 1),
                        'breakeven': round(long_strike + debit, 2),
                        'probability': prob_profit
                    })
        
        return results
    
    def find_bear_put_spreads(self, ticker: str, price: float, exp_date: str,
                             dte: int, puts: Dict, min_return: float) -> List[Dict]:
        """Find bear put spread opportunities"""
        results = []
        strikes = sorted(puts.keys(), reverse=True)
        
        for i, long_strike in enumerate(strikes):
            # Look for strikes near the money
            if long_strike > price * 1.1 or long_strike < price * 0.95:
                continue
                
            for short_strike in strikes[i+1:]:
                # Reasonable spread width
                if short_strike < long_strike * 0.85:
                    break
                    
                long_price = puts[long_strike]['price']
                short_price = puts[short_strike]['price']
                
                debit = long_price - short_price
                if debit <= 0:
                    continue
                    
                max_profit = (long_strike - short_strike) - debit
                if max_profit <= 0:
                    continue
                    
                ror = (max_profit / debit) * 100
                
                if ror >= min_return:
                    results.append({
                        'ticker': ticker,
                        'strategy': 'Bear Put Spread',
                        'expiration': exp_date,
                        'dte': dte,
                        'current_price': price,
                        'long_strike': long_strike,
                        'short_strike': short_strike,
                        'debit': round(debit, 2),
                        'max_profit': round(max_profit, 2),
                        'max_loss': round(debit, 2),
                        'return': round(ror, 1),
                        'breakeven': round(long_strike - debit, 2)
                    })
        
        return results
    
    def find_cash_secured_puts(self, ticker: str, price: float, exp_date: str,
                              dte: int, puts: Dict, min_return: float) -> List[Dict]:
        """Find cash-secured put opportunities"""
        results = []
        
        for strike, data in puts.items():
            # Only OTM puts
            if strike >= price:
                continue
                
            premium = data['price']
            
            # Calculate annualized return
            annual_return = (premium / strike) * (365 / dte) * 100
            
            # Calculate downside protection
            protection = ((price - strike + premium) / price) * 100
            
            if annual_return >= min_return:
                results.append({
                    'ticker': ticker,
                    'strategy': 'Cash-Secured Put',
                    'expiration': exp_date,
                    'dte': dte,
                    'current_price': price,
                    'strike': strike,
                    'premium': round(premium, 2),
                    'collateral': strike * 100,
                    'return': round(annual_return, 1),
                    'protection': round(protection, 1),
                    'breakeven': round(strike - premium, 2)
                })
        
        return results
    
    def find_long_calls(self, ticker: str, price: float, exp_date: str,
                       dte: int, calls: Dict, min_return: float) -> List[Dict]:
        """Find long call opportunities (bullish)"""
        results = []
        
        for strike, data in calls.items():
            # Focus on near-the-money and slightly OTM calls
            if strike < price * 0.95 or strike > price * 1.10:
                continue
                
            premium = data['price']
            
            # Calculate required move to breakeven
            breakeven = strike + premium
            required_move = ((breakeven - price) / price) * 100
            
            # Calculate potential return if stock moves to different targets
            target_10pct = price * 1.10
            target_20pct = price * 1.20
            
            if target_10pct > breakeven:
                return_10pct = ((target_10pct - breakeven) / premium) * 100
            else:
                return_10pct = -100
                
            if target_20pct > breakeven:
                return_20pct = ((target_20pct - breakeven) / premium) * 100
            else:
                return_20pct = -100
            
            # Add if reasonable opportunity
            if required_move < 15:  # Reasonable move required
                results.append({
                    'ticker': ticker,
                    'strategy': 'Long Call',
                    'expiration': exp_date,
                    'dte': dte,
                    'current_price': price,
                    'strike': strike,
                    'premium': round(premium, 2),
                    'breakeven': round(breakeven, 2),
                    'required_move': round(required_move, 1),
                    'return': round(return_10pct, 1),  # Use 10% move as default return metric
                    'return_at_20pct': round(return_20pct, 1),
                    'max_loss': round(premium * 100, 2)
                })
        
        return results
    
    def find_long_puts(self, ticker: str, price: float, exp_date: str,
                       dte: int, puts: Dict, min_return: float) -> List[Dict]:
        """Find long put opportunities (bearish)"""
        results = []
        
        for strike, data in puts.items():
            # Focus on near-the-money and slightly OTM puts
            if strike > price * 1.05 or strike < price * 0.90:
                continue
                
            premium = data['price']
            
            # Calculate required move to breakeven
            breakeven = strike - premium
            required_move = ((price - breakeven) / price) * 100
            
            # Calculate potential return if stock moves to different targets
            target_minus10pct = price * 0.90
            target_minus20pct = price * 0.80
            
            if target_minus10pct < breakeven:
                return_10pct = ((breakeven - target_minus10pct) / premium) * 100
            else:
                return_10pct = -100
                
            if target_minus20pct < breakeven:
                return_20pct = ((breakeven - target_minus20pct) / premium) * 100
            else:
                return_20pct = -100
            
            # Add if reasonable opportunity
            if required_move < 15:  # Reasonable move required
                results.append({
                    'ticker': ticker,
                    'strategy': 'Long Put',
                    'expiration': exp_date,
                    'dte': dte,
                    'current_price': price,
                    'strike': strike,
                    'premium': round(premium, 2),
                    'breakeven': round(breakeven, 2),
                    'required_move': round(required_move, 1),
                    'return': round(return_10pct, 1),  # Use -10% move as default return metric
                    'return_at_minus20pct': round(return_20pct, 1),
                    'max_loss': round(premium * 100, 2)
                })
        
        return results
    
    def find_short_calls(self, ticker: str, price: float, exp_date: str,
                        dte: int, calls: Dict, min_return: float) -> List[Dict]:
        """Find naked call selling opportunities (bearish/neutral)"""
        results = []
        
        for strike, data in calls.items():
            # Focus on OTM calls
            if strike <= price:
                continue
                
            premium = data['price']
            
            # Calculate annualized return on margin
            # Assuming 20% margin requirement for naked calls
            margin_required = strike * 0.20
            annual_return = (premium / margin_required) * (365 / dte) * 100
            
            # Calculate distance from current price
            otm_percentage = ((strike - price) / price) * 100
            
            if annual_return >= min_return and otm_percentage > 3:  # At least 3% OTM
                results.append({
                    'ticker': ticker,
                    'strategy': 'Short Call (Naked)',
                    'expiration': exp_date,
                    'dte': dte,
                    'current_price': price,
                    'strike': strike,
                    'premium': round(premium, 2),
                    'margin_required': round(margin_required * 100, 2),
                    'return': round(annual_return, 1),
                    'otm_percentage': round(otm_percentage, 1),
                    'max_profit': round(premium * 100, 2),
                    'breakeven': round(strike + premium, 2)
                })
        
        return results
    
    def find_short_puts(self, ticker: str, price: float, exp_date: str,
                       dte: int, puts: Dict, min_return: float) -> List[Dict]:
        """Find naked put selling opportunities (bullish/neutral)"""
        results = []
        
        for strike, data in puts.items():
            # Focus on OTM puts
            if strike >= price:
                continue
                
            premium = data['price']
            
            # Calculate annualized return on margin
            # Assuming 20% margin requirement for naked puts
            margin_required = strike * 0.20
            annual_return = (premium / margin_required) * (365 / dte) * 100
            
            # Calculate distance from current price
            otm_percentage = ((price - strike) / price) * 100
            
            if annual_return >= min_return and otm_percentage > 3:  # At least 3% OTM
                results.append({
                    'ticker': ticker,
                    'strategy': 'Short Put (Naked)',
                    'expiration': exp_date,
                    'dte': dte,
                    'current_price': price,
                    'strike': strike,
                    'premium': round(premium, 2),
                    'margin_required': round(margin_required * 100, 2),
                    'return': round(annual_return, 1),
                    'otm_percentage': round(otm_percentage, 1),
                    'max_profit': round(premium * 100, 2),
                    'breakeven': round(strike - premium, 2)
                })
        
        return results
    
    def find_covered_calls(self, ticker: str, price: float, exp_date: str,
                          dte: int, calls: Dict, min_return: float) -> List[Dict]:
        """Find covered call opportunities"""
        results = []
        
        for strike, data in calls.items():
            # Only OTM calls
            if strike <= price:
                continue
                
            premium = data['price']
            
            # Calculate return if called
            total_return = ((strike - price + premium) / price) * 100
            annual_return = total_return * (365 / dte)
            
            if annual_return >= min_return:
                result = {
                    'ticker': ticker,
                    'strategy': 'Covered Call',
                    'expiration': exp_date,
                    'dte': dte,
                    'current_price': price,
                    'strike': strike,
                    'premium': round(premium, 2),
                    'return': round(annual_return, 1),
                    'if_called': round(total_return, 1),
                    'upside': round(((strike - price) / price) * 100, 1)
                }
                
                # Add Greeks and IV if available (from UW data)
                if isinstance(data, dict):
                    if 'iv' in data and data['iv']:
                        result['iv'] = round(data['iv'] * 100, 1) if data['iv'] < 10 else round(data['iv'], 1)
                    if 'delta' in data:
                        result['delta'] = round(data.get('delta', 0), 3)
                    if 'gamma' in data:
                        result['gamma'] = round(data.get('gamma', 0), 4)
                    if 'theta' in data:
                        result['theta'] = round(data.get('theta', 0), 3)
                    if 'vega' in data:
                        result['vega'] = round(data.get('vega', 0), 3)
                    if 'volume' in data:
                        result['volume'] = data['volume']
                    if 'oi' in data:
                        result['open_interest'] = data['oi']
                
                results.append(result)
        
        return results
    
    def find_straddles(self, ticker: str, price: float, exp_date: str,
                      dte: int, calls: Dict, puts: Dict, min_return: float) -> List[Dict]:
        """Find long straddle opportunities"""
        results = []
        
        # Find ATM strike
        atm_strike = min(calls.keys(), key=lambda x: abs(x - price))
        
        if atm_strike in calls and atm_strike in puts:
            call_price = calls[atm_strike]['price']
            put_price = puts[atm_strike]['price']
            total_debit = call_price + put_price
            
            # Calculate breakevens
            upper_be = atm_strike + total_debit
            lower_be = atm_strike - total_debit
            
            # Calculate required move
            required_move = (total_debit / atm_strike) * 100
            
            results.append({
                'ticker': ticker,
                'strategy': 'Long Straddle',
                'expiration': exp_date,
                'dte': dte,
                'current_price': price,
                'strike': atm_strike,
                'call_price': round(call_price, 2),
                'put_price': round(put_price, 2),
                'total_debit': round(total_debit, 2),
                'upper_breakeven': round(upper_be, 2),
                'lower_breakeven': round(lower_be, 2),
                'required_move': round(required_move, 1),
                'return': round(required_move, 1)  # For sorting
            })
        
        return results
    
    def find_strangles(self, ticker: str, price: float, exp_date: str,
                      dte: int, calls: Dict, puts: Dict, min_return: float) -> List[Dict]:
        """Find long strangle opportunities"""
        results = []
        
        # Find OTM strikes
        put_strikes = [s for s in puts.keys() if s < price]
        call_strikes = [s for s in calls.keys() if s > price]
        
        if put_strikes and call_strikes:
            # Use closest OTM strikes
            put_strike = max(put_strikes)
            call_strike = min(call_strikes)
            
            if put_strike in puts and call_strike in calls:
                put_price = puts[put_strike]['price']
                call_price = calls[call_strike]['price']
                total_debit = call_price + put_price
                
                # Calculate breakevens
                upper_be = call_strike + total_debit
                lower_be = put_strike - total_debit
                
                # Calculate required move
                required_move = min(
                    abs(upper_be - price) / price * 100,
                    abs(price - lower_be) / price * 100
                )
                
                results.append({
                    'ticker': ticker,
                    'strategy': 'Long Strangle',
                    'expiration': exp_date,
                    'dte': dte,
                    'current_price': price,
                    'put_strike': put_strike,
                    'call_strike': call_strike,
                    'call_price': round(call_price, 2),
                    'put_price': round(put_price, 2),
                    'total_debit': round(total_debit, 2),
                    'upper_breakeven': round(upper_be, 2),
                    'lower_breakeven': round(lower_be, 2),
                    'required_move': round(required_move, 1),
                    'return': round(required_move, 1)  # For sorting
                })
        
        return results
    
    def find_iron_condors(self, ticker: str, price: float, exp_date: str,
                         dte: int, calls: Dict, puts: Dict, min_return: float) -> List[Dict]:
        """Find iron condor opportunities"""
        results = []
        
        # Get sorted strikes
        all_strikes = sorted(set(list(calls.keys()) + list(puts.keys())))
        
        # Find potential iron condor setups
        for i in range(len(all_strikes) - 3):
            put_short = all_strikes[i+1]
            put_long = all_strikes[i]
            call_short = all_strikes[i+2]
            call_long = all_strikes[i+3]
            
            # Check if strikes are reasonable
            if put_short > price * 0.95 or call_short < price * 1.05:
                continue
                
            # Check all options exist
            if (put_long in puts and put_short in puts and 
                call_short in calls and call_long in calls):
                
                # Calculate credit
                credit = (puts[put_short]['price'] - puts[put_long]['price'] +
                         calls[call_short]['price'] - calls[call_long]['price'])
                
                if credit <= 0:
                    continue
                    
                # Calculate max loss (width of wider spread - credit)
                max_loss = max(put_short - put_long, call_long - call_short) - credit
                
                if max_loss <= 0:
                    continue
                    
                ror = (credit / max_loss) * 100
                
                if ror >= min_return:
                    results.append({
                        'ticker': ticker,
                        'strategy': 'Iron Condor',
                        'expiration': exp_date,
                        'dte': dte,
                        'current_price': price,
                        'put_long': put_long,
                        'put_short': put_short,
                        'call_short': call_short,
                        'call_long': call_long,
                        'credit': round(credit, 2),
                        'max_loss': round(max_loss, 2),
                        'return': round(ror, 1),
                        'lower_breakeven': round(put_short - credit, 2),
                        'upper_breakeven': round(call_short + credit, 2)
                    })
        
        return results
    
    def find_credit_spreads(self, ticker: str, price: float, exp_date: str,
                           dte: int, calls: Dict, puts: Dict, min_return: float) -> List[Dict]:
        """Find put and call credit spread opportunities"""
        results = []
        
        # Put credit spreads (bullish)
        put_strikes = sorted([s for s in puts.keys() if s < price], reverse=True)
        for i in range(len(put_strikes) - 1):
            short_strike = put_strikes[i]
            long_strike = put_strikes[i+1]
            
            if short_strike < price * 0.95:  # Reasonable OTM
                credit = puts[short_strike]['price'] - puts[long_strike]['price']
                if credit > 0:
                    max_loss = (short_strike - long_strike) - credit
                    ror = (credit / max_loss) * 100
                    
                    if ror >= min_return:
                        results.append({
                            'ticker': ticker,
                            'strategy': 'Put Credit Spread',
                            'expiration': exp_date,
                            'dte': dte,
                            'current_price': price,
                            'short_strike': short_strike,
                            'long_strike': long_strike,
                            'credit': round(credit, 2),
                            'max_loss': round(max_loss, 2),
                            'return': round(ror, 1),
                            'breakeven': round(short_strike - credit, 2)
                        })
        
        # Call credit spreads (bearish)
        call_strikes = sorted([s for s in calls.keys() if s > price])
        for i in range(len(call_strikes) - 1):
            short_strike = call_strikes[i]
            long_strike = call_strikes[i+1]
            
            if short_strike > price * 1.05:  # Reasonable OTM
                credit = calls[short_strike]['price'] - calls[long_strike]['price']
                if credit > 0:
                    max_loss = (long_strike - short_strike) - credit
                    ror = (credit / max_loss) * 100
                    
                    if ror >= min_return:
                        results.append({
                            'ticker': ticker,
                            'strategy': 'Call Credit Spread',
                            'expiration': exp_date,
                            'dte': dte,
                            'current_price': price,
                            'short_strike': short_strike,
                            'long_strike': long_strike,
                            'credit': round(credit, 2),
                            'max_loss': round(max_loss, 2),
                            'return': round(ror, 1),
                            'breakeven': round(short_strike + credit, 2)
                        })
        
        return results
    
    def calculate_probability_itm(self, ticker: str, price: float, 
                                 strike: float, dte: int) -> Optional[float]:
        """Calculate probability of option finishing ITM (simplified)"""
        # This is a simplified calculation
        # For better accuracy, you'd want to use Black-Scholes with actual IV
        move_required = abs(strike - price) / price
        daily_move = 0.01  # Assume 1% daily move (simplified)
        prob = max(0, min(100, 50 - (move_required / (daily_move * np.sqrt(dte))) * 10))
        return round(prob, 1)
    
    def plot_strategy(self, index: int = 0):
        """Plot P&L diagram for a specific strategy"""
        if self.results.empty:
            print("No results to plot")
            return
            
        strategy = self.results.iloc[index].to_dict()
        
        # Create price range
        price = strategy['current_price']
        prices = np.linspace(price * 0.8, price * 1.2, 100)
        profits = []
        
        # Calculate P&L based on strategy type
        strat_type = strategy['strategy']
        
        if strat_type == 'Bull Call Spread':
            for p in prices:
                if p <= strategy['long_strike']:
                    profit = -strategy['debit']
                elif p >= strategy['short_strike']:
                    profit = strategy['max_profit']
                else:
                    profit = (p - strategy['long_strike']) - strategy['debit']
                profits.append(profit * 100)
                
        elif strat_type == 'Bear Put Spread':
            for p in prices:
                if p >= strategy['long_strike']:
                    profit = -strategy['debit']
                elif p <= strategy['short_strike']:
                    profit = strategy['max_profit']
                else:
                    profit = (strategy['long_strike'] - p) - strategy['debit']
                profits.append(profit * 100)
                
        elif strat_type == 'Cash-Secured Put':
            for p in prices:
                if p >= strategy['strike']:
                    profit = strategy['premium']
                else:
                    profit = strategy['premium'] - (strategy['strike'] - p)
                profits.append(profit * 100)
                
        elif strat_type == 'Iron Condor':
            for p in prices:
                if p <= strategy['put_long']:
                    profit = -strategy['max_loss']
                elif p >= strategy['call_long']:
                    profit = -strategy['max_loss']
                elif strategy['put_short'] <= p <= strategy['call_short']:
                    profit = strategy['credit']
                elif p < strategy['put_short']:
                    profit = strategy['credit'] - (strategy['put_short'] - p)
                else:
                    profit = strategy['credit'] - (p - strategy['call_short'])
                profits.append(profit * 100)
        
        # Create plot
        plt.figure(figsize=(12, 7))
        plt.plot(prices, profits, 'b-', linewidth=2)
        plt.axhline(y=0, color='k', alpha=0.3)
        plt.axvline(x=price, color='r', linestyle='--', label=f"Current: ${price:.2f}")
        
        if 'breakeven' in strategy:
            plt.axvline(x=strategy['breakeven'], color='g', linestyle=':', 
                       label=f"Breakeven: ${strategy['breakeven']:.2f}")
        
        plt.title(f"{strategy['ticker']} {strat_type} - Exp: {strategy['expiration']} - Return: {strategy['return']:.1f}%")
        plt.xlabel('Stock Price at Expiration')
        plt.ylabel('Profit/Loss ($)')
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.show()
    
    def create_dashboard(self, top_n: int = 6):
        """Create comprehensive dashboard of top strategies"""
        if self.results.empty:
            print("No results to display")
            return
            
        # Get top strategies
        top_strategies = self.results.head(top_n)
        
        # Create figure
        fig = plt.figure(figsize=(16, 10))
        
        # Summary statistics
        ax1 = plt.subplot(2, 3, 1)
        strategy_counts = self.results['strategy'].value_counts()
        ax1.bar(range(len(strategy_counts)), strategy_counts.values)
        ax1.set_xticks(range(len(strategy_counts)))
        ax1.set_xticklabels(strategy_counts.index, rotation=45, ha='right')
        ax1.set_title('Strategies Found')
        ax1.set_ylabel('Count')
        ax1.grid(True, alpha=0.3)
        
        # Return distribution
        ax2 = plt.subplot(2, 3, 2)
        ax2.hist(self.results['return'], bins=20, edgecolor='black')
        ax2.set_title('Return Distribution')
        ax2.set_xlabel('Return (%)')
        ax2.set_ylabel('Frequency')
        ax2.grid(True, alpha=0.3)
        
        # Top returns by ticker
        ax3 = plt.subplot(2, 3, 3)
        ticker_returns = self.results.groupby('ticker')['return'].max().sort_values(ascending=True)
        ax3.barh(range(len(ticker_returns)), ticker_returns.values)
        ax3.set_yticks(range(len(ticker_returns)))
        ax3.set_yticklabels(ticker_returns.index)
        ax3.set_title('Best Return by Ticker')
        ax3.set_xlabel('Max Return (%)')
        ax3.grid(True, alpha=0.3)
        
        # Top strategies table
        ax4 = plt.subplot(2, 3, 4)
        ax4.axis('tight')
        ax4.axis('off')
        
        # Prepare table data
        table_data = []
        for _, row in top_strategies.head(5).iterrows():
            table_data.append([
                row['ticker'],
                row['strategy'][:15],  # Truncate long names
                f"{row['return']:.1f}%",
                f"${row.get('breakeven', 'N/A')}"
            ])
        
        table = ax4.table(cellText=table_data,
                         colLabels=['Ticker', 'Strategy', 'Return', 'Breakeven'],
                         cellLoc='center',
                         loc='center')
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        ax4.set_title('Top 5 Opportunities', pad=20)
        
        # DTE distribution
        ax5 = plt.subplot(2, 3, 5)
        dte_groups = self.results.groupby('dte').size()
        ax5.bar(dte_groups.index, dte_groups.values)
        ax5.set_title('Opportunities by DTE')
        ax5.set_xlabel('Days to Expiration')
        ax5.set_ylabel('Count')
        ax5.grid(True, alpha=0.3)
        
        # Strategy returns comparison
        ax6 = plt.subplot(2, 3, 6)
        strategy_returns = self.results.groupby('strategy')['return'].mean().sort_values()
        ax6.barh(range(len(strategy_returns)), strategy_returns.values)
        ax6.set_yticks(range(len(strategy_returns)))
        ax6.set_yticklabels(strategy_returns.index)
        ax6.set_title('Average Return by Strategy')
        ax6.set_xlabel('Average Return (%)')
        ax6.grid(True, alpha=0.3)
        
        plt.suptitle('Options Strategy Scanner Dashboard', fontsize=16, y=1.02)
        plt.tight_layout()
        plt.show()
    
    def export_results(self, filename: str = 'options_scan_results.csv'):
        """Export results to CSV"""
        if not self.results.empty:
            self.results.to_csv(filename, index=False)
            print(f"✅ Results exported to {filename}")
        else:
            print("⚠️  No results to export")
    
    def filter_results(self, min_return: float = None, max_dte: int = None,
                      strategies: List[str] = None, tickers: List[str] = None) -> pd.DataFrame:
        """Filter results based on criteria"""
        filtered = self.results.copy()
        
        if min_return:
            filtered = filtered[filtered['return'] >= min_return]
        
        if max_dte:
            filtered = filtered[filtered['dte'] <= max_dte]
            
        if strategies:
            filtered = filtered[filtered['strategy'].isin(strategies)]
            
        if tickers:
            filtered = filtered[filtered['ticker'].isin(tickers)]
            
        return filtered
    def get_greek_exposure(self, ticker: str) -> Dict:
        """Get Greek exposure data for heat maps"""
        if not self.uw_key:
            return {}
            
        try:
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/greek-exposure/strike"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
        except Exception as e:
            print(f"Greek exposure error: {str(e)[:100]}")
            
        return []
    
    def get_greek_flow(self, ticker: str) -> List[Dict]:
        """Get Greek flow data for directional analysis"""
        if not self.uw_key:
            return []
            
        try:
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.uw_key}"
            }
            
            url = f"https://api.unusualwhales.com/api/stock/{ticker}/greek-flow"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
        except Exception as e:
            print(f"Greek flow error: {str(e)[:100]}")
            
        return []

def main():
    """Main execution function"""
    
    # ==========================================
    # CONFIGURATION - UPDATE THESE VALUES
    # ==========================================
    
    # Your API Keys
    POLYGON_API_KEY = "75rlu6cWGNnIqqR_x8M384YUjBgGk6kT"  # Replace with your key
    UNUSUAL_WHALES_KEY = "29a464c8-9da0-490a-ac24-0d4aa492dcbd"
    
    # Tickers to scan
    TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA", "META", "SPY", "QQQ"]
    
    # Scanning parameters
    DAYS_TO_EXPIRATION = 30  # Target expiration in days
    MIN_RETURN = 20  # Minimum return percentage
    
    # ==========================================
    # EXECUTION
    # ==========================================
    
    print("🚀 Starting Enhanced Options Scanner")
    print("="*60)
    
    # Initialize scanner
    scanner = OptionsScanner(POLYGON_API_KEY, UNUSUAL_WHALES_KEY)
    
    # Run scan
    results = scanner.scan_all_strategies(
        tickers=TICKERS,
        days=DAYS_TO_EXPIRATION,
        min_return=MIN_RETURN
    )
    
    if not results.empty:
        print("\n" + "="*60)
        print("📊 SCAN COMPLETE - TOP OPPORTUNITIES")
        print("="*60)
        
        # Display top 10 results
        display_cols = ['ticker', 'strategy', 'expiration', 'dte', 'return', 'breakeven']
        available_cols = [col for col in display_cols if col in results.columns]
        
        print("\nTop 10 Opportunities:")
        print(results[available_cols].head(10).to_string())
        
        # Create visualizations
        print("\n📈 Generating visualizations...")
        
        # Plot top strategy
        scanner.plot_strategy(0)
        
        # Create dashboard
        scanner.create_dashboard()
        
        # Export results
        scanner.export_results('scan_results.csv')
        
        # Additional analysis
        print("\n📊 SUMMARY STATISTICS")
        print("="*60)
        print(f"Total opportunities found: {len(results)}")
        print(f"Average return: {results['return'].mean():.1f}%")
        print(f"Best return: {results['return'].max():.1f}%")
        print(f"Strategies distribution:")
        print(results['strategy'].value_counts())
        
    else:
        print("\n⚠️  No opportunities found with current criteria")
        print("Try adjusting MIN_RETURN or expanding ticker list")


if __name__ == "__main__":
    main()
