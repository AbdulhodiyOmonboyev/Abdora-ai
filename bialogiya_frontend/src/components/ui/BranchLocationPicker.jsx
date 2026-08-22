import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { LocateFixed } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default marker icon paths break under bundlers like Vite;
// point them at the bundled assets explicitly.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const TASHKENT = { lat: 41.2995, lng: 69.2401 };

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterButton({ position }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (position) map.flyTo([position.lat, position.lng], 16);
      }}
      className="absolute bottom-3 right-3 z-[1000] rounded-lg bg-white dark:bg-gray-800 shadow-md p-2 text-primary hover:bg-gray-50 dark:hover:bg-gray-700"
      title="Tanlangan nuqtaga o'tish"
    >
      <LocateFixed size={16} />
    </button>
  );
}

/**
 * Interactive map for picking a branch's exact location.
 * value: { lat, lng } | null
 * onChange: ({ lat, lng }) => void
 */
export default function BranchLocationPicker({ value, onChange }) {
  const [center] = useState(value?.lat && value?.lng ? value : TASHKENT);

  useEffect(() => {
    // If no location chosen yet, try to center on the user's current
    // location once (purely for map centering, not for setting a value).
    if (!value && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { timeout: 3000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 260 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={value?.lat ? 16 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution="&copy; OpenStreetMap hissa qo'shuvchilari"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {value?.lat && value?.lng && (
          <Marker
            position={[value.lat, value.lng]}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onChange({ lat, lng });
              },
            }}
          />
        )}
        <RecenterButton position={value} />
      </MapContainer>
    </div>
  );
}
