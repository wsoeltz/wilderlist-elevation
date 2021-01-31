const {getDrivingDistance} = require('../../utilities/getDirections/directionsForPoint');


// interface Input {
//   lat1: number;
//   lng1: number;
//   lat2: number;
//   lng2: number;
// }

// interface Output {
//   miles: number;
//   hours: number; // in seconds
//   minutes: number; // in seconds
//   coordinates: Coordinate[];
// }

const getDirectionsPointToPoint = async (req) => {
  const lat1 = req.query && req.query.lat1 ? parseFloat(req.query.lat1) : undefined;
  const lng1 = req.query && req.query.lng1 ? parseFloat(req.query.lng1) : undefined;
  const lat2 = req.query && req.query.lat2 ? parseFloat(req.query.lat2) : undefined;
  const lng2 = req.query && req.query.lng2 ? parseFloat(req.query.lng2) : undefined;

  let output = {};

  if (lat1 && lng1 && lat2 && lng2) {
    const result = await getDrivingDistance(lat1, lng1, lat2, lng2);
    output = result;
  } else {
    output = {error: 'Unable to get driving directions'};
  }

  return output;
}

module.exports = getDirectionsPointToPoint;