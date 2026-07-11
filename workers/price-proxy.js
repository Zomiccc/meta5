// Cloudflare Worker proxy for live prices
// Deploy via Wrangler or Cloudflare Dashboard
// Required env: BACKEND_SECRET (optional, to verify requests)
// Optional env: TWELVE_DATA_API_KEY
//
// Endpoint: POST https://<worker>.<subdomain>.workers.dev/prices
// Body: { "symbols": ["FX:EURUSD", "BINANCE:BTCUSDT", ...] }

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const BINANCE_SYMBOL_MAP = {
  'BINANCE:BTCUSDT': 'BTCUSDT',
  'BINANCE:ETHUSDT': 'ETHUSDT',
  'BINANCE:SOLUSDT': 'SOLUSDT',
  'BINANCE:XRPUSDT': 'XRPUSDT',
  'BINANCE:BNBUSDT': 'BNBUSDT',
  'BINANCE:DOGEUSDT': 'DOGEUSDT',
  'BINANCE:ADAUSDT': 'ADAUSDT',
  'BINANCE:AVAXUSDT': 'AVAXUSDT',
  'BINANCE:DOTUSDT': 'DOTUSDT',
  'BINANCE:MATICUSDT': 'MATICUSDT',
  'BINANCE:LINKUSDT': 'LINKUSDT',
  'BINANCE:LTCUSDT': 'LTCUSDT',
  'BINANCE:UNIUSDT': 'UNIUSDT',
  'BINANCE:ATOMUSDT': 'ATOMUSDT',
  'BINANCE:ETCUSDT': 'ETCUSDT',
  'BINANCE:FILUSDT': 'FILUSDT',
  'BINANCE:ALGOUSDT': 'ALGOUSDT',
  'BINANCE:NEARUSDT': 'NEARUSDT',
  'BINANCE:ARBUSDT': 'ARBUSDT',
  'BINANCE:OPUSDT': 'OPUSDT',
  'BINANCE:APTUSDT': 'APTUSDT',
  'BINANCE:STXUSDT': 'STXUSDT',
  'BINANCE:IMXUSDT': 'IMXUSDT',
  'BINANCE:INJUSDT': 'INJUSDT',
  'BINANCE:RENDERUSDT': 'RENDERUSDT',
  'BINANCE:TONUSDT': 'TONUSDT',
  'BINANCE:SUIUSDT': 'SUIUSDT',
  'BINANCE:PEPEUSDT': 'PEPEUSDT',
  'BINANCE:SHIBUSDT': 'SHIBUSDT',
  'BINANCE:TRXUSDT': 'TRXUSDT',
  'BINANCE:AAVEUSDT': 'AAVEUSDT',
  'BINANCE:MKRUSDT': 'MKRUSDT',
  'BINANCE:COMPUSDT': 'COMPUSDT',
  'BINANCE:YFIUSDT': 'YFIUSDT',
  'BINANCE:CRVUSDT': 'CRVUSDT',
  'BINANCE:SUSHIUSDT': 'SUSHIUSDT',
  'BINANCE:ZRXUSDT': 'ZRXUSDT',
  'BINANCE:1INCHUSDT': '1INCHUSDT',
  'BINANCE:BATUSDT': 'BATUSDT',
  'BINANCE:ENJUSDT': 'ENJUSDT',
  'BINANCE:MANAUSDT': 'MANAUSDT',
  'BINANCE:SANDUSDT': 'SANDUSDT',
  'BINANCE:AXSUSDT': 'AXSUSDT',
  'BINANCE:GRTUSDT': 'GRTUSDT',
  'BINANCE:FLOWUSDT': 'FLOWUSDT',
  'BINANCE:CHZUSDT': 'CHZUSDT',
  'BINANCE:EOSUSDT': 'EOSUSDT',
  'BINANCE:XTZUSDT': 'XTZUSDT',
  'BINANCE:NEOUSDT': 'NEOUSDT',
  'BINANCE:ICPUSDT': 'ICPUSDT',
  'BINANCE:THETAUSDT': 'THETAUSDT',
  'BINANCE:EGLDUSDT': 'EGLDUSDT',
  'BINANCE:XLMUSDT': 'XLMUSDT',
};

