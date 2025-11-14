import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './App.css'

const routeAPIKey = import.meta.env.VITE_ROUTE_API_KEY

// Fix default icon URLs for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap()
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [coordinates, map])
  
  return null
}

export default function App() {
  const [route, setRoute] = useState<[number, number][]>([])
  const [distance, setDistance] = useState<number>(0)
  const [duration, setDuration] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('driving-car')
  const [startInput, setStartInput] = useState<string>("")
  const [endInput, setEndInput] = useState<string>("")
  const [startPos, setStartPos] = useState<[number, number] | null>(null)
  const [endPos, setEndPos] = useState<[number, number] | null>(null)
  const [instructions, setInstructions] = useState<any[]>([])

  const calculateRoute = async () => {
    if (!startPos || !endPos) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${routeAPIKey}&start=${startPos[1]},${startPos[0]}&end=${endPos[1]},${endPos[0]}&instructions=true`
      )
      
      const data = await response.json()
      
      if (data.features && data.features[0]) {
        const feature = data.features[0]
        const coords = data.features[0].geometry.coordinates
        const routeCoords: [number, number][] = coords.map((coord: number[]) => [coord[1], coord[0]])
        setRoute(routeCoords)
        
        const summary = feature.properties.summary
        setDistance(summary.distance / 1000)

        const durationInSeconds = summary.duration
        const hours = Math.floor(durationInSeconds / 3600)
        const minutes = Math.ceil((durationInSeconds % 3600) / 60)
  
        setDuration(`${hours > 0 ? hours + " uur " : ""}${minutes} min`)

        const steps = feature.properties.segments?.[0]?.steps || []
        setInstructions(steps)
      }
    } catch (error) {
      console.error('Error fetching route:', error)
      alert('Failed to calculate route. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = (type: "start" | "end") => {
    if (!navigator.geolocation) {
      alert("Geolocatie wordt niet ondersteund door je browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const address = await reverseGeocode(latitude, longitude)
        if (type === "start") {
          setStartPos([latitude, longitude])
          setStartInput(address)
        } else {
          setEndPos([latitude, longitude])
          setEndInput(address)
        }
      },
      (error) => {
        console.error(error)
        alert("Kan locatie niet ophalen")
      },
      { enableHighAccuracy: true }
    )
  }

  async function reverseGeocode(lat: number, lon: number) {
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/geocode/reverse?api_key=${routeAPIKey}&point.lat=${lat}&point.lon=${lon}`
      )
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        return data.features[0].properties.label
      }
      return ''
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return ''
    }
  }

  async function geocodePlace(placeName: string | number | boolean) {
    try {
      const response = await fetch( `https://api.openrouteservice.org/geocode/search?api_key=${routeAPIKey}&text=${encodeURIComponent(placeName)}`)
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates
        return [lat, lon] // Return as [lat, lon]
      } else {
        throw new Error('Place not found')
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
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onBlur={async () => {
              const coords = await geocodePlace(startInput)
              if (coords) setStartPos(coords as [number, number])
            }}
          />
          <button onClick={() => getUserLocation("start")}>Haal mijn locatie op</button>
        </div>

        <div className='put-end-location'>
          <h4>End Location</h4>
          <input
            type="text"
            className="input-end-location"
            placeholder="Enter end location (e.g. Rotterdam)"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            onBlur={async () => {
              const coords = await geocodePlace(endInput)
              if (coords) setEndPos(coords as [number, number])
            }}
          />
          <button onClick={() => getUserLocation("end")}>Haal mijn locatie op</button>
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
          disabled={loading || !startPos || !endPos}
          className={`route-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Calculating...' : 'Calculate Route'}
        </button>

        {distance > 0 && (
          <div className="route-info">
            <div><strong>Distance:</strong> {distance.toFixed(2)} km</div>
            <div><strong>Duration:</strong> {duration}</div>
          </div>
        )}

        {instructions.length > 0 && (
          <div className="instructions-block">
            <h3>Turn-by-Turn Directions</h3>
            <ul>
              {instructions.map((step, index) => (
                <li key={index}>
                  <span className="step-number">{index + 1}.</span> {step.instruction}
                  <span className="step-distance">({(step.distance / 1000).toFixed(2)} km)</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className='map'>
        <MapContainer center={[52.15, 4.65]} zoom={9} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          { startPos && (
            <Marker position={startPos}>
              <Popup>Start</Popup>
            </Marker>
          )}
          { endPos && (
            <Marker position={endPos} icon={redIcon}>
              <Popup>End</Popup>
            </Marker>
          )}
          {route.length > 0 && (
            <>
              <Polyline positions={route} color="blue" weight={4} opacity={0.7} />
              <FitBounds coordinates={route} />
            </>
          )}
        </MapContainer>
      </div>
    </>
  )
}
