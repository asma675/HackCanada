const MAPS_BASE = 'https://maps.googleapis.com/maps/api';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Maps request failed: ${res.status}`);
  }
  return res.json();
}

export async function mapsProxy(body) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is missing');

  const { action } = body;

  if (action === 'nearby') {
    const { lat, lng, radius = 5000, keyword = 'grocery store' } = body;
    const url = `${MAPS_BASE}/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
    return fetchJson(url);
  }

  if (action === 'details') {
    const { place_id } = body;
    const fields = 'name,rating,formatted_address,opening_hours,photos,website,formatted_phone_number';
    const url = `${MAPS_BASE}/place/details/json?place_id=${place_id}&fields=${fields}&key=${apiKey}`;
    return fetchJson(url);
  }

  if (action === 'geocode') {
    const { address } = body;
    const url = `${MAPS_BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    return fetchJson(url);
  }

  throw new Error(`Unsupported map action: ${action}`);
}
