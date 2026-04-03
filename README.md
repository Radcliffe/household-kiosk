# Household Kiosk

A plain JavaScript household kiosk app designed for a 1920×1080 display.

It rotates through three full-screen views every five seconds:
- current date and time
- current weather and 5-day forecast
- upcoming calendar events

The app is safe to share on GitHub because sensitive values are kept in a local `.env` file and are never sent to the browser, except through a local `/calendar.ics` proxy endpoint.

## Features

- Plain HTML, CSS, and JavaScript frontend
- Express server for local hosting
- Private Google Calendar ICS proxy
- Configurable location name, coordinates, and timezone
- Configurable calendar feed URL
- Ready to cast from Chrome to a Chromecast

## Project structure

```text
household-kiosk/
├── .env.example
├── .gitignore
├── package.json
├── public/
│   └── index.html
├── README.md
└── server.js
```

## Configuration

The frontend expects this line and uses it to fetch calendar data from the local server:

```js
const LOCAL_CALENDAR_ICS_URL = "/calendar.ics";
```

Do not put your real calendar URL into `public/index.html` or any other client-side file.

Instead, copy `.env.example` to `.env` and fill in your own values.

### Example `.env`

```env
LOCATION_NAME=Saint Paul, Minnesota
LATITUDE=44.9537
LONGITUDE=-93.0900
TIMEZONE=America/Chicago
CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/your-secret-url/basic.ics
PORT=3000
```

## Installation

1. Clone the repository.
2. Install dependencies.
3. Create a local `.env` file.
4. Start the server.

```bash
npm install
cp .env.example .env
npm start
```

Then open:

```text
http://localhost:3000
```

## Chromecast usage

1. Start the kiosk locally with `npm start`.
2. Open `http://localhost:3000` in Google Chrome.
3. Use Chrome's cast feature to cast the tab or screen to your Chromecast-connected monitor.
4. Keep the computer running as the kiosk source.

## Sharing on GitHub

This project is designed so you can commit everything except your local `.env` file.

The `.gitignore` already excludes:
- `.env`
- `node_modules`

Before publishing, confirm that:
- `CALENDAR_ICS_URL` is only in `.env`
- no secret calendar links appear in commits, screenshots, or documentation

## Notes

- Weather data is pulled from Open-Meteo directly in the browser.
- Calendar data is fetched by the server and exposed locally at `/calendar.ics`.
- If your Google Calendar secret ICS URL is ever exposed, regenerate it in Google Calendar and update your local `.env`.
