const {getLocalLinestrings} = require('../../utilities/getLocalLinestrings');
const getNearestParking = require('../../utilities/getParking');
const PathFinder = require('geojson-path-finder');
const {point, lineString, featureCollection} = require('@turf/helpers');
const explode = require('@turf/explode');
const nearestPoint = require('@turf/nearest-point').default;
const uniqBy = require('lodash/uniqBy');

const getRoutesToPoint = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;

  let output = {};

  if (lat && lng) {
    const geojson = await getLocalLinestrings(lat, lng);
    const parking = await getNearestParking(lat, lng);

    if (parking && geojson) {
      const graph = explode(geojson);
      const endPoint = nearestPoint(point([lng, lat]), graph);
      let pathFinder = new PathFinder(geojson, {
        weightFn: function(a, b, props) {
            var dx = a[0] - b[0];
            var dy = a[1] - b[1];
            let multiplier = 1;
            if (props.type !== 'road' && props.type !== 'dirtroad') {
              multiplier += 0.1;
            }
            if (props.name) {
              multiplier += 0.1;
            }
            const weight =  Math.sqrt(dx * dx + dy * dy) * multiplier;
            return weight;
        },
        edgeDataReduceFn: function (properties, props) {
          return {
            ...props,
            id: props.id ? props.id : `ROAD ID ${props.name}`.toUpperCase().split(' ').join('_'),
          };
        }
      });
      const paths = [];
      parking.forEach(p => {
        const startPoint = nearestPoint(point(p.location), graph);
        const path = pathFinder.findPath(startPoint, endPoint);
        if (path) {
          const trails = uniqBy(path.edgeDatas.map(({reducedEdge}) => reducedEdge), 'id');
          paths.push(lineString(path.path, {trails}));
        }
      });
      output = featureCollection(paths);
    }
  } else {
    output = {error: 'Unable to get routes'};
  }

  return output;
}

module.exports = getRoutesToPoint;
