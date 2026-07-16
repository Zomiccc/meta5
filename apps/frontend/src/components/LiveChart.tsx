'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => {
        remove: () => void;
      };
    };
  }
}

interface LiveChartProps {
  price: number;
  symbol: string;
  height?: number;
}

const EXCHANGE_TO_TRADINGVIEW: Record<string, string> = {
  BINANCE: 'BINANCE',
  BITSTAMP: 'BITSTAMP',
  FX: 'FX',
  NASDAQ: 'NASDAQ',
  NYSE: 'NYSE',
  OANDA: 'OANDA',
  TVC: 'TVC',
  FOREXCOM: 'FOREXCOM',
  INDEX: 'CAPITALCOM',
};

function toTradingViewSymbol(symbol: string): string {
  // Already in TradingView format like BINANCE:BTCUSDT, BITSTAMP:BTCUSD
  if (symbol.includes(':')) return symbol;
  return symbol;
}

export default function LiveChart({ symbol, height = 520 }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ remove: () => void } | null>(null);
  const id = `tv-chart-${symbol.replace(/[^a-zA-Z0-9]/g, '-')}`;

  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window === 'undefined') return;

    const safeRemove = (w: { remove: () => void } | null) => {
      if (!w) return;
      try { w.remove(); } catch { /* widget may already be detached */ }
    };

    const initWidget = () => {
      if (!window.TradingView || !containerRef.current) return;
      safeRemove(widgetRef.current);
      widgetRef.current = null;
      containerRef.current.innerHTML = '';
      widgetRef.current = new window.TradingView.widget({
        container_id: id,
        symbol: toTradingViewSymbol(symbol),
        interval: '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#0B1120',
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
        withdateranges: true,
        details: false,
        hotlist: false,
        calendar: false,
        studies: [],
        autosize: true,
        height,
      });
    };

    const existingScript = document.getElementById('tradingview-widget-script') as HTMLScriptElement | null;
    if (existingScript && existingScript.dataset.loaded === 'true') {
      initWidget();
    } else if (existingScript) {
      existingScript.addEventListener('load', initWidget);
    } else {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.dataset.loaded = 'false';
      script.onload = () => {
        script.dataset.loaded = 'true';
        initWidget();
      };
      document.body.appendChild(script);
    }

    return () => {
      safeRemove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [symbol, id, height]);

  return <div ref={containerRef} id={id} className="h-full w-full" />;
}
