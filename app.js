require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  try {
    const fileName = process.env.TILE_PATH + 'test.json';
    let previous = undefined;
    try {
      const prevJSON = fs.readFileSync(fileName);
      previous = JSON.parse(prevJSON);
    } catch (error) {
      console.error(error)
    }
    const lat = req.query && req.query.lat ? req.query.lat : undefined;
    const lng = req.query && req.query.lng ? req.query.lng : undefined;
    fs.writeFileSync(fileName, JSON.stringify({lat, lng}));
    res.json({lat, lng, previous});
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
