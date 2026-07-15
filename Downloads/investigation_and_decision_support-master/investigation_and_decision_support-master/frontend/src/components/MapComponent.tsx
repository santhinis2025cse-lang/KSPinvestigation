'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MockFIR } from '../utils/mockData';

// Fix Leaflet marker icon issue in Next.js (webpack asset handling)
function fixLeafletIcons() {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  hotspots: any[];
  heatPoints: any[];
  cases: MockFIR[];
}

const MapComponent: React.FC<MapComponentProps> = ({ hotspots, heatPoints, cases }) => {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const centerPosition: [number, number] = [12.9716, 77.5946]; // Bengaluru Center

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return '#EF4444';
      case 'MEDIUM':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  return (
    <MapContainer
      center={centerPosition}
      zoom={12}
      className="w-full h-full"
      zoomControl={true}
      style={{ background: '#08080C' }}
    >
      {/* Dark command-center tile layer using CartoDB Dark Matter */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Render Hotspot density circle overlays */}
      {hotspots.map((h) => (
        <Circle
          key={h.id}
          center={[h.latitude, h.longitude]}
          radius={h.radius}
          pathOptions={{
            color: getRiskColor(h.risk),
            fillColor: getRiskColor(h.risk),
            fillOpacity: 0.15,
            weight: 1.5,
          }}
        >
          <Popup>
            <div style={{ fontSize: '11px', color: '#E2E8F0', background: '#0B0B0F', padding: '6px', borderRadius: '6px', minWidth: '180px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{h.name}</div>
              <div style={{ color: '#94A3B8' }}>
                <div><strong>Risk:</strong> {h.risk}</div>
                <div><strong>Type:</strong> {h.primaryCrime}</div>
                <div><strong>Incidents:</strong> {h.incidents}</div>
              </div>
              <div style={{ color: '#64748B', fontSize: '10px', marginTop: '4px', fontStyle: 'italic' }}>{h.notes}</div>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Render individual case pin markers */}
      {cases.map((c) => (
        <Marker key={c.id} position={[c.latitude, c.longitude]}>
          <Popup>
            <div style={{ fontSize: '11px', color: '#E2E8F0', background: '#0B0B0F', padding: '6px', borderRadius: '6px', maxWidth: '200px' }}>
              <div style={{ fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '2px' }}>{c.firNumber}</div>
              <div style={{ color: '#A78BFA', fontSize: '10px', marginBottom: '4px' }}>{c.category}</div>
              <div style={{ color: '#94A3B8', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.summary}</div>
              <div style={{ color: '#64748B', fontSize: '10px', marginTop: '4px', fontFamily: 'monospace' }}>📍 {c.stationName}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
