/**
 * Forward-geocodes a free-text address into { lat, lng } using OpenStreetMap's
 * free Nominatim API, biased toward Uzbekistan. Returns null if nothing
 * useful was found or the request fails.
 */
export async function geocodeAddress(query) {
  const results = await geocodeSuggestions(query, 1);
  return results[0] ? { lat: results[0].lat, lng: results[0].lng } : null;
}

/**
 * Returns up to `limit` address suggestions for the given free-text query,
 * each as { label, lat, lng }, biased toward Uzbekistan. Empty array on
 * no matches or request failure.
 */
export async function geocodeSuggestions(query, limit = 5) {
  const q = String(query || '').trim();
  if (q.length < 4) return [];

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('countrycodes', 'uz');
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'uz,ru,en' },
    });
    if (!res.ok) return [];

    const results = await res.json();
    return (results || []).map((hit) => ({
      label: hit.display_name,
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
    }));
  } catch {
    return [];
  }
}
