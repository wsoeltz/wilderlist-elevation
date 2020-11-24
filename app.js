require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const {TileSet} = require('node-hgt')

const tileset = new TileSet(process.env.TILE_PATH);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  try {
    const lat = req.query && req.query.lat ? req.query.lat : undefined;
    const lng = req.query && req.query.lng ? req.query.lng : undefined;
    const units = req.query && req.query.units && req.query.units === 'feet' ? 'feet' : 'meters';

    tileset.getElevation([lat, lng], function(err, elevation) {
      if (err) {
        res.status(500);
        res.json({error: err.message});
        console.log('getElevation failed: ' + err.message);
      } else {
        elevation = units === 'feet' ? elevation * 3.28084 : elevation;
        res.json({lat, lng, elevation});
      }
    });
  } catch (err) {
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
