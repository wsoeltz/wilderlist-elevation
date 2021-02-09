const axios = require('axios');
const {lineString, featureCollection} = require('@turf/helpers');
const {Trail} = require('../../database/models');

/**********
Return up to 9 road objects (center is for current lat/lng and then all surrounding)
□□□
□▣□
□□□
Return 1 additional object from MongoDB containt all trails within 40 miles
**********/

const totalRoadObjects = 9;
const totalTrailObjects = 1;
const totalReturnedObjects = totalRoadObjects + totalTrailObjects;

const getLocalLinestrings = (lat, lng) => {

  return new Promise((resolve, reject) => {
    let returnedObjects = 0;
    const lines = [];

    const fixedLat = parseFloat(lat.toFixed(1));
    const fixedLng = parseFloat(lng.toFixed(1));
    let top = parseFloat(fixedLat + 0.1);
    let left = parseFloat(fixedLng - 0.1);
    for (let i = 0; i < totalRoadObjects; i++) {
      const tileFolder = `LNG__${left.toFixed(1).replace('.', '_')}/`;
      const tileFile = `LAT__${top.toFixed(1).replace('.', '_')}.json`;
      axios.get(process.env.ROADS_BUCKET + tileFolder + tileFile)
        .then(response => {
          if (response && response.data) {
            response.data.forEach(d => lines.push(lineString(d.line, {name: d.name, type: 'road'})))
          }
          returnedObjects++;
          if (returnedObjects === totalReturnedObjects) {
            resolve(featureCollection(lines))
          }
        })
        .catch(error => {
          console.error(error);
          returnedObjects++;
          if (returnedObjects === totalReturnedObjects) {
            resolve(featureCollection(lines))
          }
        });
      left += 0.1;
      if (left > fixedLng + 0.1) {
        left = fixedLng - 0.1;
        top -= 0.1;
      }
    }
    Trail.find({
      center: {
        $nearSphere: {
          $geometry: {
            type : 'Point',
              coordinates : [ lng, lat ],
            },
            $maxDistance: 1609.34 * 12, // meters in a mile * number of miles
          },
       },
    }).then(trails => {
      if (trails) {
        trails.forEach(t => lines.push(lineString(t.line, {name: t.name, type: t.type, id: t._id})))
      }
      returnedObjects++;
      if (returnedObjects === totalReturnedObjects) {
        resolve(featureCollection(lines))
      }
    })
    .catch(error => {
      console.error(error);
      returnedObjects++;
      if (returnedObjects === totalReturnedObjects) {
        resolve(featureCollection(lines))
      }
    });
  });
}

module.exports = {getLocalLinestrings};