const TWELVE_DATA_SYMBOL_MAP = {
  'FX:EURUSD': 'EUR/USD',
  'FX:GBPUSD': 'GBP/USD',
  'FX:USDJPY': 'USD/JPY',
  'FX:AUDUSD': 'AUD/USD',
  'FX:USDCAD': 'USD/CAD',
  'FX:USDCHF': 'USD/CHF',
  'FX:NZDUSD': 'NZD/USD',
  'FX:EURGBP': 'EUR/GBP',
  'FX:EURJPY': 'EUR/JPY',
  'FX:GBPJPY': 'GBP/JPY',
  'FX:AUDJPY': 'AUD/JPY',
  'FX:CHFJPY': 'CHF/JPY',
  'FX:EURCHF': 'EUR/CHF',
  'FX:EURAUD': 'EUR/AUD',
  'FX:EURCAD': 'EUR/CAD',
  'FX:GBPAUD': 'GBP/AUD',
  'FX:GBPCAD': 'GBP/CAD',
  'FX:GBPCHF': 'GBP/CHF',
  'FX:AUDCAD': 'AUD/CAD',
  'FX:AUDNZD': 'AUD/NZD',
  'FX:AUDCHF': 'AUD/CHF',
  'FX:CADJPY': 'CAD/JPY',
  'FX:NZDJPY': 'NZD/JPY',
  'FX:CADCHF': 'CAD/CHF',
  'FX:NZDCAD': 'NZD/CAD',
  'FX:EURNZD': 'EUR/NZD',
  'FX:USDMXN': 'USD/MXN',
  'FX:USDZAR': 'USD/ZAR',
  'FX:USDSGD': 'USD/SGD',
  'FX:USDTRY': 'USD/TRY',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

async function fetchBinancePrices() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price', {
      cf: { cacheTtl: 2 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    for (const item of data) {
      map[item.symbol] = Number(item.price);
    }
    return map;
  } catch (e) {
    console.error('Binance fetch failed', e.message);
    return {};
  }
}

async function fetchTwelveDataQuotes(symbols, apiKey) {
  if (!apiKey || symbols.length === 0) return {};
  try {
    const tdSymbols = symbols.map((s) => TWELVE_DATA_SYMBOL_MAP[s]).join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSymbols)}&apikey=${apiKey}`;
    const res = await fetch(url, { cf: { cacheTtl: 5 } });
    if (!res.ok) return {};
    const data = await res.json();
    const result = {};
    const quotes = Array.isArray(data) ? data : [data];
    for (const q of quotes) {
      if (!q || !q.symbol) continue;
      const internal = Object.keys(TWELVE_DATA_SYMBOL_MAP).find((k) => TWELVE_DATA_SYMBOL_MAP[k] === q.symbol);
      if (internal && q.close) {
        result[internal] = Number(q.close);
      }
    }
    return result;
  } catch (e) {
    console.error('Twelve Data fetch failed', e.message);
    return {};
  }
}

async function fetchCoinbaseFxRates() {
  try {
    const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {
      cf: { cacheTtl: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.rates || null;
  } catch (e) {
    console.error('Coinbase FX fetch failed', e.message);
    return null;
  }
}

function computeCoinbaseFxPrice(symbol, rates) {
  const match = symbol.match(/^FX:([A-Z]{3})([A-Z]{3})$/);
  if (!match || !rates) return null;
  const [, base, quote] = match;
  if (!rates[base] || !rates[quote]) return null;
  return Number((rates[quote] / rates[base]).toFixed(5));
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname !== '/prices') {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const symbols = body.symbols || [];
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return jsonResponse({ error: 'symbols array required' }, 400);
    }

    const binancePrices = await fetchBinancePrices();
    const fxSymbols = symbols.filter((s) => s.startsWith('FX:') && TWELVE_DATA_SYMBOL_MAP[s]);
    const twelveDataPrices = await fetchTwelveDataQuotes(fxSymbols, env.TWELVE_DATA_API_KEY);
    const coinbaseRates = Object.keys(twelveDataPrices).length < fxSymbols.length
      ? await fetchCoinbaseFxRates()
      : null;

    const result = {};
    for (const symbol of symbols) {
      let price = null;
      let source = 'none';

      if (BINANCE_SYMBOL_MAP[symbol]) {
        const p = binancePrices[BINANCE_SYMBOL_MAP[symbol]];
        if (p) {
          price = p;
          source = 'binance';
        }
      } else if (symbol.startsWith('FX:')) {
        if (twelveDataPrices[symbol]) {
          price = twelveDataPrices[symbol];
          source = 'twelvedata';
        } else if (coinbaseRates) {
          const p = computeCoinbaseFxPrice(symbol, coinbaseRates);
          if (p) {
            price = p;
            source = 'coinbase-fx';
          }
        }
      }

      if (price !== null && price > 0) {
        result[symbol] = { price, source };
      }
    }

    return jsonResponse({ prices: result, count: Object.keys(result).length });
  },
};
