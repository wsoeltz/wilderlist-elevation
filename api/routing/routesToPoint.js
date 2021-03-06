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
const {writeRoutesCache, readRoutesCache} = require('./simpleCache');
const mergeSmallSegments = require('./mergeSmallSegments');

const getRoutesToPoint = async (req) => {
  let lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  let lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;
  const altLat = req.query && req.query.alt_lat ? parseFloat(req.query.alt_lat) : undefined;
  const altLng = req.query && req.query.alt_lng ? parseFloat(req.query.alt_lng) : undefined;
  const destinationId = req.query && req.query.destination_id ? req.query.destination_id : undefined;
  const returnSegments = req.query && req.query.segments === 'true' ? true : false;
  const returnRawDataInstead = req.query && req.query.raw === 'true' ? true : false;
  const page = req.query && req.query.page ? parseInt(req.query.page) : 1;
  const minIndex = (page - 1) * 5;
  const maxIndex = page * 5;

  let endLat = lat;
  let endLng = lng;
  if (altLat && altLng && lat && lng) {
    const roads = await getLocalLinestrings(lat, lng, false, true);
    const {nearestPointInNetwork: nearestPointInRoads} = getPathFinder(roads);
    const mainPoint = nearestPointInRoads([lng, lat]);
    const altPoint = nearestPointInRoads([altLng, altLat]);
    if (distance([ lng, lat ], mainPoint) > distance([ altLng, altLat ], altPoint)) {
      lat = altLat;
      lng = altLng;
    } else {
      endLat = altLat;
      endLng = altLng;
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

  const key = `${lat}${lng}${altLat}${altLng}${returnRawDataInstead}${page}${destinationType}${destinationId}`;

  const cached = readRoutesCache(key);
  if (cached && cached.data) {
    return cached.data;
  }

  let output = {};

  if (lat && lng) {
    const onlyUseTrails = destinationType === 'parking' || destinationType === 'mountains';
    const onlyRoads = false;
    const allowLimits = true;

    let destinations;
    if (destinationType === 'campsites') {
      const response = await getNearestCampsites(endLat, endLng);
      destinations = response.slice(minIndex, maxIndex);
    } else if (destinationType === 'mountains') {
      const response = await getNearestMountains(endLat, endLng);
      destinations = response.slice(minIndex, maxIndex);
    } else {
      const response = await getNearestParking(lat, lng);
      destinations = response.slice(minIndex, maxIndex);
    }
    let furthestDistanceInMiles = 1;
    destinations.forEach(d => {
      const distanceFromOrigin = distance([ lng, lat ], d.location, {units: 'miles'});
      if (distanceFromOrigin > furthestDistanceInMiles) {
        furthestDistanceInMiles = distanceFromOrigin;
      }
    });
    const maxDistanceInMiles = furthestDistanceInMiles + 2.5;

    if (destinationId) {
      destinations = destinations.filter(d => destinationId === d._id.toString());
    }

    const geojson = await getLocalLinestrings(lat, lng, onlyUseTrails, onlyRoads, allowLimits, maxDistanceInMiles, returnSegments);

    if (destinations && geojson) {
      if (returnRawDataInstead) {
        return {geojson, destinations};
      }
      const {pathFinder, nearestPointInNetwork, getFilteredNetwork} = getPathFinder(geojson);
      const endPoint = nearestPointInNetwork([lng, lat]);
      const distanceFromActualToGraphPoint = distance([ lng, lat ], endPoint, {units: 'miles'});
      const paths = [];
      if (distanceFromActualToGraphPoint < 0.1) {
        await asyncForEach(destinations, async p => {
          const startPoint = nearestPointInNetwork(p.location);
          if (destinationType === 'parking' || distance(p.location, startPoint, {units: 'miles'}) < 0.15) {
            const path = pathFinder.findPath(startPoint, endPoint);

            if (path && path.path && path.path.length > 1) {
              const line = destinationType !== 'parking' ? path.path.reverse() : path.path;
              const trails = uniqBy(path.edgeDatas.map(({reducedEdge}) => reducedEdge), 'id');
              const trailSegments = [];
              const basePath = lineString(line);
              const totalLength = length(basePath, {units: 'miles'});
              try {
                if (returnSegments) {
                  let currentId = null;
                  const lineStringSegments = [];
                  const nearestPointInFilteredNetwork = getFilteredNetwork(basePath);
                  await asyncForEach(line, async coord => {
                    const nearestPoint = nearestPointInFilteredNetwork(coord);
                    if (nearestPoint && nearestPoint.properties.id) {
                      const id = nearestPoint.properties.id;
                      if (id !== currentId || !lineStringSegments.length) {
                        currentId = id;
                        if (lineStringSegments.length) {
                          // push the last coord to the previous line so that there is overlap
                          lineStringSegments[lineStringSegments.length - 1].geometry.coordinates.push(coord);
                        }
                        lineStringSegments.push({
                          type: 'Feature',
                          properties: {
                            name: nearestPoint.properties.name,
                            type: nearestPoint.properties.type,
                            id,
                            index: lineStringSegments.length,
                            parents: nearestPoint.properties.parents,
                          },
                          geometry: {
                            type: 'LineString',
                            coordinates: [coord],
                          }
                        })
                      } else {
                        lineStringSegments[lineStringSegments.length - 1].geometry.coordinates.push(coord);
                      }
                    }
                  });
                  const validSegments = lineStringSegments.filter(t => t.geometry.coordinates.length > 1);
                  const mergedSegments = mergeSmallSegments(validSegments, totalLength);
                  await asyncForEach(mergedSegments, async p => {
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
                      trailSegments.push({
                        ...p,
                        geometry,
                        properties,
                      })
                    }
                  );
                }
              } catch (err) {
                console.error(err);
              }
              const destination = p;
              paths.push(lineString(line, {trails, destination, trailSegments}));
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

  writeRoutesCache(key, output);
  return output;
}

module.exports = getRoutesToPoint;
