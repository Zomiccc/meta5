'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
  AreaSeries,
} from 'lightweight-charts';
import { api } from '../lib/api';

interface HistoryPoint {
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

export default function LiveChart({ price, symbol, height = 520 }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const lastTimeRef = useRef<number>(Math.floor(Date.now() / 1000));
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'rgba(11, 17, 32, 1)' },
        textColor: 'rgba(255,255,255,0.6)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: true,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#22c55e',
      topColor: 'rgba(34, 197, 94, 0.3)',
      bottomColor: 'rgba(34, 197, 94, 0.01)',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => chart.applyOptions({ width: containerRef.current?.clientWidth, height });
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Load history when symbol changes
  useEffect(() => {
    setHistory([]);
    if (seriesRef.current) seriesRef.current.setData([]);
    lastTimeRef.current = Math.floor(Date.now() / 1000);
    api.get(`/mt5/history?symbol=${encodeURIComponent(symbol)}`)
      .then((res) => {
        if (Array.isArray(res.data?.data)) {
          setHistory(res.data.data);
        }
      })
      .catch(() => setHistory([]));
  }, [symbol]);

  // Populate history into chart
  useEffect(() => {
    if (!seriesRef.current) return;
    if (history.length === 0) return;
    const lineData: LineData[] = history.map((h) => ({ time: h.time as UTCTimestamp, value: h.close }));
    seriesRef.current.setData(lineData);
    lastTimeRef.current = history[history.length - 1].time;
  }, [history]);

  // Update live price
  useEffect(() => {
    if (!seriesRef.current || !price) return;

    const now = Math.floor(Date.now() / 1000);
    if (now <= lastTimeRef.current) {
      lastTimeRef.current += 1;
    } else {
      lastTimeRef.current = now;
    }

    const data: LineData = {
      time: lastTimeRef.current as UTCTimestamp,
      value: price,
    };

    seriesRef.current.update(data);
  }, [price]);

  return <div ref={containerRef} className="h-full w-full" />;
}
