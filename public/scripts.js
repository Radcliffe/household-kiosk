const SCREEN_DURATION_MS = 8000;
const WEATHER_REFRESH_MS = 15 * 60 * 1000;
const EVENTS_REFRESH_MS = 15 * 60 * 1000;
const EVENTS_TO_SHOW = 3;
const LOCAL_CALENDAR_ICS_URL = "/calendar.ics";
const LOCAL_CONFIG_URL = "/config.json";

const SCREENS = Array.from(document.querySelectorAll(".screen"));
const footerStatus = document.getElementById("footer-status");

const state = {
  activeScreenIndex: 0,
  config: {
    locationName: "Saint Paul, Minnesota",
    latitude: 44.9537,
    longitude: -93.09,
    timezone: "America/Chicago",
  },
  weather: null,
  events: [],
};

async function fetchConfig() {
  const response = await fetch(LOCAL_CONFIG_URL, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Config request failed: ${response.status}`);
  }
  const config = await response.json();
  state.config = {
    ...state.config,
    ...config,
  };
  document.getElementById("weather-city").textContent =
    state.config.locationName;
}

function getPartOfDay(date) {
  const hour = date.getHours();
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function formatClockTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: state.config.timezone,
  })
    .format(date)
    .toLowerCase();
}

function updateClockScreen() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: state.config.timezone,
  }).format(now);
  const fullDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: state.config.timezone,
  }).format(now);

  const localHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: state.config.timezone,
    }).format(now),
  );

  document.getElementById("clock-greeting").textContent =
    `${weekday} ${getPartOfDay({ getHours: () => localHour })}`;
  document.getElementById("clock-time").textContent = formatClockTime(now);
  document.getElementById("clock-date").textContent = fullDate;
}

function showScreen(index) {
  SCREENS.forEach((screen, i) => {
    screen.classList.toggle("active", i === index);
  });
  footerStatus.textContent = `Screen ${index + 1} / ${SCREENS.length}`;
}

function startScreenRotation() {
  setInterval(() => {
    state.activeScreenIndex = (state.activeScreenIndex + 1) % SCREENS.length;
    showScreen(state.activeScreenIndex);
  }, SCREEN_DURATION_MS);
}

function weatherCodeToDescription(code) {
  const map = {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
  };
  return map[code] || "Unknown";
}

function formatTemp(value) {
  return `${Math.round(value)}°`;
}

async function fetchWeather() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", state.config.latitude);
    url.searchParams.set("longitude", state.config.longitude);
    url.searchParams.set(
      "current",
      "temperature_2m,weather_code,wind_speed_10m,apparent_temperature",
    );
    url.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min",
    );
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("timezone", state.config.timezone);
    url.searchParams.set("forecast_days", "5");

    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Weather request failed: ${response.status}`);
    state.weather = await response.json();
    renderWeather();
  } catch (error) {
    console.error(error);
    renderWeatherError();
  }
}

function renderWeather() {
  if (!state.weather) return;

  const current = state.weather.current;
  const daily = state.weather.daily;
  document.getElementById("weather-city").textContent =
    state.config.locationName;
  document.getElementById("weather-temp").textContent = formatTemp(
    current.temperature_2m,
  );
  document.getElementById("weather-summary").textContent =
    weatherCodeToDescription(current.weather_code);
  document.getElementById("weather-details").innerHTML = [
    `Feels like ${formatTemp(current.apparent_temperature)}`,
    `Wind ${Math.round(current.wind_speed_10m)} mph`,
  ].join("<br>");

  const forecastList = document.getElementById("forecast-list");
  forecastList.innerHTML = "";

  daily.time.forEach((day, index) => {
    const row = document.createElement("div");
    row.className = "forecast-row";
    const dayName = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: state.config.timezone,
    }).format(new Date(`${day}T12:00:00`));
    row.innerHTML = `
<div class="forecast-day">${dayName}</div>
<div class="forecast-desc">${weatherCodeToDescription(daily.weather_code[index])}</div>
<div class="forecast-temps">${formatTemp(daily.temperature_2m_max[index])} / ${formatTemp(daily.temperature_2m_min[index])}</div>
`;
    forecastList.appendChild(row);
  });
}

function renderWeatherError() {
  document.getElementById("weather-temp").textContent = "--°";
  document.getElementById("weather-summary").textContent =
    "Weather unavailable";
  document.getElementById("weather-details").textContent =
    "Could not load current conditions.";
  document.getElementById("forecast-list").innerHTML =
    '<div class="error">Could not load forecast.</div>';
}

