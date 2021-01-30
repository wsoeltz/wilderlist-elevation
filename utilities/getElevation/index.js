const asyncForEach = require('../asyncForEach');
const {TileSet} = require('node-hgt');
const distance = require('@turf/distance').default;
const {point} = require('@turf/helpers');

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

function radiansToDegrees(radians) {
  var pi = Math.PI;
  return radians * (180/pi);
}

function getSlopeAngle([lng1, lat1, ele1], [lng2, lat2, ele2]) {
  // https://www.usgs.gov/science-support/osqi/yes/resources-teachers/determine-percent-slope-and-angle-slope
  // https://www.e-education.psu.edu/natureofgeoinfo/book/export/html/1837
  // SLOPE = arctan(rise / run);
  // elevation change = rise
  // distance = run
  const elevationDiffInFeet = Math.abs(ele1 - ele2);
  const distanceInFeet = distance(
    point([lng1, lat1]),
    point([lng2, lat2]),
    {units: 'kilometers'},
  ) * 3280.84; // convert kilometers to feet
  return radiansToDegrees(Math.atan(elevationDiffInFeet / distanceInFeet));
}


function isOdd(num) { return num % 2;}

const getElevationForLine = async (line, returnIncline, returnMinMax) => {
  const elevationLine = [];
  const allSlopes = [];
  let maxElevation = 0;
  let minElevation = 40000;
  let elevationGain = 0;
  let elevationLoss = 0;
  try {

    await asyncForEach(line, async (point, i) => {
      try {
        const value = await getElevationForPoint(point[1], point[0])
        elevationLine.push([...point, value.elevation]);
        if (returnIncline && isOdd(i) && elevationLine[i].length === 3 && elevationLine[i - 1].length === 3) {
          allSlopes.push(getSlopeAngle(elevationLine[i], elevationLine[i - 1]));
        }
        if (returnMinMax) {
          maxElevation = value.elevation > maxElevation ? value.elevation : maxElevation;
          minElevation = value.elevation < minElevation ? value.elevation : minElevation;
          const elevationDiff = elevationLine[i - 1] ? value.elevation - elevationLine[i - 1][2] : 0;
          if (elevationDiff > 0) {
            elevationGain += elevationDiff;
          } else if (elevationDiff < 0) {
            elevationLoss -= elevationDiff;
          }
        }
      } catch (err) {
        console.error(err);
        return elevationLine.push(point);
      }
    })
  } catch (err) {
    console.error(err);
  }

  const output = {elevationLine};
  if (returnIncline) {
    let total = 0;
    for(let i = 0; i < allSlopes.length; i++) {
        total += allSlopes[i];
    }
    output.averageSlopeAngle = total / allSlopes.length;
    output.maxSlope = Math.max(...allSlopes);
    output.minSlope = Math.min(...allSlopes);
  }
  if (returnMinMax) {
    output.maxElevation = maxElevation;
    output.minElevation = minElevation;
    output.elevationGain = elevationGain;
    output.elevationLoss = elevationLoss;
  }
  return output;
}

module.exports = {
  getElevationForPoint,
  getElevationForLine,
}
