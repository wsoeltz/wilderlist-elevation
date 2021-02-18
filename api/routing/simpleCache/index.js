// type Coordinate = [number, number];
// type CoordinateWithElevation = [number, number, number];

// interface Feature {
//   type: 'Feature';
//   properties: {
//     trails: Array<{
//       name?: string | null;
//       type?: string | null;
//       id: string;
//     }>,
//     routeLength: number,
//     elevationGain?: number | null,
//     elevationLoss?: number | null,
//     elevationMin?: number | null,
//     elevationMax?: number | null,
//     avgSlope?: number | null,
//     maxSlope?: number | null,
//     minSlope?: number | null,
//     destination: {
//       _id: string,
//       name?: string | null,
//       type?: string | null,
//       location: [Coordinate],
//     },
//   };
//   geometry: {
//     type: 'LineString',
//     coordinates: CoordinateWithElevation[];
//   };
// }

// interface FeatureCollection {
//   type: 'FeatureCollection';
//   features: Feature[];
// }

const ROUTES_CACHE/*: Array<{key: string, data: FeatureCollection}>*/ = [];

const writeRoutesCache = (key, data) => {
  ROUTES_CACHE.push({
    key: key,
    data,
  });
  if (ROUTES_CACHE.length > 500) {
    ROUTES_CACHE.unshift();
  }
};

const readRoutesCache = (key) => {
  return ROUTES_CACHE.find(d => d.key === key);
};

module.exports = {
  writeRoutesCache,
  readRoutesCache
}
