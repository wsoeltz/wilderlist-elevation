const {getWeatherData} = require('../../utilities/getWeather');

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
    const result = await getWeatherData(lat, lng);
    output = {forecast: result, location: [lng, lat]};
  } else {
    output = {error: 'Unable to get weather'};
  }

  return output;
}

module.exports = getWeatherAtPoint;
