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
const getLineElevation = require('./api/lineElevation');


const tileset = new TileSet(process.env.TILE_PATH);

const app = express();

// create application/json parser
var jsonParser = bodyParser.json()

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

app.get('/', (req, res) => {
  try {
    const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
    const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;
    const units = req.query && req.query.units && req.query.units === 'feet' ? 'feet' : 'meters';
    const format = req.query && req.query.format && req.query.format === 'geojson' ? 'geojson' : 'default';

    tileset.getElevation([lat, lng], function(err, elevation) {
      if (err) {
        res.status(500);
        res.json({error: err.message});
        console.log('getElevation failed: ' + err.message);
      } else {
        elevation = units === 'feet' ? elevation * 3.28084 : elevation;
        if (format === 'geojson') {
          res.json({
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [lng, lat, elevation]
            },
            "properties": {}
          });
        } else {
          res.json({lat, lng, elevation});
        }
      }
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
    console.log(err)
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
  app.listen(5000, () => {
    // tslint:disable-next-line
    return console.log(`listening on port 5000`);
  });
}



module.exports = app;
