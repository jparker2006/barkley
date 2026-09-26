// The sky over Harper Monkey Trail, right now: where the sun really is (so dawn, golden hour, sunset and night
// happen when they happen in Los Angeles), and the live weather from Open-Meteo (clear, cloudy, overcast,
// marine-layer fog, rain, and how windy it is). Runs in <head> so the first paint is already the right time of day.
//
// Everything lands as CSS variables and data attributes on <html>:
//   --night      0 = day painting, 1 = the night painting (crossfades through twilight)
//   --g-top, --g-bottom   colour grade for dawn, golden hour and sunset
//   --wind       0 calm … 1 gusty (poppy sway and cloud drift speed)
//   data-weather="clear|cloudy|overcast|fog|rain"
// Preview any moment: ?time=19:40 (LA time) and/or ?weather=fog.   window.__sky has the numbers.
(function () {
  'use strict';
  var root = document.documentElement;
  var LAT = 34.1106, LON = -118.3504; // Harper Monkey Trail, Runyon Canyon
  var q = new URLSearchParams(location.search);
  var sky = window.__sky = { elevation: 0, night: 0, weather: 'clear', wind: 0.3 };

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function mixRGBA(a, b, t) {
    return 'rgba(' + a.map(function (v, i) { var x = v + (b[i] - v) * t; return i < 3 ? Math.round(x) : x.toFixed(3); }).join(',') + ')';
  }

  // The moment we're showing: now, or a previewed LA time (?time=HH:MM, or the older ?hour=17.5).
  function moment() {
    var now = new Date(), t = q.get('time'), h = q.get('hour'), target = null;
    if (t && /^\d{1,2}:\d{2}$/.test(t)) target = +t.split(':')[0] + t.split(':')[1] / 60;
    else if (h !== null && !isNaN(+h)) target = +h;
    if (target === null) return now;
    var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now);
    var get = function (k) { return +p.find(function (x) { return x.type === k; }).value; };
    return new Date(now.getTime() + ((target % 24) - (get('hour') + get('minute') / 60)) * 3600000);
  }

  // Solar elevation in degrees (standard low-precision almanac formulas; good to ~0.5°).
  function elevation(date) {
    var r = Math.PI / 180, d = date.getTime() / 86400000 - 10957.5;
    var g = (357.529 + 0.98560028 * d) * r, ql = 280.459 + 0.98564736 * d;
    var L = (ql + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * r, e = (23.439 - 0.00000036 * d) * r;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    var gmst = ((18.697374558 + 24.06570982441908 * d) % 24) * 15;
    var ha = (gmst + LON) * r - ra;
    return Math.asin(Math.sin(LAT * r) * Math.sin(dec) + Math.cos(LAT * r) * Math.cos(dec) * Math.cos(ha)) / r;
  }

  function paintSun() {
    var when = moment(), el = elevation(when), morning = elevation(new Date(when.getTime() + 600000)) > el;
    var night = clamp((-el - 1) / 8, 0, 1);                       // day painting at -1°, night painting by -9°
    var golden = clamp(1 - el / 14, 0, 1) * clamp((el + 4) / 4, 0, 1); // low sun, warm light
    var top = morning ? [255, 150, 175, .85] : [255, 120, 110, .9];     // dawn blush / sunset rose
    var bot = morning ? [255, 190, 130, .6] : [255, 150, 60, .65];      // warm light on the land
    var clear = [255, 240, 210, 0];
    root.style.setProperty('--night', night.toFixed(3));
    root.style.setProperty('--g-top', mixRGBA(clear, top, golden * (1 - night)));
    root.style.setProperty('--g-bottom', mixRGBA(clear, bot, golden * (1 - night)));
    root.classList.toggle('is-night', night > 0.5);
    root.classList.toggle('is-dusk', night > 0);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = night > 0.5 ? '#1c2a5a' : '#a9dde2';
    sky.elevation = +el.toFixed(2); sky.night = night; sky.morning = morning;
    dispatchEvent(new CustomEvent('skychange', { detail: sky }));
  }

  // Weather: WMO codes from Open-Meteo, grouped into what the painting can show.
  function classify(c) {
    var code = c.weather_code;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 || c.precipitation > 0.1) return 'rain';
    if (code === 45 || code === 48 || (c.visibility && c.visibility < 2500)) return 'fog';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86 || code === 3 || c.cloud_cover >= 80) return 'overcast';
    if (code === 2 || c.cloud_cover >= 35) return 'cloudy';
    return 'clear';
  }
  function applyWeather(kind, windKmh) {
    sky.weather = kind; sky.wind = clamp((windKmh || 0) / 35, 0, 1);
    root.dataset.weather = kind;
    root.style.setProperty('--wind', sky.wind.toFixed(2));
    dispatchEvent(new CustomEvent('skychange', { detail: sky }));
  }
  function fetchWeather() {
    var forced = q.get('weather');
    if (forced) return applyWeather(forced, +(q.get('wind') || 12));
    var KEY = 'barkley-weather', cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
    if (cached && Date.now() - cached.at < 10 * 60000) return applyWeather(cached.kind, cached.wind);
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
      '&current=weather_code,cloud_cover,wind_speed_10m,visibility,precipitation&timezone=America%2FLos_Angeles')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var kind = classify(d.current), wind = d.current.wind_speed_10m;
        try { sessionStorage.setItem(KEY, JSON.stringify({ kind: kind, wind: wind, at: Date.now() })); } catch (e) {}
        applyWeather(kind, wind);
      })
      .catch(function () {}); // no weather? the painted clear morning is a fine default
  }

  paintSun();
  root.dataset.weather = 'clear';
  root.style.setProperty('--wind', '0.30');
  fetchWeather();
  setInterval(paintSun, 60000);
  setInterval(fetchWeather, 15 * 60000);
})();
