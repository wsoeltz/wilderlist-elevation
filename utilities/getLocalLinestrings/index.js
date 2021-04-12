const axios = require('axios');
const {lineString, featureCollection} = require('@turf/helpers');
const {Trail} = require('../../database/models');
const {writeRoadsCache,readRoadsCache} = require('./simpleCache');

/**********
Return up to 9 road objects (center is for current lat/lng and then all surrounding)
□□□
□▣□
□□□
Return 1 additional object from MongoDB contains all trails within range
**********/


const addDensityAndMerge = (lines) => {
  return featureCollection(lines);
}

const getLocalLinestrings = (lat, lng, onlyTrails, onlyRoads, allowLimits, maxMiles, includeParents) => {
  const totalRoadObjects = onlyTrails ? 0 : 1;
  const totalTrailObjects = onlyRoads ? 0 : 1;
  const totalReturnedObjects = totalRoadObjects + totalTrailObjects;
  const maxMeters = maxMiles ? 1609.34 * maxMiles: 1609.34 * 8; // meters in a mile * number of miles

  return new Promise((resolve, reject) => {

    let returnedObjects = 0;
    const lines = [];

    const fixedLat = parseFloat(lat.toFixed(1));
    const fixedLng = parseFloat(lng.toFixed(1));
    // const leftOrRight = Math.round(lng) < lng ? 'right' : 'left';
    // const topOrBottom = Math.round(lat) < lat ? 'top' : 'bottom';
    // console.log(leftOrRight, topOrBottom);
    // let top = topOrBottom === 'top' ? parseFloat(fixedLat + 0.1) : fixedLat;
    let top = fixedLat;
    let left = fixedLng;
    // let left = leftOrRight === 'left' ? parseFloat(fixedLng - 0.1) : fixedLng;
    for (let i = 0; i < totalRoadObjects; i++) {
      const tileFolder = `LNG__${left.toFixed(1).replace('.', '_')}/`;
      const tileFile = `LAT__${top.toFixed(1).replace('.', '_')}.json`;
      const url = process.env.ROADS_BUCKET + tileFolder + tileFile;
      const cached = readRoadsCache(url);
      if (cached && cached.data) {
        if (!(allowLimits && cached.data.length > 7000)) {
          // don't include huge road files for performance if allow limits is on
          cached.data.forEach(d => lines.push(lineString(d.line, {
            name: d.name, type: 'road',
            id: `${d.name}${d.line.length}${d.line[0][0]}${d.line[0][1]}${d.line[d.line.length-1][0]}${d.line[d.line.length - 1][1]}`.trim().toUpperCase(),
          })))
        }
        returnedObjects++;
        if (returnedObjects === totalReturnedObjects) {
          resolve(addDensityAndMerge(lines))
        }
      } else {
        axios.get(url)
          .then(response => {
            if (response && response.data) {
              writeRoadsCache(url, response.data);
              if (!(allowLimits && response.data.length > 7000)) {
                // don't include huge road files for performance if allow limits is on
                response.data.forEach(d => lines.push(lineString(d.line, {
                  name: d.name, type: 'road',
                  id: `${d.name}${d.line.length}${d.line[0][0]}${d.line[0][1]}${d.line[d.line.length-1][0]}${d.line[d.line.length - 1][1]}`.trim().toUpperCase(),
                })))
              }
            }
            returnedObjects++;
            if (returnedObjects === totalReturnedObjects) {
              resolve(addDensityAndMerge(lines))
            }
          })
          .catch(error => {
            console.error(error);
            returnedObjects++;
            if (returnedObjects === totalReturnedObjects) {
              resolve(addDensityAndMerge(lines))
            }
          });
      }
      left += 0.1;
      if (left > fixedLng + 0.1) {
        left = fixedLng - 0.1;
        top -= 0.1;
      }
    }
    if (!onlyRoads) {
      Trail.find({
        center: {
          $nearSphere: {
            $geometry: {
              type : 'Point',
                coordinates : [ lng, lat ],
              },
              $maxDistance: maxMeters,
            },
         },
      })
      .limit(allowLimits ? 7000 : 0)
      .then(trails => {
        if (trails) {
          trails.forEach(t =>
            lines.push(lineString(t.line, {
              name: t.name, type: t.type, id: t._id.toString(),
              parents: includeParents && t.parents && t.parents.length ? t.parents : undefined,
            }))
          )
        }
        returnedObjects++;
        if (returnedObjects === totalReturnedObjects) {
          resolve(addDensityAndMerge(lines))
        }
      })
      .catch(error => {
        console.error(error);
        returnedObjects++;
        if (returnedObjects === totalReturnedObjects) {
          resolve(addDensityAndMerge(lines))
        }
      });
    }
  });
}

module.exports = {getLocalLinestrings};