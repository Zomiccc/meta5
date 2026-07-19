'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LiveChartProps {
  price: number;
  symbol: string;
  height?: number;
}

const INTERVALS = [
  { label: '1m', value: '1min', seconds: 60 },
  { label: '5m', value: '5min', seconds: 300 },
  { label: '15m', value: '15min', seconds: 900 },
  { label: '30m', value: '30min', seconds: 1800 },
  { label: '1h', value: '1h', seconds: 3600 },
];

export default function LiveChart({ symbol, price, height = 400 }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const lastCandleRef = useRef<Candle | null>(null);
  const priceRef = useRef<number>(price);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interval, setIntervalVal] = useState('15min');

  const intervalMeta = INTERVALS.find((i) => i.value === interval) || INTERVALS[2];

  // Update priceRef whenever price changes
  useEffect(() => {
    priceRef.current = price;
    // Real-time update: modify the last candle
    if (seriesRef.current && lastCandleRef.current && price > 0) {
      const last = { ...lastCandleRef.current };
      last.close = price;
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      lastCandleRef.current = last;
      try {
        seriesRef.current.update({
          time: last.time as any,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        });
      } catch { /* may fail if time is in past */ }
    }
  }, [price]);

  // Load historical candles and create chart
  const loadChart = useCallback(async () => {
    if (!containerRef.current) return;
    setLoading(true);
    setError('');

    try {
      // Fetch OHLC from backend (Twelve Data)
      const res = await api.get(`/mt5/history`, {
        params: { symbol, days: 1, interval },
      });
      const candles: Candle[] = res.data?.data || [];

      if (candles.length === 0) {
        setError('No chart data available for this symbol');
        setLoading(false);
        return;
      }

      // Dynamically import lightweight-charts (avoids SSR issues)
      const { createChart, CandlestickSeries, ColorType, CrosshairMode } = await import('lightweight-charts');

      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: '#0B1120' },
          textColor: '#8B949E',
          fontFamily: 'Inter, sans-serif',
        },
        grid: {
          vertLines: { color: 'rgba(42, 48, 66, 0.3)' },
          horzLines: { color: 'rgba(42, 48, 66, 0.3)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#F0B90B', width: 1, style: 3, labelBackgroundColor: '#F0B90B' },
          horzLine: { color: '#F0B90B', width: 1, style: 3, labelBackgroundColor: '#F0B90B' },
        },
        rightPriceScale: {
          borderColor: 'rgba(42, 48, 66, 0.5)',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: 'rgba(42, 48, 66, 0.5)',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#0ECB81',
        downColor: '#F6465D',
        borderUpColor: '#0ECB81',
        borderDownColor: '#F6465D',
        wickUpColor: '#0ECB81',
        wickDownColor: '#F6465D',
      });

      seriesRef.current = series;

      // Set initial data
      const candleData = candles.map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      series.setData(candleData);

      // Store last candle for real-time updates
      lastCandleRef.current = candles[candles.length - 1];

      // If we have a live price, update the last candle immediately
      if (priceRef.current > 0 && lastCandleRef.current) {
        const last = { ...lastCandleRef.current };
        last.close = priceRef.current;
        last.high = Math.max(last.high, priceRef.current);
        last.low = Math.min(last.low, priceRef.current);
        lastCandleRef.current = last;
        series.update({
          time: last.time as any,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        });
      }

      chart.timeScale().fitContent();

      // Resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        if (chartRef.current && entries[0]) {
          chartRef.current.applyOptions({
            width: entries[0].contentRect.width,
            height: entries[0].contentRect.height,
          });
        }
      });
      resizeObserver.observe(containerRef.current);

      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load chart data');
      setLoading(false);
    }
  }, [symbol, interval]);

  useEffect(() => {
    loadChart();

    return () => {
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [loadChart]);

  // Periodically create new candles when interval boundary passes
  useEffect(() => {
    const tick = setInterval(() => {
      if (!seriesRef.current || !lastCandleRef.current) return;
      const now = Math.floor(Date.now() / 1000);
      const intervalSec = intervalMeta.seconds;
      const currentBucket = Math.floor(now / intervalSec) * intervalSec;
      const last = lastCandleRef.current;

      if (currentBucket > last.time) {
        // Start a new candle
        const newCandle: Candle = {
          time: currentBucket,
          open: priceRef.current || last.close,
          high: priceRef.current || last.close,
          low: priceRef.current || last.close,
          close: priceRef.current || last.close,
        };
        lastCandleRef.current = newCandle;
        try {
          seriesRef.current.update({
            time: newCandle.time as any,
            open: newCandle.open,
            high: newCandle.high,
            low: newCandle.low,
            close: newCandle.close,
          });
        } catch {}
      }
    }, 2000);

    return () => clearInterval(tick);
  }, [intervalMeta.seconds]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Interval selector */}
      <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-bn bg-bn-bg/80 p-1 backdrop-blur">
        {INTERVALS.map((iv) => (
          <button
            key={iv.value}
            onClick={() => setIntervalVal(iv.value)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
              interval === iv.value ? 'bg-yellow text-black' : 'text-bnText-secondary hover:text-bnText-primary'
            }`}
          >
            {iv.label}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ minHeight: height }} />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bn-bg/50">
          <Loader2 className="h-6 w-6 animate-spin text-yellow" />
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-bnText-muted">{error}</p>
        </div>
      )}
    </div>
  );
}
