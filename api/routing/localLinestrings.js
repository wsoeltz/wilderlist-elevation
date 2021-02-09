const {getLocalLinestrings} = require('../../utilities/getLocalLinestrings');

// interface Input {
//   lat: number;
//   lng: number;
// }

// interface Output {
//  FeatureCollection
// }

const getLineStrings = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;

  let output = {};

  if (lat && lng) {
    const result = await getLocalLinestrings(lat, lng);
    output = result;
  } else {
    output = {error: 'Unable to get local linestrings'};
  }

  return output;
}

module.exports = getLineStrings;
