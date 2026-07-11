'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
  AreaSeries,
} from 'lightweight-charts';

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

  // Reset chart when symbol changes
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData([]);
      lastTimeRef.current = Math.floor(Date.now() / 1000);
    }
  }, [symbol]);

  // Update price
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
