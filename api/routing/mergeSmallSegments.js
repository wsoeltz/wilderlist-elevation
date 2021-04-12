const length = require('@turf/length').default;
const orderBy = require('lodash/orderBy');
const cleanCoords = require('@turf/clean-coords').default;

/*
interface Segment {
  type: 'Feature',
  properties: {
    name: string | null | undefined,
    type: TrailType,
    id: string | null | undefined,
    parents: string[] | undefined,
  },
  geometry: { type: 'LineString', coordinates: [ [Array], [Array] ] }
}
*/

const mergeSmallSegments = (allSegments, totalLength) => {
  const mergedSegments = [];
  allSegments.forEach(segment => {
    const segmentLength = length(segment, {units: 'miles'});
    if (segmentLength >= 0.1 || (segmentLength / totalLength >= 0.01 && segment.properties.name)) {
      // if segement is long enough count it as its own
      mergedSegments.push({...segment, properties: {...segment.properties, routeLength: segmentLength}})
    } else if (mergedSegments.length && mergedSegments[mergedSegments.length - 1] &&
      mergedSegments[mergedSegments.length - 1].properties.merged === true) {
      // else if segment is not the first small segment, combine it with the last segment
      // TO DO: add all source merged items with length, name, id, and type
      mergedSegments[mergedSegments.length - 1].properties.routeLength += segmentLength;
      mergedSegments[mergedSegments.length - 1].geometry.coordinates.push(...segment.geometry.coordinates);
      mergedSegments[mergedSegments.length - 1].properties.sources.push({...segment.properties, segmentLength});
    } else {
      // else segement is small and first small segment since start or since long segment
      // push it with a merged flag
      mergedSegments.push({
        ...segment,
        properties: {
          ...segment.properties,
          // include a source property
          sources: [{...segment.properties, segmentLength}],
          routeLength: segmentLength, merged: true,
        }});
    }
  })
  const combinedSegements = [];
  while (mergedSegments.length) {
    const segment = mergedSegments.shift();
    if (segment.properties.merged) {
      // if merged small segment
      if (!mergedSegments.length && !combinedSegements.length) {
        // if only element
        // use longest source
        const sources = orderBy(segment.properties.sources, ['segmentLength'], ['desc']);
        // push element
        combinedSegements.push({
          ...segment,
          properties: sources[0], 
        })
      } else if (!combinedSegements.length) {
        // else if first element
        // combine with next element
        const nextSegment = mergedSegments.shift();
        nextSegment.properties.routeLength += segment.properties.routeLength;
        nextSegment.geometry.coordinates = [...segment.geometry.coordinates, ...nextSegment.geometry.coordinates];
        combinedSegements.push(nextSegment);
      } else if (!mergedSegments.length) {
        // else if last element
        // combine with previous element
        combinedSegements[combinedSegements.length - 1].properties.routeLength +=  segment.properties.routeLength;
        combinedSegements[combinedSegements.length - 1].geometry.coordinates.push(...segment.geometry.coordinates);
      } else {
        // else 
        // combine with longer of prev or next
        const prevLength = combinedSegements[combinedSegements.length - 1].properties.routeLength;
        const nextLength = mergedSegments[0].properties.routeLength;
        if (prevLength > nextLength) {
          combinedSegements[combinedSegements.length - 1].properties.routeLength +=  segment.properties.routeLength;
          combinedSegements[combinedSegements.length - 1].geometry.coordinates.push(...segment.geometry.coordinates);
        } else {
          const nextSegment = mergedSegments.shift();
          nextSegment.properties.routeLength += segment.properties.routeLength;
          nextSegment.geometry.coordinates = [...segment.geometry.coordinates, ...nextSegment.geometry.coordinates];
          combinedSegements.push(nextSegment);
        }
      }
    } else {
      // else
      if (combinedSegements[combinedSegements.length - 1] &&
          combinedSegements[combinedSegements.length - 1].properties.id === segment.properties.id) {
        // if prev item has same id
        // combine with prev element
        combinedSegements[combinedSegements.length - 1].properties.routeLength +=  segment.properties.routeLength;
        combinedSegements[combinedSegements.length - 1].geometry.coordinates.push(...segment.geometry.coordinates);
      } else {
        // else
        // push element
        combinedSegements.push(segment);
      }
    }
  }

  const cleanedSegments = [];
  while (combinedSegements.length) {
    const segment = combinedSegements.shift();
    // if first segment
    if (!cleanedSegments.length) {
      //  push segment
      cleanedSegments.push(segment);
    } else {
      // else
      const prev = cleanedSegments.length - 1;
      if (cleanedSegments[prev].properties.id === segment.properties.id ||
          (segment.properties.routeLength < 0.1 &&
            combinedSegements[0] && cleanedSegments[prev].properties.id === combinedSegements[0].properties.id)) {
          // if prev segment and this segment has same id OR if prev segment and next segment have same id and the segment is short
          // merge segments
          cleanedSegments[prev].properties.routeLength +=  segment.properties.routeLength;
          cleanedSegments[prev].geometry.coordinates.push(...segment.geometry.coordinates);
        } else {
        const commonParent = segment.properties.parents && cleanedSegments[prev].properties.parents
          ? segment.properties.parents.find(e => cleanedSegments[prev].properties.parents.includes(e))
          : undefined;
        // else if segments have common parent and same name
        if (commonParent && cleanedSegments[prev].properties.name === segment.properties.name) {
          // merge segments
          // set id to common parent
          cleanedSegments[prev].properties.id =  commonParent;
          cleanedSegments[prev].properties.routeLength +=  segment.properties.routeLength;
          cleanedSegments[prev].geometry.coordinates.push(...segment.geometry.coordinates);
        } else {
          // else
            // push segment
          cleanedSegments.push(segment);
        }
      }
    }
  }
  return cleanedSegments.map(c => cleanCoords(c, {mutate: true}));
}

module.exports = mergeSmallSegments;