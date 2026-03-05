// ============================================================
//  storage.js — localStorage helpers
// ============================================================

const Storage = (() => {
  const KEYS = {
    UNIT:        "wx_unit",
    LAST_CITY:   "wx_last_city",
    FAVORITES:   "wx_favorites",
    CACHE_PFX:   "wx_cache_",
  };

  function get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // Unit
  function getUnit()       { return get(KEYS.UNIT) || CONFIG.DEFAULT_UNIT; }
  function setUnit(u)      { set(KEYS.UNIT, u); }

  // Last city
  function getLastCity()   { return get(KEYS.LAST_CITY); }
  function setLastCity(c)  { set(KEYS.LAST_CITY, c); }

  // Favorites
  function getFavorites()          { return get(KEYS.FAVORITES) || []; }
  function saveFavorites(arr)      { set(KEYS.FAVORITES, arr); }
  function addFavorite(city)       {
    const favs = getFavorites();
    if (!favs.some(f => f.name === city.name && f.country === city.country)) {
      favs.push(city);
      saveFavorites(favs);
    }
  }
  function removeFavorite(name, country) {
    saveFavorites(getFavorites().filter(f => !(f.name === name && f.country === country)));
  }
  function isFavorite(name, country) {
    return getFavorites().some(f => f.name === name && f.country === country);
  }

  // Weather cache
  function getCached(key) {
    const entry = get(KEYS.CACHE_PFX + key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CONFIG.CACHE_TTL) { remove(KEYS.CACHE_PFX + key); return null; }
    return entry.data;
  }
  function setCached(key, data) {
    set(KEYS.CACHE_PFX + key, { ts: Date.now(), data });
  }

  return { getUnit, setUnit, getLastCity, setLastCity, getFavorites, addFavorite, removeFavorite, isFavorite, getCached, setCached };
})();
