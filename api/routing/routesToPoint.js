const {getLocalLinestrings} = require('../../utilities/getLocalLinestrings');
const getNearestParking = require('../../utilities/getParking');
const getNearestCampsites = require('../../utilities/getCampsites');
const getNearestMountains = require('../../utilities/getMountains');
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
  let lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  let lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;
  const altLat = req.query && req.query.alt_lat ? parseFloat(req.query.alt_lat) : undefined;
  const altLng = req.query && req.query.alt_lng ? parseFloat(req.query.alt_lng) : undefined;

  if (altLat && altLng && lat && lng) {
    const roads = await getLocalLinestrings(lat, lng, false, true);
    const {nearestPointInNetwork: nearestPointInRoads} = getPathFinder(roads);
    const mainPoint = nearestPointInRoads([lng, lat]);
    const altPoint = nearestPointInRoads([altLng, altLat]);
    if (distance([ lng, lat ], mainPoint) > distance([ altLng, altLat ], altPoint)) {
      lat = altLat;
      lng = altLng;
    }
  }

  let destinationType = 'parking';
  if (req.query && req.query.destination) {
    if (req.query.destination === 'campsites') {
      destinationType = 'campsites';
    } else if (req.query.destination === 'mountains') {
      destinationType = 'mountains';
    }
  }

  let output = {};

  if (lat && lng) {
    const geojson = await getLocalLinestrings(lat, lng, destinationType === 'parking');
    let destinations;
    if (destinationType === 'campsites') {
      const response = await getNearestCampsites(lat, lng);
      destinations = response.slice(0, 10);
    } else if (destinationType === 'mountains') {
      const response = await getNearestMountains(lat, lng);
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
          if (destinationType === 'parking' || distance(p.location, startPoint, {units: 'miles'}) < 0.15) {
            const path = pathFinder.findPath(startPoint, endPoint);
            if (path && path.path && path.path.length > 1) {
              const trails = uniqBy(path.edgeDatas.map(({reducedEdge}) => reducedEdge), 'id');
              const destination = p;
              const line = destinationType !== 'parking' ? path.path.reverse() : path.path;
              paths.push(lineString(path.path, {trails, destination}));
              // const destLat = p.location[1];
              // const destLng = p.location[0];
              // const destEle = p.elevation;
              // const name = p.name;
              // paths.push(lineString(path.path, {trails, destination, destLat,destLng,destEle, name}));
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
