// Very small in-memory TTL cache for hot endpoints (not shared between instances)
const cache = new Map();

const set = (key, value, ttl = 5000) => {
  const expires = Date.now() + ttl;
  cache.set(key, { value, expires });
};

const get = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const del = (key) => cache.delete(key);

module.exports = { set, get, del };
