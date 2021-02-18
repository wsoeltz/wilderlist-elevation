const ROADS_FILE_CACHE = [];

const writeRoadsCache = (key, data) => {
  ROADS_FILE_CACHE.push({
    key: key,
    data,
  });
  if (ROADS_FILE_CACHE.length > 50) {
    ROADS_FILE_CACHE.unshift();
  }
};

const readRoadsCache = (key) => {
  return ROADS_FILE_CACHE.find(d => d.key === key);
};

module.exports = {
  writeRoadsCache,
  readRoadsCache
}
