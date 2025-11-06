import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fix for default marker icon in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function App() {

  return (
    <>
      {/* <div>
        <input id="start" placeholder="Start (lat,lon)" />
        <input id="end" placeholder="End (lat,lon)" />
        <select id="mode">
          <option value="driving-car">Car</option>
          <option value="cycling-regular">Bike</option>
          <option value="foot-walking">Walk</option>
        </select>
        <button id="routeBtn">Calculate Route</button>
      </div> */}
      <div className='map'>
        <MapContainer center={[52.3733747, 4.8833205]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[52.3733747, 4.8833205]}>
            <Popup>This is a free OpenStreetMap marker!</Popup>
          </Marker>
        </MapContainer>
      </div>
    </>
  );
}

export default App;
