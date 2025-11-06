import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

const routeAPIKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZkZDFjZWQzMTIzNTQzN2Y4MDJmZDUyYzRhNGQwNTcxIiwiaCI6Im11cm11cjY0In0=';

// Fix default icon URLs for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
  const [startPos, setStartPos] = useState<[number, number]>([52.3733747, 4.8833205]); // Amsterdam
  const [endPos, setEndPos] = useState<[number, number]>([51.920223, 4.4749919]); // Rotterdam

  const calculateRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${routeAPIKey}&start=${startPos[1]},${startPos[0]}&end=${endPos[1]},${endPos[0]}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features[0]) {
        const coords = data.features[0].geometry.coordinates;
        const routeCoords: [number, number][] = coords.map((coord: number[]) => [coord[1], coord[0]]);
        setRoute(routeCoords);
        
        const summary = data.features[0].properties.summary;
        setDistance(summary.distance / 1000);
        setDuration(summary.duration / 60);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      alert('Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  async function geocodePlace(placeName: string | number | boolean) {
    try {
      const response = await fetch( `https://api.openrouteservice.org/geocode/search?api_key=${routeAPIKey}&text=${encodeURIComponent(placeName)}`);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        return [lat, lon]; // Return as [lat, lon]
      } else {
        throw new Error('Place not found');
      }
    } catch {
      alert("Not valid state")
    }
  }

  return (
    <>
      <div className="route-controls">
        <div className='put-start-location'>
          <h4>Start Location</h4>
          <input
            type="text"
            className="input-start-location"
            placeholder="Enter start location (e.g. Amsterdam)"
            onBlur={async (e) => {
              const coords = await geocodePlace(e.target.value);
              if (coords) setStartPos(coords as [number, number]);
            }}
          />
        </div>

        <div className='put-end-location'>
          <h4>End Location</h4>
          <input
            type="text"
            className="input-end-location"
            placeholder="Enter end location (e.g. Rotterdam)"
            onBlur={async (e) => {
              const coords = await geocodePlace(e.target.value);
              if (coords) setEndPos(coords as [number, number]);
            }}
          />
        </div>

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
          <Marker position={startPos}/>
          <Marker position={endPos} icon={redIcon}/>
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
