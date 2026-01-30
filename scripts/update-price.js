// scripts/update-price.js
// Päivittää public/price.json:iin ajantasaisen updated-aikaleiman (UTC).
// Säilyttää olemassa olevan price_ct_kwh -arvon, ellet itse päivitä sitä tässä.
// Voit myöhemmin lisätä API-haun hinnalle (katso TODO-kommentit alempana).

import { readFileSync, writeFileSync, mkdirSync } from "fs";

const PRICE_PATH = "public/price.json";

// 1) Lue nykyinen price.json tai tee perus
let data = { price_ct_kwh: 8.2, updated: null };
try {
  const raw = readFileSync(PRICE_PATH, "utf-8");
  data = JSON.parse(raw);
} catch {
  // Ei haittaa — luodaan uusi oletusarvoilla
}

// 2) (VALINNAINEN) Päivitä hinta automaattisesti API:sta
// ----------------------------------------------------
// TODO: Jos haluat hakea hinnan oikeasta API:sta, tee esim:
//
// const res = await fetch("https://YOUR_API_URL");
// if (!res.ok) throw new Error(`HTTP ${res.status}`);
// const json = await res.json();
// data.price_ct_kwh = Number((json.eur_mwh / 10).toFixed(1)); // €/MWh -> snt/kWh
//
// (Node 20:ssa fetch on natiivisti tuettu; workflow käyttää Node 20 -versiota.)

// 3) Päivitä aikaleima aina
data.updated = new Date().toISOString();

// 4) Kirjoita takaisin public/price.json
mkdirSync("public", { recursive: true });
writeFileSync(PRICE_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");

console.log("Updated public/price.json:", data);