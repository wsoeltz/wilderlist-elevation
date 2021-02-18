const {Campsite} = require('../../database/models');
const clustersDbscan = require('@turf/clusters-dbscan').default;
const distance = require('@turf/distance').default;

const getNearestCampsites = async (lat, lng) => {
  const response = await Campsite.find({
    location: {
        $nearSphere: {
           $geometry: {
              type : 'Point',
              coordinates : [ lng, lat ],
           },
           $maxDistance: 1609.34 * 6.75, // meters in a mile * number of miles
        },
     },
  }).limit(10);
  const out = [];
  response.forEach(campsite => {
    const nearbyNode = out.findIndex(other => distance(other.location, campsite.location, {units: 'miles'}) < 0.1);
    if (nearbyNode === -1) {
      out.push(campsite);
    } else {
      const distanceThis = distance([ lng, lat ], campsite.location);
      const distanceOther = distance([ lng, lat ], out[nearbyNode].location);
      if (distanceThis < distanceOther) {
        out[nearbyNode] = campsite;
      }
    }
  })
  return out;
}

module.exports = getNearestCampsites;
