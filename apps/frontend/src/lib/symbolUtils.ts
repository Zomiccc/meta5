// Convert internal symbol to display name
export function getDisplaySymbol(symbol: string): string {
  return symbol
    .replace('FX:', '')
    .replace('BINANCE:', '')
    .replace('BITSTAMP:', '')
    .replace('NASDAQ:', '')
    .replace('NYSE:', '')
    .replace('OANDA:', '')
    .replace('TVC:', '')
    .replace('SP:', '')
    .replace('DJ:', '')
    .replace('FOREXCOM:', '')
    .replace('INDEX:', '')
    .replace('CRYPTO:', '')
    .replace('USDT', '/USD')
    .replace('USDC', '/USD');
}

// Convert internal symbol to friendly full name
export function getSymbolName(symbol: string): string {
  const names: Record<string, string> = {
    'EUR/USD': 'Euro / US Dollar',
    'GBP/USD': 'British Pound / US Dollar',
    'USD/JPY': 'US Dollar / Japanese Yen',
    'USD/CHF': 'US Dollar / Swiss Franc',
    'AUD/USD': 'Australian Dollar / US Dollar',
    'USD/CAD': 'US Dollar / Canadian Dollar',
    'NZD/USD': 'New Zealand Dollar / US Dollar',
    'EUR/GBP': 'Euro / British Pound',
    'EUR/JPY': 'Euro / Japanese Yen',
    'GBP/JPY': 'British Pound / Japanese Yen',
    'BTC/USD': 'Bitcoin',
    'ETH/USD': 'Ethereum',
    'BNB/USD': 'BNB',
    'XRP/USD': 'XRP',
    'SOL/USD': 'Solana',
    'ADA/USD': 'Cardano',
    'DOGE/USD': 'Dogecoin',
    'AVAX/USD': 'Avalanche',
    'DOT/USD': 'Polkadot',
    'MATIC/USD': 'Polygon',
    'LINK/USD': 'Chainlink',
    'LTC/USD': 'Litecoin',
    'TRX/USD': 'TRON',
    'BCH/USD': 'Bitcoin Cash',
    'ATOM/USD': 'Cosmos',
    'UNI/USD': 'Uniswap',
    'XLM/USD': 'Stellar',
    'ETC/USD': 'Ethereum Classic',
    'FIL/USD': 'Filecoin',
    'APT/USD': 'Aptos',
    'ARB/USD': 'Arbitrum',
    'OP/USD': 'Optimism',
    'NEAR/USD': 'NEAR Protocol',
    'INJ/USD': 'Injective',
    'SUI/USD': 'Sui',
    'AAVE/USD': 'Aave',
    'MKR/USD': 'Maker',
    'SAND/USD': 'The Sandbox',
    'AXS/USD': 'Axie Infinity',
    'GRT/USD': 'The Graph',
    'AAPL': 'Apple Inc',
    'GOOGL': 'Alphabet (Google)',
    'MSFT': 'Microsoft',
    'TSLA': 'Tesla',
    'AMZN': 'Amazon',
    'META': 'Meta Platforms',
    'NVDA': 'Nvidia',
    'SPXUSD': 'S&P 500',
    'NSXUSD': 'Nasdaq 100',
    'DJI': 'Dow Jones 30',
    'DEU40': 'DAX 40',
    'UK100GBP': 'FTSE 100',
  };

  const clean = getDisplaySymbol(symbol);
  return names[clean] || clean;
}

// Get the number of decimal places to display for a symbol (matching TradingView)
export function getDecimalsForSymbol(symbol: string): number {
  // Forex pairs: 5 decimal places (JPY pairs use 3)
  if (symbol.startsWith('FX:')) {
    if (symbol.includes('JPY')) return 3;
    return 5;
  }
  // Crypto: 2 for most, 4 for sub-dollar coins
  if (symbol.startsWith('BINANCE:') || symbol.startsWith('BITSTAMP:')) {
    const clean = getDisplaySymbol(symbol);
    if (['XRP/USD', 'DOGE/USD', 'ADA/USD', 'TRX/USD', 'XLM/USD', 'GRT/USD', 'SAND/USD', 'MATIC/USD'].includes(clean)) return 4;
    return 2;
  }
  // Stocks, indices: 2
  return 2;
}

// Format a price with the correct number of decimals for the symbol
export function formatPriceForSymbol(symbol: string, price: number): string {
  const decimals = getDecimalsForSymbol(symbol);
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
