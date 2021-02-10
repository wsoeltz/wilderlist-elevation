const {Mountain} = require('../../database/models');
const clustersDbscan = require('@turf/clusters-dbscan').default;
const distance = require('@turf/distance').default;

const getNearestMountains = async (lat, lng) => {
  const response = await Mountain.find({
    location: {
        $nearSphere: {
           $geometry: {
              type : 'Point',
              coordinates : [ lng, lat ],
           },
           $maxDistance: 32186, // 20 miles
        },
     },
  }).limit(10);
  const out = [];
  response.forEach(mountain => {
    const nearbyNode = out.findIndex(other => distance(other.location, mountain.location, {units: 'miles'}) < 0.1);
    if (nearbyNode === -1) {
      out.push(mountain);
    } else {
      const distanceThis = distance([ lng, lat ], mountain.location);
      const distanceOther = distance([ lng, lat ], out[nearbyNode].location);
      if (distanceThis < distanceOther) {
        out[nearbyNode] = mountain;
      }
    }
  })
  return out;
}

module.exports = getNearestMountains;
