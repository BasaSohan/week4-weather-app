// ============================================================
//  app.js — main controller
// ============================================================

const App = (() => {
  let currentUnit = Storage.getUnit();
  let currentCity = null;
  let acTimer = null;

  // ── Init ──────────────────────────────────────────────────
  function init() {
    setUnit(currentUnit, false);

    // Welcome or restore last city
    const last = Storage.getLastCity();
    if (last) {
      loadCity(last);
    } else {
      const locBtn = UI.showWelcome();
      locBtn?.addEventListener("click", useLocation);
    }

    // Render fav chips
    UI.renderFavChips(loadCity);

    // Search input
    const input = document.querySelector("#searchInput");
    input?.addEventListener("input", onSearchInput);
    input?.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
    document.querySelector("#searchBtn")?.addEventListener("click", doSearch);

    // Unit toggle
    document.querySelector("#btnC")?.addEventListener("click", () => setUnit("metric"));
    document.querySelector("#btnF")?.addEventListener("click", () => setUnit("imperial"));

    // Location btn
    document.querySelector("#locationBtn")?.addEventListener("click", useLocation);

    // Close autocomplete on outside click
    document.addEventListener("click", e => {
      if (!e.target.closest(".search-wrap")) UI.closeAutocomplete();
    });

    // Custom event from saved cards
    document.addEventListener("wx:loadCity", e => loadCity(e.detail));
  }

  // ── Unit ─────────────────────────────────────────────────
  function setUnit(unit, refetch = true) {
    currentUnit = unit;
    Storage.setUnit(unit);
    document.querySelector("#btnC")?.classList.toggle("active", unit === "metric");
    document.querySelector("#btnF")?.classList.toggle("active", unit === "imperial");
    if (refetch && currentCity) loadCity(currentCity);
  }

  // ── Search ────────────────────────────────────────────────
  function onSearchInput(e) {
    clearTimeout(acTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { UI.closeAutocomplete(); return; }
    acTimer = setTimeout(() => fetchAC(q), 320);
  }

  async function fetchAC(q) {
    try {
      const cities = await WeatherService.geocode(q);
      UI.renderAutocomplete(cities, loadCity);
    } catch { UI.closeAutocomplete(); }
  }

  function doSearch() {
    const q = document.querySelector("#searchInput")?.value.trim();
    if (!q) return;
    UI.closeAutocomplete();
    searchByName(q);
  }

  async function searchByName(name) {
    UI.showSkeleton();
    try {
      const cities = await WeatherService.geocode(name, 1);
      if (!cities.length) throw new Error(`No results for "${name}"`);
      const c = cities[0];
      loadCity({ lat: c.lat, lon: c.lon, name: c.name, country: c.country });
    } catch (e) {
      UI.showError(e.message, () => searchByName(name));
    }
  }

  // ── Geolocation ───────────────────────────────────────────
  function useLocation() {
    if (!navigator.geolocation) { UI.toast("Geolocation not supported", "error"); return; }
    UI.showSkeleton();
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const city = await WeatherService.reverseGeocode(lat, lon);
          loadCity({ lat, lon, name: city.name, country: city.country });
        } catch {
          loadCity({ lat, lon, name: "Your Location", country: "" });
        }
      },
      () => UI.showError("Location access denied.", useLocation)
    );
  }

  // ── Load city ─────────────────────────────────────────────
  async function loadCity(city) {
    currentCity = city;
    Storage.setLastCity(city);
    UI.showSkeleton();

    // Update search input
    const input = document.querySelector("#searchInput");
    if (input) input.value = city.name;

    try {
      const { current, forecast } = await WeatherService.getAll(city.lat, city.lon, currentUnit);
      UI.renderWeather(current, forecast, city, currentUnit);
      UI.renderFavChips(loadCity);
    } catch (e) {
      UI.showError("API Error: " + e.message, () => loadCity(city));
    }
  }

  return { init };
})();

// Bootstrap
document.addEventListener("DOMContentLoaded", App.init);
