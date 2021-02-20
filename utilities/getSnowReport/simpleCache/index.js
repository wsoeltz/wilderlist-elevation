const SNOW_ICE_FILE_CACHE = [];

const writeSnowAndIceCache = (key, data) => {
  const now = new Date();
  SNOW_ICE_FILE_CACHE.push({
    key: key,
    date: now,
    data,
  });
  if (SNOW_ICE_FILE_CACHE.length > 20) {
    SNOW_ICE_FILE_CACHE.unshift();
  }
};

const MAX_AGE = 6 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds

const readSnowAndIceCache = (key) => {
  const now = new Date();
  return SNOW_ICE_FILE_CACHE.find(d => d.key === key && Math.abs(d.date.getTime() - now.getTime()) < MAX_AGE);
};

module.exports = {
  writeSnowAndIceCache,
  readSnowAndIceCache
}
