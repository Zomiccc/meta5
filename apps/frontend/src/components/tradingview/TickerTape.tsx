'use client';

import { useEffect, useRef, memo } from 'react';

function TickerTape() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
        { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
        { proName: 'BINANCE:SOLUSDT', title: 'Solana' },
        { proName: 'BINANCE:BNBUSDT', title: 'BNB' },
        { proName: 'BINANCE:XRPUSDT', title: 'XRP' },
        { proName: 'BINANCE:ADAUSDT', title: 'Cardano' },
        { proName: 'BINANCE:AVAXUSDT', title: 'Avalanche' },
        { proName: 'BINANCE:DOTUSDT', title: 'Polkadot' },
        { proName: 'BINANCE:LINKUSDT', title: 'Chainlink' },
        { proName: 'BINANCE:DOGEUSDT', title: 'Dogecoin' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

export default memo(TickerTape);
