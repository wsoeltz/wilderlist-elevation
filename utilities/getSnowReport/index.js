const {
  writeSnowAndIceCache,
  readSnowAndIceCache
} = require('./simpleCache');
const axios = require('axios');
const {point} = require('@turf/helpers');
const distance = require('@turf/distance').default;
const orderBy = require('lodash/orderBy');

const BASE_URL = 'https://www.ncdc.noaa.gov/snow-and-ice/daily-snow/';
const getSnowFallUrl = (state, year, month) => {
  const stringMonth = month < 10 ? `0${month}` : month;
  return `${BASE_URL}${state}-7d-snowfall-${year}${stringMonth}.json`
};
const getSnowDepthUrl = (state, year, month) => {
  const stringMonth = month < 10 ? `0${month}` : month;
  return `${BASE_URL}${state}-snow-depth-${year}${stringMonth}.json`
};

const getStationUrl = id => `https://www.ncdc.noaa.gov/cdo-web/datasets/GHCND/stations/GHCND:${id}/detail`;

const fetchSnowData = async (getUrlFn, originPoint, stateAbbr, today, attempt) => {  
  if (attempt < 3) {
    try {
      const year = today.getFullYear();
      const month = (today.getMonth() + 1); // javascript months start at 0
      const snowFallUrl = getUrlFn(stateAbbr, year, month);
      let data;
      const cached = readSnowAndIceCache(snowFallUrl);
      if (cached) {
        data = cached.data;
      } else {
        const response = await axios.get(snowFallUrl);
        if (response && response.data.data) {
          data = response.data.data;
          writeSnowAndIceCache(snowFallUrl, data);
        }
      }
      const stationsArray = [];
      if (data) {
        for (const id in data) {
          const station = data[id];
          const values = [];
          for (const i in station.values) {
            values.push(station.values[i]);
          }
          const mostRecentValue = values[values.length - 1];
          stationsArray.push({
            ghcnid: station.ghcnid,
            url: getStationUrl(station.ghcnid),
            name: station.station_name,
            county: station.county,
            elevation: station.elev,
            coordinates: [station.lon, station.lat],
            day: values.length,
            month,
            year,
            distance: distance(originPoint, point([station.lon, station.lat]), {units: 'miles'}),
            mostRecentValue,
            hasRecentValue: mostRecentValue !== "M" ? 1 : 0,
          });
        }
      }
      const stationsSortedByDistance = orderBy(stationsArray, ['hasRecentValue', 'distance'], ['desc', 'asc']);
      return stationsSortedByDistance;
    } catch (error) {

      // console.error(error);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth()-1);
      const response = await fetchSnowData(getUrlFn, originPoint, stateAbbr, lastMonth, attempt + 1);
      return response;
    }
  } else {
    return null;
  }

}


const getSnowReport = async (lat, lng, stateAbbr) => {
  const today = new Date();
  const originPoint = point([lng, lat]);
  let snowFall;
  try {
    const response = await fetchSnowData(getSnowFallUrl, originPoint, stateAbbr, today, 0);
    snowFall = response;
  } catch (error) {
    console.error(error);
  }
  let snowDepth;
  try {
    const response = await fetchSnowData(getSnowDepthUrl, originPoint, stateAbbr, today, 0);
    snowDepth = response;
  } catch (error) {
    console.error(error);
  }
  return {snowFall, snowDepth};
}

module.exports = getSnowReport;
