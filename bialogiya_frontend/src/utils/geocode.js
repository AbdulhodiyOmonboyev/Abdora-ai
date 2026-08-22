/**
 * Forward-geocodes a free-text address into { lat, lng } using OpenStreetMap's
 * free Nominatim API, biased toward Uzbekistan. Returns null if nothing
 * useful was found or the request fails.
 */
export async function geocodeAddress(query) {
  const q = String(query || '').trim();
  if (q.length < 4) return null;

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'uz');

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'uz,ru,en' },
    });
    if (!res.ok) return null;

    const results = await res.json();
    const hit = results?.[0];
    if (!hit) return null;

    return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
  } catch {
    return null;
  }
}
