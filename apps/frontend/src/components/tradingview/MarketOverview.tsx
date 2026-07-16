'use client';

import { useEffect, useRef, memo } from 'react';

function MarketOverview({ height = 460 }: { height?: number }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '12M',
      showChart: true,
      locale: 'en',
      isTransparent: true,
      showSymbolLogo: true,
      backgroundColor: 'rgba(11, 17, 32, 1)',
      plotLineColorGrowing: 'rgba(212, 175, 55, 1)',
      plotLineColorFalling: 'rgba(239, 68, 68, 1)',
      gridLineColor: 'rgba(255, 255, 255, 0.06)',
      width: '100%',
      height,
      tabs: [
        {
          title: 'Popular',
          symbols: [
            { s: 'BITSTAMP:BTCUSD', d: 'Bitcoin' },
            { s: 'BITSTAMP:ETHUSD', d: 'Ethereum' },
            { s: 'BINANCE:SOLUSDT', d: 'Solana' },
            { s: 'BINANCE:BNBUSDT', d: 'BNB' },
            { s: 'BINANCE:XRPUSDT', d: 'XRP' },
          ],
        },
        {
          title: 'Altcoins',
          symbols: [
            { s: 'BINANCE:ADAUSDT', d: 'Cardano' },
            { s: 'BINANCE:AVAXUSDT', d: 'Avalanche' },
            { s: 'BINANCE:DOTUSDT', d: 'Polkadot' },
            { s: 'BINANCE:LINKUSDT', d: 'Chainlink' },
            { s: 'BINANCE:MATICUSDT', d: 'Polygon' },
          ],
        },
        {
          title: 'DeFi',
          symbols: [
            { s: 'BINANCE:UNIUSDT', d: 'Uniswap' },
            { s: 'BINANCE:AAVEUSDT', d: 'Aave' },
            { s: 'BINANCE:MKRUSDT', d: 'Maker' },
            { s: 'BINANCE:SANDUSDT', d: 'Sandbox' },
            { s: 'BINANCE:GRTUSDT', d: 'Graph' },
          ],
        },
        {
          title: 'Layer 1',
          symbols: [
            { s: 'BINANCE:ATOMUSDT', d: 'Cosmos' },
            { s: 'BINANCE:NEARUSDT', d: 'NEAR' },
            { s: 'BINANCE:SUIUSDT', d: 'Sui' },
            { s: 'BINANCE:APTUSDT', d: 'Aptos' },
            { s: 'BINANCE:INJUSDT', d: 'Injective' },
          ],
        },
      ],
    });
    container.current.appendChild(script);
  }, [height]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

export default memo(MarketOverview);
