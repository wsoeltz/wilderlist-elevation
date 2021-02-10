const getNearestParking = require('../../utilities/getParking');
const {featureCollection} = require('@turf/helpers');

const getLocalParking = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;

  const parking = await getNearestParking(lat, lng);

  return featureCollection(parking);
}

module.exports = getLocalParking;
