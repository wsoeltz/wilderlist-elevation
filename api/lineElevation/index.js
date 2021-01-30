const {getElevationForLine} = require('../../utilities/getElevation');
// interface Input {
//   line: Coordinate[];
//   incline: boolean;
//   minMax: boolean;
// }

// interface Output {
//   distance: number;
//   line: CoordinateWithElevation[];
//   avg_slope: number;
//   max_slope: number;
//   min_slope: number;
//   elevation_gain: number;
//   elevation_loss: number;
//   max_elevation: number;
//   min_elevation: number;
// }

const getLineElevation = async (req) => {
  const line = req.body && req.body.line && req.body.line.length ? req.body.line : undefined;
  const returnIncline = req.body && req.body.incline ? true : false;
  const returnMinMax = req.body && req.body.minMax ? true : false;

  const output = {line};

  const elevationData = await getElevationForLine(line, returnIncline, returnMinMax);

  if (elevationData) {
    output.line = elevationData.elevationLine;

    if (returnIncline) {
      output.avg_slope = elevationData.averageSlopeAngle;
      output.max_slope = elevationData.maxSlope;
      output.min_slope = elevationData.minSlope;
    }
    if (returnMinMax) {
      output.elevation_gain = elevationData.elevationGain;
      output.elevation_loss = elevationData.elevationLoss;
      output.elevation_min = elevationData.minElevation;
      output.elevation_max = elevationData.maxElevation;
    }
  }

  return output;
}

module.exports = getLineElevation;