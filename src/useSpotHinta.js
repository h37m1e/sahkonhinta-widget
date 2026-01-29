// src/useSpotHinta.js
import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://api.spot-hinta.fi";

/**
 * Spot-hinta API palauttaa tyypillisesti:
 * { Rank, DateTime, PriceNoTax, PriceWithTax } [1](https://api.spot-hinta.fi/DayForward)
 * Joissain endpointseissa voi olla eri wrapper, siksi normalize.
 */

function toTs(p) {
  // tärkein: DateTime
  const t =
    p?.DateTime ?? p?.dateTime ??
    p?.StartTime ?? p?.startTime ??
    p?.Time ?? p?.time ??
    null;
  if (!t) return NaN;
  const d = new Date(t);
  return d.getTime();
}

function toPrice(p) {
  const v = p?.PriceWithTax ?? p?.priceWithTax ?? p?.Price ?? p?.price;
  return typeof v === "number" ? v : Number(v);
}

function toRank(p) {
  const r = p?.Rank ?? p?.rank;
  return r == null ? null : Number(r);
}

function normalizeResponse(json) {
  // Mahdolliset muodot:
  // 1) array suoraan
  // 2) { Today: [...], DayForward: [...] }
  // 3) { Prices: [...] } tms
  if (Array.isArray(json)) return { today: json, tomorrow: [] };

  const todayCandidate = json?.Today ?? json?.today ?? json?.Prices ?? json?.prices ?? [];
  const tomorrowCandidate = json?.DayForward ?? json?.dayForward ?? [];

  const today = Array.isArray(todayCandidate) ? todayCandidate : (todayCandidate?.Prices ?? todayCandidate?.prices ?? []);
  const tomorrow = Array.isArray(tomorrowCandidate) ? tomorrowCandidate : (tomorrowCandidate?.Prices ?? tomorrowCandidate?.prices ?? []);

  return { today, tomorrow };
}

function computeIntervalMs(points) {
  // Päätellään onko 15min vai 60min:
  // otetaan 2 pienintä timestampia ja katsotaan ero
  const ts = points.map(toTs).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (ts.length < 2) return 60 * 60 * 1000;
  const diff = ts[1] - ts[0];
  // 15 min ~ 900000 ms
  if (diff > 10 * 60 * 1000 && diff < 20 * 60 * 1000) return 15 * 60 * 1000;
  return 60 * 60 * 1000;
}

function pickCurrent(points, intervalMs) {
  const now = Date.now();
  // etsitään slot, jonka start <= now < start+interval
  // (sallitaan pieni jousto)
  const sorted = points
    .map((p) => ({ p, ts: toTs(p) }))
    .filter((x) => Number.isFinite(x.ts))
    .sort((a, b) => a.ts - b.ts);

  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i].ts;
    const end = start + intervalMs;
    if (now >= start && now < end) return sorted[i].p;
  }

  // fallback: lähin mennyt
  const past = sorted.filter((x) => x.ts <= now);
  return past.length ? past[past.length - 1].p : (sorted[0]?.p ?? null);
}

export function useSpotHinta() {
  const [raw, setRaw] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        // Swaggerissa endpointit + rajoitukset. [2](https://api.spot-hinta.fi/swagger/ui)
        const res = await fetch(`${API_BASE}/TodayAndDayForward`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!cancelled) {
          setRaw(json);
          setFetchedAt(new Date());
        }
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    // Älä pollaa liian usein (API rate limit). [2](https://api.spot-hinta.fi/swagger/ui)
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const { todayList, tomorrowList, combinedList, intervalMs } = useMemo(() => {
    const { today, tomorrow } = normalizeResponse(raw);
    const combined = [...today, ...tomorrow];
    const interval = computeIntervalMs(combined);
    return {
      todayList: today,
      tomorrowList: tomorrow,
      combinedList: combined,
      intervalMs: interval,
    };
  }, [raw]);

  const current = useMemo(() => {
    if (!combinedList.length) return null;
    const item = pickCurrent(combinedList, intervalMs);
    if (!item) return null;

    return {
      ts: toTs(item),
      dateTime: item.DateTime ?? item.dateTime ?? null,
      price: toPrice(item),
      rank: toRank(item),
      raw: item,
      intervalMs,
    };
  }, [combinedList, intervalMs]);

  return {
    raw,
    current,
    todayList,
    tomorrowList,
    combinedList,
    intervalMs,
    loading,
    err,
    fetchedAt,
  };
}