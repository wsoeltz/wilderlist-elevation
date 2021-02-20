const getSnowReport = require('../../utilities/getSnowReport');

const getSnowReportNearPoint = async (req) => {
  const lat = req.query && req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lng = req.query && req.query.lng ? parseFloat(req.query.lng) : undefined;
  const stateAbbr = req.query && req.query.state_abbr ? req.query.state_abbr : undefined;

  let output = {};

  if (lat && lng && stateAbbr) {
    output = getSnowReport(lat, lng, stateAbbr);
  }

  return output;
}

module.exports = getSnowReportNearPoint;