'use client';

import { useEffect, useRef, memo } from 'react';

interface MiniChartProps {
  symbol?: string;
  height?: number;
}

function MiniChart({ symbol = 'BINANCE:BTCUSDT', height = 220 }: MiniChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height,
      locale: 'en',
      dateRange: '12M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
      chartOnly: false,
      noTimeScale: false,
    });
    container.current.appendChild(script);
  }, [symbol, height]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height }}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

export default memo(MiniChart);
