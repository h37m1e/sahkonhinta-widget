// src/Next12hChart.jsx
import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function toTs(p) {
  const t =
    p?.DateTime ?? p?.dateTime ??
    p?.StartTime ?? p?.startTime ??
    p?.Time ?? p?.time ??
    null;
  if (!t) return NaN;
  return new Date(t).getTime();
}

function toPrice(p) {
  const v = p?.PriceWithTax ?? p?.priceWithTax ?? p?.Price ?? p?.price;
  return typeof v === "number" ? v : Number(v);
}

function labelHour(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  return `${h}:00`;
}

function hourBucket(ts) {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

/**
 * Custom tooltip: teksti aina valkoinen/vaalea
 */
function PriceTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0]?.value;
  const accent = cssVar("--accent", "#7c3aed");

  return (
    <div
      style={{
        background: "rgba(15, 15, 20, 0.92)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 12,
        padding: "8px 10px",
        color: "#ffffff",
        boxShadow: "0 8px 24px rgba(0,0,0,0.40)",
        fontSize: 13,
        minWidth: 120,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4, color: "#ffffff" }}>
        {label}
      </div>

      <div style={{ color: "#ffffff" }}>
        <span style={{ fontWeight: 800, color: "#ffffff" }}>
          {typeof value === "number" ? value.toFixed(3) : value}
        </span>
        <span style={{ opacity: 0.85, marginLeft: 6, color: "#ffffff" }}>
          snt/kWh
        </span>
      </div>

      <div style={{ marginTop: 6, height: 2, borderRadius: 999, background: accent, opacity: 0.8 }} />
    </div>
  );
}

export function Next12hChart({ combinedList }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(combinedList) || !combinedList.length) return [];

    const now = Date.now();

    // 1) tulevat datapisteet ja parsi aikaleima
    const upcoming = combinedList
      .map((p) => ({ p, ts: toTs(p), price: toPrice(p) }))
      .filter((x) => Number.isFinite(x.ts) && Number.isFinite(x.price))
      .filter((x) => x.ts >= now - 5 * 60 * 1000) // pieni jousto
      .sort((a, b) => a.ts - b.ts);

    if (!upcoming.length) return [];

    // 2) tuntikooste (avg per hour) seuraavalle 12 tunnille
    const byHour = new Map();
    for (const x of upcoming) {
      const hb = hourBucket(x.ts);
      if (!byHour.has(hb)) byHour.set(hb, []);
      byHour.get(hb).push(x.price);
    }

    const hoursSorted = Array.from(byHour.keys()).sort((a, b) => a - b).slice(0, 12);
    const series = hoursSorted.map((hb) => {
      const arr = byHour.get(hb);
      const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
      return { ts: hb, time: labelHour(hb), price: avg };
    });

    // 3) Väritä suhteessa seuraavan 12h jakaumaan: halvin 1/3 = good, kallein 1/3 = bad
    const pricesSorted = series.map((s) => s.price).slice().sort((a, b) => a - b);
    const t1 = pricesSorted[Math.floor(pricesSorted.length / 3)] ?? pricesSorted[0];
    const t2 = pricesSorted[Math.floor((2 * pricesSorted.length) / 3)] ?? pricesSorted[pricesSorted.length - 1];

    return series.map((s) => ({
      time: s.time,
      // pyöristys tooltipissa, mutta chartissa pidetään numeerinen arvo
      price: Number(s.price.toFixed(4)),
      cls: s.price <= t1 ? "good" : s.price >= t2 ? "bad" : "mid",
    }));
  }, [combinedList]);

  if (!chartData.length) return null;

  const colorGood = cssVar("--good", "#22c55e");
  const colorMid = cssVar("--mid", "#f59e0b");
  const colorBad = cssVar("--bad", "#ef4444");
  const tickColor = cssVar("--muted", "rgba(234,240,255,0.72)");

  return (
    <div className="card" style={{ width: "min(520px, 100%)", marginTop: 14 }}>
      <div className="title" style={{ marginBottom: 10 }}>
        Seuraavat 12 tuntia
      </div>

      <div className="chartWrap">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: tickColor, fontSize: 11 }} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} />

            {/* ✅ Custom tooltip: teksti aina valkoinen */}
            <Tooltip content={<PriceTooltip />} />

            <Bar dataKey="price" radius={[8, 8, 0, 0]}>
              {chartData.map((e, idx) => {
                const fill = e.cls === "good" ? colorGood : e.cls === "bad" ? colorBad : colorMid;
                return <Cell key={idx} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="small" style={{ marginTop: 8 }}>
      </div>
    </div>
  );
}
