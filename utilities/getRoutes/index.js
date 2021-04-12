const PathFinder = require('geojson-path-finder');
const {point, featureCollection} = require('@turf/helpers');
const explode = require('@turf/explode');
const nearestPoint = require('@turf/nearest-point').default;
const getBbox = require('@turf/bbox').default;
const bboxPolygon = require('@turf/bbox-polygon').default;
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const {featureEach} = require('@turf/meta');

const getPathFinder = (geojson) => {
  const pathFinder = new PathFinder(geojson, {
    weightFn: function(a, b, props) {
        var dx = a[0] - b[0];
        var dy = a[1] - b[1];
        let multiplier = 1;
        if (props.type !== 'road' && props.type !== 'dirtroad') {
          multiplier -= 0.3;
        }
        if (props.name) {
          multiplier -= 0.3;
        }
        const weight =  Math.sqrt(dx * dx + dy * dy) * multiplier;
        return weight;
    },
    edgeDataReduceFn: function (properties, props) {
      return {
        ...props,
        id: props.id ? props.id : `DEST ID ${props.name}`.toUpperCase().split(' ').join('_'),
      };
    }
  });

  const graph = explode(geojson);
  const nearestPointInNetwork = (coords) => nearestPoint(point(coords), graph);
  const getFilteredNetwork = line => {
    try {
      const bbox = bboxPolygon(getBbox(line));
      const newPoints = [];
      featureEach(graph, function (currentFeature, featureIndex) {
        if (booleanPointInPolygon(currentFeature, bbox)) {
          newPoints.push(currentFeature);
        }
      })
      const newGraph = featureCollection(newPoints);
      return (coords) => nearestPoint(point(coords), newGraph);
    } catch (err) {
      console.error(err);
      return nearestPointInNetwork;
    }
  }

  return {pathFinder, nearestPointInNetwork, getFilteredNetwork};
}

module.exports = getPathFinder;
