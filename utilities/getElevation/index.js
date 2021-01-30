const fs = require('fs');
const {TileSet} = require('node-hgt')

const tileset = new TileSet(process.env.TILE_PATH);

const getElevationForPoint = (lat, lng) => {
  return new Promise((resolve, reject) => {
    try {
      tileset.getElevation([lat, lng], function(err, elevation) {
        if (err) {
          return reject(error);
        } else {
          elevation = elevation * 3.28084; // convert elevation to feet
          return resolve({lat, lng, elevation})
        }
      })
    } catch (error) {
      return reject(error);
    }
  })
}

module.exports = {
  getElevationForPoint,
}
