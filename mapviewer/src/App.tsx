import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

const routeAPIKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZkZDFjZWQzMTIzNTQzN2Y4MDJmZDUyYzRhNGQwNTcxIiwiaCI6Im11cm11cjY0In0=';

// Fix for default marker icon in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to fit map bounds to route
function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
}

export default function App() {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('driving-car');
  
  const start: [number, number] = [52.3733747, 4.8833205]; // Amsterdam
  const end: [number, number] = [51.920223, 4.4749919]; // Rotterdam

  const calculateRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${routeAPIKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features[0]) {
        const coords = data.features[0].geometry.coordinates;
        // Convert [lon, lat] to [lat, lon] for Leaflet
        const routeCoords: [number, number][] = coords.map((coord: number[]) => [coord[1], coord[0]]);
        setRoute(routeCoords);
        
        const summary = data.features[0].properties.summary;
        setDistance(summary.distance / 1000); // Convert to km
        setDuration(summary.duration / 60); // Convert to minutes
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      alert('Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="route-controls">
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          className="mode-select"
        >
          <option value="driving-car">Car</option>
          <option value="cycling-regular">Bike</option>
          <option value="foot-walking">Walk</option>
        </select>
        <button 
          onClick={calculateRoute} 
          disabled={loading}
          className={`route-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Calculating...' : 'Calculate Route'}
        </button>
        {distance > 0 && (
          <div className="route-info">
            <div><strong>Distance:</strong> {distance.toFixed(2)} km</div>
            <div><strong>Duration:</strong> {duration.toFixed(0)} minutes</div>
          </div>
        )}
      </div>
      
      <div className='map'>
        <MapContainer center={[52.15, 4.65]} zoom={9} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={start}>
            <Popup>Start: Amsterdam</Popup>
          </Marker>
          <Marker position={end}>
            <Popup>End: Rotterdam</Popup>
          </Marker>
          {route.length > 0 && (
            <>
              <Polyline positions={route} color="blue" weight={4} opacity={0.7} />
              <FitBounds coordinates={route} />
            </>
          )}
        </MapContainer>
      </div>
    </>
  );
}