async function fetchEvents() {
  try {
    const response = await fetch(LOCAL_CALENDAR_ICS_URL, {
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`Calendar request failed: ${response.status}`);
    const icsText = await response.text();
    state.events = parseUpcomingEventsFromICS(icsText);
    renderEvents();
  } catch (error) {
    console.error(error);
    renderEventsError();
  }
}

function parseUpcomingEventsFromICS(icsText) {
  const unfolded = icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const blocks = unfolded
    .split("BEGIN:VEVENT")
    .slice(1)
    .map((block) => block.split("END:VEVENT")[0]);
  const now = new Date();
  const events = [];

  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const event = {};

    for (const line of lines) {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) continue;
      const rawKey = line.slice(0, separatorIndex);
      const value = line.slice(separatorIndex + 1);
      const key = rawKey.split(";")[0];
      event[key] = value;
    }

    const startInfo = extractDateValue(lines, "DTSTART");
    const endInfo = extractDateValue(lines, "DTEND");
    const title = decodeICSText(event.SUMMARY || "Untitled event");
    const location = decodeICSText(event.LOCATION || "");
    const description = decodeICSText(event.DESCRIPTION || "");

    if (!startInfo) continue;

    const start = parseICSDate(startInfo.value, startInfo.params);
    const end = endInfo ? parseICSDate(endInfo.value, endInfo.params) : null;
    if (!start || (end && end < now) || (!end && start < now)) continue;

    events.push({
      title,
      location,
      description,
      start,
      end,
      isAllDay: startInfo.params.includes("VALUE=DATE"),
    });
  }

  events.sort((a, b) => a.start - b.start);
  return events.slice(0, EVENTS_TO_SHOW);
}

function extractDateValue(lines, prefix) {
  const target = lines.find((line) => line.startsWith(prefix));
  if (!target) return null;
  const separatorIndex = target.indexOf(":");
  const rawKey = target.slice(0, separatorIndex);
  const value = target.slice(separatorIndex + 1);
  const params = rawKey.split(";").slice(1);
  return { value, params };
}

function parseICSDate(value, params = []) {
  if (!value) return null;
  const isDateOnly = params.includes("VALUE=DATE") || /^\d{8}$/.test(value);
  if (isDateOnly) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return new Date(year, month, day, 0, 0, 0);
  }

  if (value.endsWith("Z")) {
    const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
    return new Date(iso);
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(9, 11));
  const minute = Number(value.slice(11, 13));
  const second = Number(value.slice(13, 15) || 0);
  return new Date(year, month, day, hour, minute, second);
}

function decodeICSText(value) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function formatEventDateTime(date, isAllDay) {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: state.config.timezone,
  }).format(date);
  const time = isAllDay
    ? "All day"
    : new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: state.config.timezone,
      })
        .format(date)
        .toLowerCase();
  return { day, time };
}

function renderEvents() {
  const container = document.getElementById("events-list");
  container.innerHTML = "";

  if (!state.events.length) {
    container.innerHTML = '<div class="empty">No upcoming events found.</div>';
    return;
  }

  state.events.forEach((event) => {
    const when = formatEventDateTime(event.start, event.isAllDay);
    const metaParts = [];
    if (event.location) metaParts.push(event.location);
    if (event.description) metaParts.push(event.description);

    const row = document.createElement("div");
    row.className = "event-row";
    row.innerHTML = `
<div class="event-when">${when.day}<br>${when.time}</div>
<div class="event-main">
  <div class="event-title">${escapeHtml(event.title)}</div>
  <div class="event-meta">${escapeHtml(metaParts.join(" · ") || "Calendar event")}</div>
</div>
`;
    container.appendChild(row);
  });
}

function renderEventsError() {
  document.getElementById("events-list").innerHTML =
    '<div class="error">Could not load Google Calendar events from the local calendar proxy.</div>';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function startClock() {
  updateClockScreen();

  const now = new Date();
  const delayUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    updateClockScreen();
    setInterval(updateClockScreen, 60 * 1000);
  }, delayUntilNextMinute);
}

function startDataRefresh() {
  fetchWeather();
  fetchEvents();
  setInterval(fetchWeather, WEATHER_REFRESH_MS);
  setInterval(fetchEvents, EVENTS_REFRESH_MS);
}

async function init() {
  showScreen(state.activeScreenIndex);
  try {
    await fetchConfig();
  } catch (error) {
    console.error(error);
  }
  startClock();
  startScreenRotation();
  startDataRefresh();
}

init();
