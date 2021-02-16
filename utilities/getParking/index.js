const {Parking} = require('../../database/models');
const clustersDbscan = require('@turf/clusters-dbscan').default;
const distance = require('@turf/distance').default;

const getNearestParking = async (lat, lng) => {
  const response = await Parking.find({
    location: {
        $nearSphere: {
           $geometry: {
              type : 'Point',
              coordinates : [ lng, lat ],
           },
           $maxDistance: 32186, // 20 miles
        },
     },
  }).limit(50);
  const out = [];
  response.forEach(parking => {
    const nearbyNode = out.findIndex(other => distance(other.location, parking.location, {units: 'miles'}) < 0.75);
    if (nearbyNode === -1) {
      out.push(parking);
    } else {
      const distanceThis = distance([ lng, lat ], parking.location);
      const distanceOther = distance([ lng, lat ], out[nearbyNode].location);
      if (distanceThis < distanceOther) {
        out[nearbyNode] = parking;
      }
    }
  })
  return out;
}

module.exports = getNearestParking;