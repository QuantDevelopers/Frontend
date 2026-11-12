import { useEffect, useRef, useState } from 'react';
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  TickMarkType,
  createChart,
} from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';
import type { Candle } from '../utils/candles';
import { formatCompact, formatJalali, formatPrice, toPersianDigits } from '../utils/formatters';

const UP = '#10b981';
const DOWN = '#f43f5e';

const jalaliPart = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { ...opts, timeZone: 'UTC' });
const jYear = jalaliPart({ year: 'numeric' });
const jMonth = jalaliPart({ month: 'short' });
const jDay = jalaliPart({ day: 'numeric' });

/** lightweight-charts Time (string | BusinessDay | UTC seconds) -> Date (UTC). */
function timeToDate(time: Time): Date {
  if (typeof time === 'number') return new Date(time * 1000);
  if (typeof time === 'string') return new Date(`${time}T00:00:00Z`);
  return new Date(Date.UTC(time.year, time.month - 1, time.day));
}

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (d: Date, seconds = false) =>
  toPersianDigits(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}${seconds ? `:${pad(d.getUTCSeconds())}` : ''}`);

interface PriceChartProps {
  candles: Candle[];
  /** Intraday charts use wall-clock epoch seconds and show times instead of Jalali days. */
  intraday?: boolean;
  mode?: 'candles' | 'line';
  height?: number;
}

interface Legend {
  time: string;
  candle: Candle;
}

export function PriceChart({ candles, intraday = false, mode = 'candles', height = 360 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [legend, setLegend] = useState<Legend | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const formatTime = (t: Time) => {
      const d = timeToDate(t);
      return intraday ? clock(d, true) : formatJalali(d.toISOString().slice(0, 10));
    };

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#64748b',
        fontFamily: 'IRANYekan, Vazirmatn, sans-serif',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#e2e8f0' },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: intraday,
        secondsVisible: false,
        tickMarkFormatter: (time: Time, type: TickMarkType) => {
          const d = timeToDate(time);
          if (intraday) return clock(d);
          if (type === TickMarkType.Year) return jYear.format(d);
          if (type === TickMarkType.Month) return jMonth.format(d);
          return jDay.format(d);
        },
      },
      localization: {
        locale: 'fa-IR',
        priceFormatter: (p: number) => formatPrice(p),
        timeFormatter: formatTime,
      },
    });
    chartRef.current = chart;

    const data = candles.map((c) => ({ ...c, time: c.time as Time }));
    const priceSeries =
      mode === 'line'
        ? chart.addSeries(LineSeries, { color: '#4f46e5', lineWidth: 2 })
        : chart.addSeries(CandlestickSeries, {
            upColor: UP,
            downColor: DOWN,
            borderVisible: false,
            wickUpColor: UP,
            wickDownColor: DOWN,
          });
    priceSeries.setData(
      mode === 'line' ? data.map((c) => ({ time: c.time, value: c.close })) : data
    );
    priceSeries.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.26 } });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'custom', formatter: (v: number) => formatCompact(v) },
      priceScaleId: 'volume',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData(
      data.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)',
      }))
    );

    chart.timeScale().fitContent();

    const byTime = new Map(candles.map((c) => [String(c.time), c]));
    const latest = candles[candles.length - 1];
    setLegend(latest ? { time: formatTime(latest.time as Time), candle: latest } : null);

    chart.subscribeCrosshairMove((param) => {
      const c = param.time !== undefined ? byTime.get(String(param.time)) : undefined;
      const fallback = candles[candles.length - 1];
      const target = c ?? fallback;
      setLegend(target ? { time: formatTime(target.time as Time), candle: target } : null);
    });

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, intraday, mode]);

  const c = legend?.candle;
  const up = c ? c.close >= c.open : true;

  return (
    <div className="relative">
      {c && (
        <div className="num pointer-events-none absolute right-2 top-1 z-10 flex flex-wrap gap-x-3 bg-white/80 px-1 text-[11px] text-slate-500">
          <span className="text-slate-700">{legend?.time}</span>
          <span>باز <b className="text-slate-800">{formatPrice(c.open)}</b></span>
          <span>بیشترین <b className="text-slate-800">{formatPrice(c.high)}</b></span>
          <span>کمترین <b className="text-slate-800">{formatPrice(c.low)}</b></span>
          <span>
            پایانی <b className={up ? 'text-emerald-600' : 'text-rose-600'}>{formatPrice(c.close)}</b>
          </span>
          <span>حجم <b className="text-slate-800">{formatCompact(c.volume)}</b></span>
        </div>
      )}
      <div ref={containerRef} dir="ltr" style={{ height }} className="w-full" />
    </div>
  );
}
