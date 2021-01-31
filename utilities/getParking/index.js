const {Parking} = require('../../database/models');
const mongoose = require('mongoose');
const {point, featureCollection} = require('@turf/helpers');
const clustersDbscan = require('@turf/clusters-dbscan').default;
const groupBy = require('lodash/groupBy');
const sortBy = require('lodash/sortBy');

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
  }).limit(30);
  const features = response.map(d => point(d.location, {data: d._doc}));
  const clusters = clustersDbscan(featureCollection(features), 1.207008); // in km, equal to 0.75 mile
  const groupedClusters = groupBy(clusters.features, 'properties.cluster')
  const out = [];
  for (let cluster in groupedClusters) {
    const clusterData = groupedClusters[cluster].map(f => f.properties.data);
    const orderedClusters = sortBy(clusterData, c => {
      if (c.name) {
        return c.length;
      } else {
        if (c.type === 'intersection') { 
          return 0;
        } else {
          return 1;
        }
      }
    })
    out.push(orderedClusters[orderedClusters.length - 1]);
  }
  return out.slice(0, 7);
}

module.exports = getNearestParking;
