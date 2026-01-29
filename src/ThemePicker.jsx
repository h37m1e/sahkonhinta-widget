// src/ThemePicker.jsx
import { useEffect, useState } from "react";

function SettingsIcon({ size = 22 }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <path
          d="M4 6h10M18 6h2M12 6v0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="15" cy="6" r="2" stroke="currentColor" strokeWidth="1.8" />
  
        <path
          d="M4 12h2M10 12h10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
  
        <path
          d="M4 18h10M18 18h2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="15" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

export function ThemePicker({ themeId, themes, setThemeId }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button className="settingsBtn" onClick={() => setOpen(true)} aria-label="Asetukset" title="Teema">
  <SettingsIcon />
</button>

      {open && (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Valitse teema">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Teema</div>
                <div className="modalSubtitle">Valitse väriteema widgetille</div>
              </div>
              <button className="iconBtn" onClick={() => setOpen(false)} aria-label="Sulje">
                ✕
              </button>
            </div>

            <div className="themeGrid">
              {themes.map((t) => (
                <button
                  key={t.id}
                  className={`themeOption ${t.id === themeId ? "active" : ""}`}
                  onClick={() => {
                    setThemeId(t.id);
                    setOpen(false);
                  }}
                >
                  <div className="swatches">
                    <span className="swatch" style={{ background: t.vars["--accent"] }} />
                    <span className="swatch" style={{ background: t.vars["--good"] }} />
                    <span className="swatch" style={{ background: t.vars["--mid"] }} />
                    <span className="swatch" style={{ background: t.vars["--bad"] }} />
                  </div>
                  <div className="themeName">{t.name}</div>
                </button>
              ))}
            </div>

            <div className="modalFooter">
              <span className="small">
                Muokkaa värejä tiedostossa <code>src/themes.js</code>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}