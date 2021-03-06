require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

console.log('Attempting to connect to MongoDB');
// Connect to database
require('./database/connect');

const fs = require('fs');
const {TileSet} = require('node-hgt')
const getPointInfo = require('./api/pointInfo');
const getSnowReportNearPoint = require('./api/weather/snowReportNearPoint');
const getLineElevation = require('./api/lineElevation');
const getDirectionsPointToPoint = require('./api/directionsPointToPoint');
const directionsToParking = require('./api/directionsToParking');
const getWeatherAtPoint = require('./api/weather/weatherAtPoint');
const getWeatherAtValley = require('./api/weather/weatherAtValley');
const getLocalLinestrings = require('./api/routing/localLinestrings');
const getLocalParking = require('./api/directionsToParking/localParking');
const getRoutesToPoint = require('./api/routing/routesToPoint');

const tileset = new TileSet(process.env.TILE_PATH);

const app = express();

// create application/json parser
var jsonParser = bodyParser.json({
  parameterLimit: 100000,
  limit: '50mb',
  extended: true
})

app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  // Allow all cors requests on development
  app.use(cors());
} else {
  // var whitelist = [
  //   'https://wilderlist.app',
  //   'http://wilderlist.app',
  //   'https://wwww.wilderlist.app',
  //   'http://wwww.wilderlist.app',
  //   'https://wilderlist-prod.herokuapp.com/',
  //   'http://wilderlist-prod.herokuapp.com/',
  //   'https://wilderlist-dev.herokuapp.com/',
  //   'http://wilderlist-dev.herokuapp.com/',
  //   'http://localhost:3000/',
  //   'http://localhost:5050/',
  // ]
  // var corsOptions = {
  //   origin: function (origin, callback) {
  //     if (whitelist.indexOf(origin) !== -1 || !origin) {
  //       callback(null, true)
  //     } else {
  //       callback(new Error('Not allowed by CORS'))
  //     }
  //   }
  // }
  // app.use(cors(corsOptions));
  app.use(cors());
}

app.get('/', async (req, res) => {
  const testRequest = {
    query: {
      lat: '40.494444',
      lng: '-121.4175',
      state: 'true',
      county: 'true',
      elevation: 'true',
    }
  }
  try {
    const response = await getPointInfo(testRequest);
    res.json({
      server_health: 'healhy',
      ...response,
    });
  } catch (err) {
    res.status(500);
    res.send(err);
  }
});

app.get('/health', async (req, res) => {
  const testRequest = {
    query: {
      lat: '40.494444',
      lng: '-121.4175',
      state: 'true',
      county: 'true',
      elevation: 'true',
    }
  }
  try {
    const response = await getPointInfo(testRequest);
    res.json({
      server_health: 'healhy',
      ...response,
    });
  } catch (err) {
    res.status(500);
    res.send(err);
  }
});


app.get('/api/point-info', async (req, res) => {
  try {
    const response = await getPointInfo(req);
    res.json(response);
  } catch (err) {
    res.status(500);
    res.send(err);
  }
});

app.post('/api/line-elevation', jsonParser, async (req, res) => {
  try {
    const response = await getLineElevation(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/directions-to-point', async (req, res) => {
  try {
    const response = await getDirectionsPointToPoint(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/directions-to-parking', async (req, res) => {
  try {
    const response = await directionsToParking(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/weather-at-point', async (req, res) => {
  try {
    const response = await getWeatherAtPoint(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/weather-at-valley', async (req, res) => {
  try {
    const response = await getWeatherAtValley(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/local-parking', async (req, res) => {
  try {
    const response = await getLocalParking(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/local-linestrings', async (req, res) => {
  try {
    const response = await getLocalLinestrings(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/routes-to-point', async (req, res) => {
  try {
    const response = await getRoutesToPoint(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

app.get('/api/snow-report', async (req, res) => {
  try {
    const response = await getSnowReportNearPoint(req);
    res.json(response);
  } catch (err) {
    console.error(err)
    res.status(500);
    res.send(err);
  }
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
});

if (process.env.NODE_ENV === 'development') {
  const port = 6050;
  app.listen(port, () => {
    // tslint:disable-next-line
    return console.log(`listening on port ${port}`);
  });
}



module.exports = app;
