// src/App.jsx
import "./theme.css";
import { useSpotHinta } from "./useSpotHinta";
import { useTheme } from "./useTheme";
import { ThemePicker } from "./ThemePicker";
import { Next12hChart } from "./Next12hChart";

function classify(rank) {
  if (rank == null) return "mid";
  if (rank <= 8) return "good";
  if (rank <= 16) return "mid";
  return "bad";
}

export default function App() {
  const { themeId, themes, setThemeId } = useTheme();
  const { current, combinedList, loading, err, fetchedAt } = useSpotHinta();
  const badge = classify(current?.rank);

  const value =
    loading ? "…" :
    err ? "—" :
    (typeof current?.price === "number" ? current.price.toFixed(2) : (current?.price ?? "—"));

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18 }}>
      <ThemePicker themeId={themeId} themes={themes} setThemeId={setThemeId} />

      <div style={{ width: "min(520px, 100%)" }}>
        <div className="card">
          <div className="row">
            <div>
              <div className="title">Sähkön hinta nyt</div>
              <div className="price">
                {value}<span className="unit">snt/kWh</span>
              </div>
            </div>

            <div className={`badge ${badge}`}>
              {badge === "good" ? "HALPA" : badge === "mid" ? "OK" : "KALLIS"}
            </div>
          </div>

          <div style={{ marginTop: 10 }} className="small">
            {err
              ? <>Virhe: {String(err.message || err)}</>
              : fetchedAt
                ? <>Päivitetty: {fetchedAt.toLocaleTimeString()}</>
                : <>—</>
            }
          </div>

          <div style={{ marginTop: 10 }} className="small">
          </div>
        </div>

        <Next12hChart combinedList={combinedList} />
      </div>
    </div>
  );
}