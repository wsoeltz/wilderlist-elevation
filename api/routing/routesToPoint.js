const {getLocalLinestrings} = require('../../utilities/getLocalLinestrings');
const getNearestParking = require('../../utilities/getParking');
const PathFinder = require('geojson-path-finder');
const {point, lineString, featureCollection} = require('@turf/helpers');
const explode = require('@turf/explode');
const nearestPoint = require('@turf/nearest-point').default;
const uniqBy = require('lodash/uniqBy');
const getPathFinder = require('../../utilities/getRoutes');
const {getElevationForLine} = require('../../utilities/getElevation');
const asyncForEach = require('../../utilities/asyncForEach');
const distance = require('@turf/distance').default;

const getRoutesToPoint = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;

  let output = {};

  if (lat && lng) {
    const geojson = await getLocalLinestrings(lat, lng, true);
    const parking = await getNearestParking(lat, lng);

    if (parking && geojson) {
      const {pathFinder, nearestPointInNetwork} = getPathFinder(geojson);
      const endPoint = nearestPointInNetwork([lng, lat]);
      const distanceFromActualToGraphPoint = distance([ lng, lat ], endPoint, {units: 'miles'});
      const paths = [];
      if (distanceFromActualToGraphPoint < 0.1) {
        parking.forEach(p => {
          const startPoint = nearestPointInNetwork(p.location);
          const path = pathFinder.findPath(startPoint, endPoint);
          if (path) {
            const trails = uniqBy(path.edgeDatas.map(({reducedEdge}) => reducedEdge), 'id');
            paths.push(lineString(path.path, {trails}));
          }
        });
      }
      const pathsWithElevation = [];
      await asyncForEach(paths, async p => {
          const elevationData = await getElevationForLine(p.geometry.coordinates, true, true);
          const properties = {
            ...p.properties,
            elevation_gain: elevationData.elevationGain,
            elevation_loss: elevationData.elevationLoss,
            elevation_min: elevationData.minElevation,
            elevation_max: elevationData.maxElevation,
            avg_slope: elevationData.averageSlopeAngle,
            max_slope: elevationData.maxSlope,
            min_slope: elevationData.minSlope,
          }
          const geometry = {...p.geometry, coordinates: elevationData.elevationLine}
          pathsWithElevation.push({
            ...p,
            geometry,
            properties,
          })
        }
      );
      output = featureCollection(pathsWithElevation);
    }
  } else {
    output = {error: 'Unable to get routes'};
  }

  return output;
}

module.exports = getRoutesToPoint;
