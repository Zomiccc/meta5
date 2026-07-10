'use client';

import { useEffect, useRef, memo } from 'react';

interface AdvancedChartProps {
  symbol?: string;
  interval?: string;
  height?: number | string;
  allowSymbolChange?: boolean;
}

function AdvancedChart({
  symbol = 'FX:EURUSD',
  interval = 'D',
  height = 540,
  allowSymbolChange = true,
}: AdvancedChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      backgroundColor: 'rgba(11, 17, 32, 1)',
      gridColor: 'rgba(255, 255, 255, 0.06)',
      hide_top_toolbar: false,
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    container.current.appendChild(script);
  }, [symbol, interval, allowSymbolChange]);

  return (
    <div
      className="tradingview-widget-container overflow-hidden rounded-2xl border border-navy-700/50"
      ref={container}
      style={{ height, width: '100%' }}
    >
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export default memo(AdvancedChart);
