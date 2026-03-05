// ============================================================
//  weatherService.js — API layer
// ============================================================

const WeatherService = (() => {

  async function _fetch(url) {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Geocode city name → [{lat, lon, name, country, state}]
  async function geocode(query, limit = 6) {
    const url = `${CONFIG.GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${CONFIG.API_KEY}`;
    return _fetch(url);
  }

  // Reverse geocode coords → city name
  async function reverseGeocode(lat, lon) {
    const url = `${CONFIG.GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${CONFIG.API_KEY}`;
    const data = await _fetch(url);
    return data[0] || { name: "Your Location", country: "" };
  }

  // Current weather
  async function getCurrentWeather(lat, lon, unit) {
    const cacheKey = `cur_${lat.toFixed(2)}_${lon.toFixed(2)}_${unit}`;
    const cached = Storage.getCached(cacheKey);
    if (cached) return { ...cached, fromCache: true };

    const url = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${CONFIG.API_KEY}`;
    const data = await _fetch(url);
    Storage.setCached(cacheKey, data);
    return data;
  }

  // 5-day / 3-hour forecast
  async function getForecast(lat, lon, unit) {
    const cacheKey = `fc_${lat.toFixed(2)}_${lon.toFixed(2)}_${unit}`;
    const cached = Storage.getCached(cacheKey);
    if (cached) return cached;

    const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${unit}&cnt=40&appid=${CONFIG.API_KEY}`;
    const data = await _fetch(url);
    Storage.setCached(cacheKey, data);
    return data;
  }

  // Fetch both together
  async function getAll(lat, lon, unit) {
    const [current, forecast] = await Promise.all([
      getCurrentWeather(lat, lon, unit),
      getForecast(lat, lon, unit),
    ]);
    return { current, forecast };
  }

  return { geocode, reverseGeocode, getAll };
})();
