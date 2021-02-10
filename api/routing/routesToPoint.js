const {getLocalLinestrings} = require('../../utilities/getLocalLinestrings');
const getNearestParking = require('../../utilities/getParking');
const getNearestCampsites = require('../../utilities/getCampsites');
const PathFinder = require('geojson-path-finder');
const {point, lineString, featureCollection} = require('@turf/helpers');
const explode = require('@turf/explode');
const nearestPoint = require('@turf/nearest-point').default;
const uniqBy = require('lodash/uniqBy');
const getPathFinder = require('../../utilities/getRoutes');
const {getElevationForLine} = require('../../utilities/getElevation');
const asyncForEach = require('../../utilities/asyncForEach');
const distance = require('@turf/distance').default;
const length = require('@turf/length').default;

const getRoutesToPoint = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;
  const campsites = req.query && req.query.destination === 'campsites' ? true : false;

  let output = {};

  if (lat && lng) {
    const geojson = await getLocalLinestrings(lat, lng, !campsites);
    let destinations;
    if (campsites) {
      const response = await getNearestCampsites(lat, lng);
      destinations = response.slice(0, 10);
    } else {
      const response = await getNearestParking(lat, lng);
      destinations = response.slice(0, 10);
    }

    if (destinations && geojson) {
      const {pathFinder, nearestPointInNetwork} = getPathFinder(geojson);
      const endPoint = nearestPointInNetwork([lng, lat]);
      const distanceFromActualToGraphPoint = distance([ lng, lat ], endPoint, {units: 'miles'});
      const paths = [];
      if (distanceFromActualToGraphPoint < 0.1) {
        destinations.forEach(p => {
          const startPoint = nearestPointInNetwork(p.location);
          if (!campsites || distance(p.location, startPoint, {units: 'miles'}) < 0.15) {
            const path = pathFinder.findPath(startPoint, endPoint);
            if (path) {
              const trails = uniqBy(path.edgeDatas.map(({reducedEdge}) => reducedEdge), 'id');
              const destination = p;
              const line = campsites ? path.path.reverse() : path.path;
              paths.push(lineString(path.path, {trails, destination}));
            }
          }
        });
      }
      const pathsWithElevation = [];
      await asyncForEach(paths, async p => {
          const routeLength = length(p, {units: 'miles'});    
          const elevationData = await getElevationForLine(p.geometry.coordinates, true, true);
          const properties = {
            ...p.properties,
            routeLength,
            elevationGain: elevationData.elevationGain,
            elevationLoss: elevationData.elevationLoss,
            elevationMin: elevationData.minElevation,
            elevationMax: elevationData.maxElevation,
            avgSlope: elevationData.averageSlopeAngle,
            maxSlope: elevationData.maxSlope,
            minSlope: elevationData.minSlope,
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
