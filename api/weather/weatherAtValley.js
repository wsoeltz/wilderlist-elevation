const {getWeatherData} = require('../../utilities/getWeather');
const getNearestParking = require('../../utilities/getParking');
const {getElevationForPoint} = require('../../utilities/getElevation');
const asyncForEach = require('../../utilities/asyncForEach');
const sortBy = require('lodash/sortBy');

// interface Input {
//   lat: number;
//   lng: number;
// }

// interface Output {
//  weather report
// }

const getWeatherAtPoint = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;

  let output = {};

  if (lat && lng) {
    const parking = await getNearestParking(lat, lng);
    const parkingWithElevation = [];
    await asyncForEach(parking, async p => {
      const elevationResponse = await getElevationForPoint(p.location[1], p.location[0]);
      parkingWithElevation.push({
        _id: p._id,
        name: p.name,
        type: p.type,
        location: p.location,
        elevation: elevationResponse.elevation,
      })
    });
    const sortedByElevation = sortBy(parkingWithElevation, ['elevation'], ['asc']);
    const location = sortedByElevation.length ? sortedByElevation[0].location : [lng, lat];
    const result = await getWeatherData(...location.reverse());
    output = result;
  } else {
    output = {error: 'Unable to get weather'};
  }

  return output;
}

module.exports = getWeatherAtPoint;
