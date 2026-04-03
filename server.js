const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const config = {
  locationName: process.env.LOCATION_NAME || 'Saint Paul, Minnesota',
  latitude: Number(process.env.LATITUDE || 44.9537),
  longitude: Number(process.env.LONGITUDE || -93.09),
  timezone: process.env.TIMEZONE || 'America/Chicago'
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/config.json', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(config);
});

app.get('/calendar.ics', async (req, res) => {
  const calendarUrl = process.env.CALENDAR_ICS_URL;

  if (!calendarUrl) {
    res.status(500).type('text/plain').send('CALENDAR_ICS_URL is not configured on the server.');
    return;
  }

  try {
    const response = await fetch(calendarUrl, {
      headers: {
        'User-Agent': 'household-kiosk/1.0'
      }
    });

    if (!response.ok) {
      res.status(response.status).type('text/plain').send(`Calendar fetch failed: ${response.status}`);
      return;
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(text);
  } catch (error) {
    console.error('Calendar proxy error:', error);
    res.status(500).type('text/plain').send('Calendar proxy error');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Household kiosk running at http://localhost:${PORT}`);
});
