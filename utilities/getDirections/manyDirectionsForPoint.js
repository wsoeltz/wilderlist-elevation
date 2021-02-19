const axios = require('axios');
const { setupCache } = require('axios-cache-adapter');

const cache = setupCache({
  maxAge: 5 * 24 * 60 * 60 * 1000, // days * hours * minutes * seconds * milliseconds
});

const fetchMapBoxData = axios.create({
  adapter: cache.adapter,
});

const mapBoxDirections = async (lat, lng, destinations) => {
  try {
    const source = `${lng},${lat}`;
    const destString = destinations.map(coord => coord.join(',')).join(';');
    const destCount = destinations.map((_unused, i) => i + 1).join(';')
    const response = await fetchMapBoxData(
      `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${source};${destString}?sources=0&destinations=${
        destCount
      }&access_token=${
        process.env.MAPBOX_ACCESS_TOKEN
      }&annotations=duration,distance`,
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

const getDistanceMatrix = async (lat, lng, destinations) => {
  try {
    const res = await mapBoxDirections(lat, lng, destinations);
    if (res && res.data) {
      const matrix = res.data.durations[0].map((duration, i) => {
        const adjustedDuration = duration * 1;
        let hours = Math.floor(adjustedDuration / 60 / 60);
        let minutes = Math.round(((adjustedDuration / 60 / 60) - hours) * 60);
        if (minutes === 60) {
          hours += 1;
          minutes = 0;
        }
        const distance = res.data.distances[0][i];
        const miles = distance * 0.00062137;
        const returnedName = res.data.destinations[i].name;
        return {hours, minutes, miles, returnedName};
      })
      return matrix;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports = {
  getDistanceMatrix,
};
