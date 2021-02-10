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
           $minDistance: 1600,  // 1 mile
        },
     },
  }).limit(15);
  const out = [];
  response.forEach(parking => {
    const nearbyNode = out.find(other => distance(other.location, parking.location, {units: 'miles'}) < 0.25);
    if (!nearbyNode) {
      out.push(parking);
    }
  })
  return out.slice(0, 7);
}

module.exports = getNearestParking;
