const axios = require('axios');
const { setupCache } = require('axios-cache-adapter');

const cache = setupCache({
  maxAge: 5 * 24 * 60 * 60 * 1000, // days * hours * minutes * seconds * milliseconds
});

const fetchMapBoxData = axios.create({
  adapter: cache.adapter,
});
const fetchOSRMData = axios.create({
  adapter: cache.adapter,
});

// interface RouteDatum {
//   distance: number;
//   duration: number;
//   geometry: {
//     coordinates: Array<[number, number]>;
//   };
// }

// interface SuccessResponse {
//   data: {
//     routes: RouteDatum[];
//   };
// }

// export interface DrivingData {
//   hours: number;
//   minutes: number;
//   miles: number;
//   coordinates: Array<[number, number]>;
// }

const openStreetMapDirections = async (lat1, lng1, lat2, lng2) => {
  try {
    const response = await fetchOSRMData(
      `//router.project-osrm.org/route/v1/driving/${lng1 + ',' + lat1};${lng2 + ',' + lat2}` +
      '?geometries=geojson&overview=full',
    );
    if (response) {
      return response;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

const mapBoxDirections = async (lat1, lng1, lat2, lng2) => {
  try {
    const response = await fetchMapBoxData(
      /* eslint-disable max-len */
/* tslint:disable:max-line-length */
      `https://api.mapbox.com/directions/v5/mapbox/driving/${lng1},${lat1};${lng2},${lat2}?access_token=${
        process.env.MAPBOX_ACCESS_TOKEN
      }&geometries=geojson&overview=full`,
    );
    if (response) {
      return response;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

const getDrivingDistance = async (lat1, lng1, lat2, lng2) => {
  try {
    let res;
    const openStreetMapResponse = await openStreetMapDirections(lat1, lng1, lat2, lng2);
    if (openStreetMapResponse !== null) {
      res = openStreetMapResponse;
    } else {
      const mapBoxResponse = await mapBoxDirections(lat1, lng1, lat2, lng2);
      if (mapBoxResponse !== null) {
        res = mapBoxResponse;
      } else {
        res = null;
      }
    }
    if (res && res.data && res.data.routes && res.data.routes[0] &&
        res.data.routes[0].distance && res.data.routes[0].duration) {
      const {distance, duration, geometry: {coordinates}} = res.data.routes[0];
      // slight adjustment of duration to account for most people speeding
      const adjustedDuration = duration * 0.84;
      const hours = Math.floor(adjustedDuration / 60 / 60);
      const minutes = Math.round(((adjustedDuration / 60 / 60) - hours) * 60);
      const miles = Math.round(distance * 0.00062137);
      return {hours, minutes, miles, coordinates};
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports = {
  getDrivingDistance,
};
