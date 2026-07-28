import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Typography } from 'antd';
import {
  SCOOTER_STATUS_META,
  type Scooter,
  type ScooterStatus,
} from '../api/types';

const STATUS_HEX: Record<ScooterStatus, string> = {
  available: '#52c41a',
  in_use: '#1677ff',
  maintenance: '#fa8c16',
  offline: '#bfbfbf',
};

function buildIcon(status: ScooterStatus, battery: number): L.DivIcon {
  const color = STATUS_HEX[status];
  return L.divIcon({
    className: 'scooter-marker',
    html: `<div class="scooter-marker-pin" style="background:${color}">${battery}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

interface Props {
  scooters: Scooter[];
  onSelect?: (scooter: Scooter) => void;
}

const toNum = (v: number | string): number => Number(v);

export function ScootersMap({ scooters, onSelect }: Props) {
  const center = useMemo<[number, number]>(() => {
    if (scooters.length === 0) {
      return [55.751244, 37.618423];
    }
    const sum = scooters.reduce(
      (acc, s) => [acc[0] + toNum(s.lat), acc[1] + toNum(s.lng)],
      [0, 0],
    );
    return [sum[0] / scooters.length, sum[1] / scooters.length];
  }, [scooters]);

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {scooters.map((s) => {
          const lat = toNum(s.lat);
          const lng = toNum(s.lng);
          return (
          <Marker
            key={s.id}
            position={[lat, lng]}
            icon={buildIcon(s.status, s.batteryLevel)}
            eventHandlers={{
              click: () => onSelect?.(s),
            }}
          >
            <Popup>
              <div>
                <strong>{s.number}</strong> — {s.model}
                <br />
                {SCOOTER_STATUS_META[s.status].label}, заряд {s.batteryLevel}%
                <br />
                <span style={{ fontSize: 11, color: '#888' }}>
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
      {scooters.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(255,255,255,0.9)',
            padding: '4px 8px',
            borderRadius: 4,
            zIndex: 1000,
          }}
        >
          <Typography.Text type="secondary">
            Нет самокатов для отображения
          </Typography.Text>
        </div>
      )}
    </div>
  );
}
