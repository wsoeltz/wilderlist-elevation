const {getLocalLinestrings} = require('../../utilities/getLocalLinestrings');
const getNearestParking = require('../../utilities/getParking');
const PathFinder = require('geojson-path-finder');
const {point, lineString, featureCollection} = require('@turf/helpers');

// interface Input {
//   lat: number;
//   lng: number;
// }

// interface Output {
//  FeatureCollection
// }

const initialPrecision = 0.0003;

const getRoutesToPoint = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;

  let output = {};

  if (lat && lng) {
    const geojson = await getLocalLinestrings(lat, lng);
    const parking = await getNearestParking(lat, lng);

    if (parking && geojson) {
      let pathFinder = new PathFinder(geojson, {
        precision: initialPrecision,
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
        }
      });
      const endPoint = point([lng, lat]);
      const paths = [];
      parking.forEach(p => {
        const startPoint = point(p.location)
        let path = null;
        let attempts = 0;
        while (!path && attempts < 5) {
          path = pathFinder.findPath(startPoint, endPoint);
          if (path) {
            paths.push(lineString(path.path));
            break;
          }
          attempts++;
          pathFinder = new PathFinder(geojson, {
            precision: initialPrecision + (attempts * 0.0002),
          });
        }
        pathFinder = new PathFinder(geojson, { precision: initialPrecision });
      });
      output = featureCollection(paths);
    }
  } else {
    output = {error: 'Unable to get routes'};
  }

  return output;
}

module.exports = getRoutesToPoint;
