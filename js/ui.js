// ============================================================
//  ui.js — rendering & DOM helpers
// ============================================================

const UI = (() => {

  // ── Helpers ────────────────────────────────────────────────
  function qs(sel, ctx = document) { return ctx.querySelector(sel); }
  function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

  const WEATHER_ICONS = {
    "01d": "☀️", "01n": "🌙",
    "02d": "🌤️", "02n": "🌤️",
    "03d": "⛅",  "03n": "⛅",
    "04d": "☁️",  "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌦️",
    "11d": "⛈️",  "11n": "⛈️",
    "13d": "❄️",  "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
  };

  function weatherIcon(iconCode) {
    return WEATHER_ICONS[iconCode] || "🌡️";
  }

  function windDir(deg) {
    if (deg == null) return "–";
    const d = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return d[Math.round(deg / 22.5) % 16];
  }

  function countryFlag(iso) {
    if (!iso || iso.length !== 2) return "🌍";
    return [...iso.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
  }

  function fmtTime(unix) {
    return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function fmtDay(unix) {
    return new Date(unix * 1000).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
  }

  function unitLabel(unit) { return unit === "metric" ? "°C" : "°F"; }
  function speedLabel(unit) { return unit === "metric" ? "km/h" : "mph"; }
  function windSpeed(mps, unit) {
    return unit === "metric" ? Math.round(mps * 3.6) : Math.round(mps);
  }

  // Parse 3-hour list → daily summary (skip today)
  function parseForecast(list, unit) {
    const map = {};
    const todayKey = new Date().toDateString();
    list.forEach(item => {
      const d = new Date(item.dt * 1000);
      const key = d.toDateString();
      if (key === todayKey) return;
      if (!map[key]) map[key] = { hi: -Infinity, lo: Infinity, icons: [], dt: item.dt };
      map[key].hi = Math.max(map[key].hi, item.main.temp_max);
      map[key].lo = Math.min(map[key].lo, item.main.temp_min);
      map[key].icons.push(item.weather[0].icon);
    });
    return Object.values(map).slice(0, 5).map(v => ({
      label: fmtDay(v.dt),
      hi: v.hi,
      lo: v.lo,
      icon: weatherIcon(v.icons[Math.floor(v.icons.length / 2)] || "01d"),
    }));
  }

  // ── Toast ───────────────────────────────────────────────────
  let toastTimer;
  function toast(msg, type = "info") {
    const el = qs("#toast");
    el.textContent = msg;
    el.className = `toast toast--${type} toast--show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("toast--show"), 3200);
  }

  // ── Autocomplete ────────────────────────────────────────────
  function renderAutocomplete(cities, onSelect) {
    const list = qs("#autocompleteList");
    list.innerHTML = "";
    if (!cities.length) { list.classList.remove("visible"); return; }
    cities.forEach(city => {
      const item = document.createElement("div");
      item.className = "ac-item";
      item.innerHTML = `
        <span class="ac-flag">${countryFlag(city.country)}</span>
        <span class="ac-name">${city.name}</span>
        <span class="ac-meta">${[city.state, city.country].filter(Boolean).join(", ")}</span>
      `;
      item.addEventListener("click", () => {
        qs("#searchInput").value = city.name;
        list.classList.remove("visible");
        onSelect({ lat: city.lat, lon: city.lon, name: city.name, country: city.country });
      });
      list.appendChild(item);
    });
    list.classList.add("visible");
  }

  function closeAutocomplete() {
    qs("#autocompleteList").classList.remove("visible");
  }

  // ── Favorite chips ──────────────────────────────────────────
  function renderFavChips(onSelect) {
    const favs = Storage.getFavorites();
    const wrap = qs("#favChips");
    wrap.innerHTML = favs.map(f => `
      <button class="fav-chip" data-name="${f.name}" data-country="${f.country || ""}"
        data-lat="${f.lat}" data-lon="${f.lon}">
        ${countryFlag(f.country)} ${f.name}
      </button>
    `).join("");
    qsa(".fav-chip", wrap).forEach(btn => {
      btn.addEventListener("click", () => onSelect({
        lat: +btn.dataset.lat, lon: +btn.dataset.lon,
        name: btn.dataset.name, country: btn.dataset.country,
      }));
    });
  }

  // ── Loading skeleton ────────────────────────────────────────
  function showSkeleton() {
    qs("#content").innerHTML = `
      <div class="skeleton-wrap">
        <div class="skeleton-hero">
          <div class="skel skel--circle"></div>
          <div class="skel-group">
            <div class="skel skel--wide"></div>
            <div class="skel skel--med"></div>
            <div class="skel skel--narrow"></div>
          </div>
        </div>
        <div class="skeleton-row">
          ${[1,2,3,4].map(() => `<div class="skel skel--card"></div>`).join("")}
        </div>
        <div class="skeleton-row">
          ${[1,2,3,4,5].map(() => `<div class="skel skel--strip"></div>`).join("")}
        </div>
      </div>
    `;
  }

  // ── Error state ─────────────────────────────────────────────
  function showError(msg, onRetry) {
    qs("#content").innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚡</div>
        <h3 class="error-title">Something went wrong</h3>
        <p class="error-msg">${msg}</p>
        <button class="btn btn--primary" id="retryBtn">Try Again</button>
      </div>
    `;
    qs("#retryBtn")?.addEventListener("click", onRetry);
  }

  // ── Welcome state ────────────────────────────────────────────
  function showWelcome() {
    qs("#content").innerHTML = `
      <div class="welcome-state">
        <div class="welcome-orb">
          <span class="welcome-icon">🌤</span>
        </div>
        <h2 class="welcome-title">Nimbus Weather</h2>
        <p class="welcome-sub">Search for a city or use your current location<br>to get live weather intelligence.</p>
        <button class="btn btn--primary btn--lg" id="welcomeLocBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
          Use My Location
        </button>
      </div>
    `;
    return qs("#welcomeLocBtn");
  }

  // ── Main weather render ──────────────────────────────────────
  function renderWeather(current, forecast, cityMeta, unit) {
    const days = parseForecast(forecast.list, unit);
    const ul = unitLabel(unit);
    const sl = speedLabel(unit);
    const ws = windSpeed(current.wind.speed, unit);
    const icon = weatherIcon(current.weather[0].icon);
    const desc = current.weather[0].description;
    const isSaved = Storage.isFavorite(cityMeta.name, cityMeta.country);
    const tempRange = { min: Math.min(...days.map(d=>d.lo)), max: Math.max(...days.map(d=>d.hi)) };
    const vis = current.visibility != null ? (current.visibility / 1000).toFixed(1) + " km" : "–";

    qs("#content").innerHTML = `
      <!-- Hero -->
      <section class="hero-card fade-in">
        <div class="hero-bg-blob"></div>
        <div class="hero-left">
          <div class="hero-location">
            <svg class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${cityMeta.name}${cityMeta.country ? ", " + cityMeta.country : ""}</span>
            <span class="hero-flag">${countryFlag(cityMeta.country)}</span>
          </div>
          <div class="hero-temp-row">
            <span class="hero-icon">${icon}</span>
            <span class="hero-temp">${Math.round(current.main.temp)}<sup>${ul}</sup></span>
          </div>
          <div class="hero-desc">${desc.charAt(0).toUpperCase() + desc.slice(1)}</div>
          <div class="hero-feels">Feels like ${Math.round(current.main.feels_like)}${ul} &nbsp;·&nbsp; Updated ${fmtTime(current.dt)}</div>
          <div class="hero-actions">
            <button class="btn btn--ghost btn--sm" id="favToggleBtn">
              ${isSaved
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Saved`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Save City`}
            </button>
            <button class="btn btn--ghost btn--sm" id="shareBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
          </div>
        </div>
        <div class="hero-right">
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-icon">💧</div>
              <div class="stat-val">${current.main.humidity}%</div>
              <div class="stat-key">Humidity</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">💨</div>
              <div class="stat-val">${ws} ${sl}</div>
              <div class="stat-key">Wind · ${windDir(current.wind.deg)}</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🌡️</div>
              <div class="stat-val">${current.main.pressure}</div>
              <div class="stat-key">hPa</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">👁️</div>
              <div class="stat-val">${vis}</div>
              <div class="stat-key">Visibility</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🌅</div>
              <div class="stat-val">${fmtTime(current.sys.sunrise)}</div>
              <div class="stat-key">Sunrise</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🌇</div>
              <div class="stat-val">${fmtTime(current.sys.sunset)}</div>
              <div class="stat-key">Sunset</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Forecast strip -->
      <section class="forecast-section fade-in" style="animation-delay:.08s">
        <h2 class="section-title">5-Day Forecast</h2>
        <div class="forecast-strip">
          ${days.map((d, i) => {
            const barW = tempRange.max > tempRange.min
              ? 20 + 70 * (d.hi - tempRange.min) / (tempRange.max - tempRange.min)
              : 55;
            return `
              <div class="fc-card" style="animation-delay:${.1 + i*.05}s">
                <div class="fc-day">${d.label}</div>
                <div class="fc-icon">${d.icon}</div>
                <div class="fc-bar-wrap"><div class="fc-bar" style="width:${barW}%"></div></div>
                <div class="fc-temps">
                  <span class="fc-hi">${Math.round(d.hi)}°</span>
                  <span class="fc-lo">${Math.round(d.lo)}°</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>

      <!-- Details row -->
      <section class="details-section fade-in" style="animation-delay:.15s">
        <h2 class="section-title">Conditions Detail</h2>
        <div class="details-grid">
          <div class="detail-card">
            <div class="detail-head">Temperature Range</div>
            <div class="detail-big">${Math.round(current.main.temp_min)}° / ${Math.round(current.main.temp_max)}°</div>
            <div class="detail-sub">Today's low &amp; high</div>
            <div class="temp-range-bar">
              <div class="temp-range-fill" style="
                left:${100*(current.main.temp_min - current.main.temp_min)/(current.main.temp_max - current.main.temp_min + 1)}%;
                right:0
              "></div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-head">Cloud Coverage</div>
            <div class="detail-big">${current.clouds?.all ?? 0}%</div>
            <div class="detail-sub">Sky condition</div>
            <div class="donut-wrap">
              <svg viewBox="0 0 36 36" class="donut">
                <circle class="donut-bg" cx="18" cy="18" r="14"/>
                <circle class="donut-fill" cx="18" cy="18" r="14"
                  stroke-dasharray="${(current.clouds?.all ?? 0) * 87.96 / 100} 87.96"
                  stroke-dashoffset="21.99"/>
              </svg>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-head">Wind</div>
            <div class="detail-big">${ws} <small>${sl}</small></div>
            <div class="detail-sub">Direction: ${windDir(current.wind.deg)} (${current.wind.deg ?? "–"}°)</div>
            ${current.wind.gust ? `<div class="detail-gust">Gusts up to ${windSpeed(current.wind.gust, unit)} ${sl}</div>` : ""}
          </div>
          <div class="detail-card">
            <div class="detail-head">Atmosphere</div>
            <div class="detail-row"><span>Pressure</span><strong>${current.main.pressure} hPa</strong></div>
            <div class="detail-row"><span>Sea Level</span><strong>${current.main.sea_level ?? current.main.pressure} hPa</strong></div>
            <div class="detail-row"><span>Ground</span><strong>${current.main.grnd_level ?? "–"} hPa</strong></div>
          </div>
        </div>
      </section>

      <!-- Saved cities -->
      <section class="saved-section fade-in" style="animation-delay:.2s">
        <h2 class="section-title">Saved Cities</h2>
        <div id="savedList"></div>
      </section>
    `;

    // Render saved list
    renderSavedList();

    // Fav toggle
    qs("#favToggleBtn")?.addEventListener("click", () => {
      if (Storage.isFavorite(cityMeta.name, cityMeta.country)) {
        Storage.removeFavorite(cityMeta.name, cityMeta.country);
        toast(`Removed ${cityMeta.name}`, "info");
      } else {
        Storage.addFavorite({ ...cityMeta, icon: icon, temp: Math.round(current.main.temp), ul });
        toast(`${cityMeta.name} saved!`, "success");
      }
      // Re-render fav toggle button only
      const btn = qs("#favToggleBtn");
      const now = Storage.isFavorite(cityMeta.name, cityMeta.country);
      btn.innerHTML = now
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Saved`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Save City`;
      renderSavedList();
    });

    // Share
    qs("#shareBtn")?.addEventListener("click", () => {
      const text = `Weather in ${cityMeta.name}: ${Math.round(current.main.temp)}${ul}, ${desc}`;
      if (navigator.share) {
        navigator.share({ title: "Nimbus Weather", text });
      } else {
        navigator.clipboard?.writeText(text);
        toast("Copied to clipboard!", "success");
      }
    });
  }

  function renderSavedList(onSelect) {
    const el = qs("#savedList");
    if (!el) return;
    const favs = Storage.getFavorites();
    if (!favs.length) {
      el.innerHTML = `<p class="empty-saved">No saved cities yet. Search for a city and click Save.</p>`;
      return;
    }
    el.innerHTML = `<div class="saved-grid">${favs.map(f => `
      <div class="saved-card" data-name="${f.name}" data-country="${f.country||""}" data-lat="${f.lat}" data-lon="${f.lon}">
        <div class="saved-flag">${countryFlag(f.country)}</div>
        <div class="saved-info">
          <div class="saved-name">${f.name}</div>
          <div class="saved-country">${f.country || ""}</div>
        </div>
        <div class="saved-temp">${f.icon || "🌡️"} ${f.temp ?? "–"}${f.ul || "°"}</div>
        <button class="saved-del" data-name="${f.name}" data-country="${f.country||""}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join("")}</div>`;

    qsa(".saved-card").forEach(card => {
      card.addEventListener("click", e => {
        if (e.target.closest(".saved-del")) return;
        // dispatch custom event so app.js handles fetch
        document.dispatchEvent(new CustomEvent("wx:loadCity", { detail: {
          lat: +card.dataset.lat, lon: +card.dataset.lon,
          name: card.dataset.name, country: card.dataset.country,
        }}));
      });
    });

    qsa(".saved-del").forEach(btn => {
      btn.addEventListener("click", () => {
        Storage.removeFavorite(btn.dataset.name, btn.dataset.country);
        renderSavedList();
        toast("Removed", "info");
      });
    });
  }

  return { toast, renderAutocomplete, closeAutocomplete, renderFavChips, showSkeleton, showError, showWelcome, renderWeather };
})();
