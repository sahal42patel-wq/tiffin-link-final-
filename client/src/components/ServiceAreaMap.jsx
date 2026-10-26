import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, Layers, CheckCircle2, WifiOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ServiceAreaMap({ 
  kitchenLocation, 
  radiusKm = 5, 
  deliveryMode = 'Radius Based', 
  areas = [], 
  height = '26rem' 
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const circleRef = useRef(null);
  const areaCirclesRef = useRef([]);

  const [mapLayer, setMapLayer] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [isTilesOffline, setIsTilesOffline] = useState(!navigator.onLine);

  const kitchenLat = kitchenLocation?.latitude || 23.0300;
  const kitchenLng = kitchenLocation?.longitude || 72.5650;
  const kitchenName = kitchenLocation?.locality || kitchenLocation?.city || 'Shreeji Kitchen';

  // Connectivity listener for base map tiles
  useEffect(() => {
    const handleOnline = () => setIsTilesOffline(false);
    const handleOffline = () => setIsTilesOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: [kitchenLat, kitchenLng],
        zoom: 12,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Tile Layer based on layer mode
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl = mapLayer === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    tiles.on('tileerror', () => {
      setIsTilesOffline(true);
    });

    tiles.addTo(map);

    // Kitchen Marker (Onyx Black Kitchen Hub)
    const kitchenIcon = L.divIcon({
      className: 'custom-kitchen-marker',
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background: #18181B; 
          color: white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 900; 
          font-size: 14px; 
          box-shadow: 0 4px 14px rgba(24, 24, 27, 0.4); 
          border: 3px solid white;
        ">🍱</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([kitchenLat, kitchenLng], { icon: kitchenIcon })
      .addTo(map)
      .bindPopup(`<b>${kitchenName}</b><br/>Kitchen Delivery Hub`);

    // Remove existing main circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }

    // Main Service Radius Circle
    const radiusMeters = (radiusKm || 5) * 1000;
    const mainCircle = L.circle([kitchenLat, kitchenLng], {
      color: '#18181B',
      fillColor: '#18181B',
      fillOpacity: 0.12,
      weight: 2.5,
      dashArray: deliveryMode === 'Area Based' ? '6, 6' : null
    }).addTo(map);

    circleRef.current = mainCircle;

    // Render area circles for active areas
    areaCirclesRef.current.forEach(c => map.removeLayer(c));
    areaCirclesRef.current = [];

    if (Array.isArray(areas)) {
      areas.forEach((area) => {
        if (area.status === 'ACTIVE' && area.latitude && area.longitude) {
          const areaCircle = L.circle([area.latitude, area.longitude], {
            color: '#3B82F6',
            fillColor: '#60A5FA',
            fillOpacity: 0.15,
            weight: 2
          }).addTo(map);

          areaCircle.bindPopup(`<b>📍 ${area.areaName}</b><br/>${area.radiusKm} km radius (${area.customersCount} customers)`);
          areaCirclesRef.current.push(areaCircle);
        }
      });
    }

    map.setView([kitchenLat, kitchenLng], 12);
  }, [kitchenLat, kitchenLng, radiusKm, deliveryMode, areas, mapLayer]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#E5ECE8] shadow-xs" style={{ height }}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Layer Toggle Control Overlay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-[#E5ECE8] shadow-md">
        <button
          type="button"
          onClick={() => setMapLayer('roadmap')}
          className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
            mapLayer === 'roadmap' ? 'bg-onyx-black text-white shadow-xs' : 'text-[#6B7280] hover:bg-white'
          }`}
        >
          Roadmap
        </button>
        <button
          type="button"
          onClick={() => setMapLayer('satellite')}
          className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
            mapLayer === 'satellite' ? 'bg-onyx-black text-white shadow-xs' : 'text-[#6B7280] hover:bg-white'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Offline Tile Indicator if no internet */}
      {isTilesOffline && (
        <div className="absolute top-3 left-3 z-20 bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-lg shadow-md flex items-center gap-1.5">
          <WifiOff size={13} />
          <span>Offline: Kitchen coordinates active (Tiles require internet)</span>
        </div>
      )}

      {/* Map Information Badge Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E5ECE8] shadow-md flex items-center gap-2 text-xs font-black">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[#111827]">Active Radius: <strong className="text-onyx-black">{radiusKm} KM Zone</strong></span>
      </div>
    </div>
  );
}
