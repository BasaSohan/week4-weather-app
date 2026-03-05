// ============================================================
//  WEATHER APP — CONFIGURATION
//  Update API_KEY below with your OpenWeatherMap key
// ============================================================

const CONFIG = {
  API_KEY: "9ba95c05c6105d38203f8bbba238a97f",   // ← update here
  BASE_URL: "https://api.openweathermap.org/data/2.5",
  GEO_URL:  "https://api.openweathermap.org/geo/1.0",
  CACHE_TTL: 10 * 60 * 1000,   // 10 minutes
  DEFAULT_UNIT: "metric",        // "metric" | "imperial"
};
