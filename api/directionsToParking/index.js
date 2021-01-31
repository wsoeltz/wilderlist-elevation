const getNearestParking = require('../../utilities/getParking');
const {getDistanceMatrix} = require('../../utilities/getDirections/manyDirectionsForPoint');

// interface Input {
//   lat1: number;
//   lng1: number;
//   lat2: number;
//   lng2: number;
// }

// interface Output {
//   Array<{
//    originName: string;
//    originLat: number;
//    originLng: number;
//    miles: number;
//    hours: number; // in seconds
//    minutes: number; // in seconds
//   }>
// }

const getDirectionsPointToPoint = async (req) => {
  const lat1 = req.query && req.query.lat1 ? parseFloat(req.query.lat1) : undefined;
  const lng1 = req.query && req.query.lng1 ? parseFloat(req.query.lng1) : undefined;
  const lat2 = req.query && req.query.lat2 ? parseFloat(req.query.lat2) : undefined;
  const lng2 = req.query && req.query.lng2 ? parseFloat(req.query.lng2) : undefined;

  let output = [];

  const parking = await getNearestParking(lat2, lng2);
  if (parking && parking.length) {
    const destinations = parking.map(p => p.location);
    const matrixRespone = await getDistanceMatrix(lat1, lng1, destinations);
    if (matrixRespone) {
      output = matrixRespone.map((m, i) => {
        const originName = parking[i] && parking[i].name && parking[i].name.length
          ? parking[i].name
          : (m.returnedName && m.returnedName.length ? m.returnedName : null);
        return {
          originName,
          originLat: parking[i] && parking[i].location ? parking[i].location[1] : 0,
          originLng: parking[i] && parking[i].location ? parking[i].location[0] : 0,
          miles: m.miles,
          hours: m.hours,
          minutes: m.minutes,
        }
      })
    }
  }

  return output;
}

module.exports = getDirectionsPointToPoint;
