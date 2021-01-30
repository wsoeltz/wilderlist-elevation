const fs = require('fs');
const {point} = require('@turf/helpers');
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const {State} = require('../../database/models');
const {getElevationForPoint} = require('../../utilities/getElevation');

const states = JSON.parse(fs.readFileSync('./assets/us_geojson_census_bureau.json'));
const counties = JSON.parse(fs.readFileSync('./assets/us_geojson_census_2010_counties.json'));

// interface Input {
//   lat: number;
//   lng: number;
//   state: boolean;
//   county: boolean;
//   elevation: boolean;
// }

// interface Output {
//   lat: number;
//   lng: number;
//   state_name: string;
//   state_abbr: string;
//   state_id: string;
//   county: string;
//   elevation: number;
// }

const getPointInfo = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;
  const returnState = req.query && req.query.state && req.query.state === 'true' ? true : false;
  const returnCounty = req.query && req.query.county && req.query.county === 'true'  ? true : false;
  const returnElevation = req.query && req.query.elevation && req.query.elevation === 'true'  ? true : false;

  const geojsonPoint = point([lng, lat]);

  const output = {lat, lng};

  let stateNumber;
  if (returnState || returnCounty) {
    try {
      const state = states.features.find(feature => booleanPointInPolygon(geojsonPoint, feature));
      if (state) {
        output.state_name = state.properties.NAME;
        stateNumber = state.properties.STATE;
        try {
          const stateDocument = await State.findOne({name: output.state_name});
          if (stateDocument) {
            output.state_id = stateDocument._id;
            output.state_abbr = stateDocument.abbreviation;
          }
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (returnCounty) {
    try {
      const county = counties.features
        .filter(feature => feature.properties.STATE === stateNumber)
        .find(feature => booleanPointInPolygon(geojsonPoint, feature));
      if (county) {
        output.county = county.properties.NAME;
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (returnElevation) {
    try {
      const response = await getElevationForPoint(lat, lng);
      if (response) {
        output.elevation = response.elevation;
      }
    } catch (err) {
      console.error(err);
    }
  }


  return output;
}

module.exports = getPointInfo;