const getNearestParking = require('../../utilities/getParking');
const {getDistanceMatrix} = require('../../utilities/getDirections/manyDirectionsForPoint');
const {getDrivingDistance} = require('../../utilities/getDirections/directionsForPoint');
const distance = require('@turf/distance').default;
const {point} = require('@turf/helpers');

// interface Input {
//   lat1: number;
//   lng1: number;
//   lat2: number;
//   lng2: number;
//   direct?: boolean;
// }

// interface Output {
//   Array<{
//    originName: string;
//    originType: string;
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
  const considerDirect = req.query && req.query.direct && req.query.direct === 'true'  ? true : false;

  let output = [];

  if (considerDirect) {
    const result = await getDrivingDistance(lat1, lng1, lat2, lng2);
    if (result && result.coordinates && result.coordinates[result.coordinates.length - 1]) {
      const distanceToEnd = distance(
        point([lng2, lat2]),
        point(result.coordinates[result.coordinates.length - 1]),
        {units: 'miles'},
      );
      if (distanceToEnd < 0.1) {
        return [
          {
            originName: 'SOURCE',
            originType: 'SOURCE',
            originLat: result.coordinates[result.coordinates.length - 1][1],
            originLng: result.coordinates[result.coordinates.length - 1][0],
            ...result,
          }
        ]
      }
    }
  }

  const parking = await getNearestParking(lat2, lng2);
  if (parking && parking.length) {
    const destinations = parking.map(p => p.location);
    const matrixRespone = await getDistanceMatrix(lat1, lng1, destinations);
    if (matrixRespone) {
      output = matrixRespone.slice(0, 7).map((m, i) => {
        const originName = parking[i] && parking[i].name && parking[i].name.length
          ? parking[i].name
          : (m.returnedName && m.returnedName.length ? m.returnedName : null);
        const originType = parking[i] && parking[i].type && parking[i].type.length
          ? parking[i].type.length
          : null;
        return {
          originName,
          originType,
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
