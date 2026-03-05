# 🌤 Nimbus — Weather Intelligence

A professional weather application with real-time data from OpenWeatherMap API.

---

## 🚀 Quick Start

1. Open `js/config.js`
2. Replace the `API_KEY` value with your OpenWeatherMap key
3. Open `index.html` in a browser (or deploy to GitHub Pages)

```js
// js/config.js
const CONFIG = {
  API_KEY: "YOUR_KEY_HERE",   // ← update this
  ...
};
```

> Get a free API key at: https://openweathermap.org/api

---

## ✨ Features

| Feature | Details |
|---|---|
| Current Weather | Temp, feels-like, humidity, wind, pressure, visibility |
| 5-Day Forecast | Daily hi/lo with condition icons |
| City Search | Autocomplete via OpenWeatherMap Geocoding API |
| Geolocation | One-click "Use My Location" |
| Unit Toggle | Celsius / Fahrenheit — persisted across sessions |
| Save Cities | Favorite up to any number of cities |
| Data Caching | 10-minute localStorage cache to reduce API calls |
| Responsive | Mobile, tablet, and desktop layouts |
| Share | Native share API with clipboard fallback |

---

## 🗂 File Structure

```
nimbus-weather/
├── index.html              ← Entry point
├── css/
│   ├── style.css           ← Core layout & typography
│   ├── weather-icons.css   ← Component styles & animations
│   └── responsive.css      ← Breakpoints
├── js/
│   ├── config.js           ← API key & settings (edit this)
│   ├── storage.js          ← localStorage helpers
│   ├── weatherService.js   ← API calls & caching
│   ├── ui.js               ← DOM rendering
│   └── app.js              ← Main controller
├── assets/
│   └── icons/
└── README.md
```

---

## 🛠 Architecture

```
app.js (controller)
  ├── WeatherService  → API calls (config.js → OpenWeatherMap)
  ├── Storage         → localStorage (cache, favorites, settings)
  └── UI              → DOM rendering (skeleton, weather, errors)
```

**Data flow:**
1. User searches / uses location → `app.js`
2. `WeatherService` checks cache → fetches API if stale
3. `UI` renders skeleton → then weather data
4. `Storage` persists favorites, last city, unit preference

---

## 🔑 Updating the API Key

Edit `js/config.js` — the only file you need to change:

```js
const CONFIG = {
  API_KEY: "paste_your_key_here",
  ...
};
```

---

## 🌐 Deploy to GitHub Pages

1. Push the project folder to a GitHub repo
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Your app will be live at `https://yourusername.github.io/repo-name/`

---

## 📋 Quality Checklist (Week 4 Submission)

- [x] REST API integration (OpenWeatherMap)
- [x] JSON data parsing and display
- [x] Async/await with error handling
- [x] Fetch API for data retrieval
- [x] City search with autocomplete
- [x] Temperature unit conversion
- [x] Responsive design (mobile/tablet/desktop)
- [x] Error states and loading skeletons
- [x] localStorage caching (10 min TTL)
- [x] Favorite cities with persistence
- [x] 5-day forecast
- [x] Share functionality
- [x] Geolocation support
- [x] Modular code structure
- [x] GitHub-ready project layout
