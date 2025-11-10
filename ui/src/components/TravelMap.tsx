import { MapPin } from "lucide-react";
import { useState } from "react";

interface TravelPoint {
  id: number;
  location: string;
  encrypted: string;
  timestamp: string;
  lat: number;
  lng: number;
}

const mockTravelPoints: TravelPoint[] = [
  { id: 1, location: "Paris", encrypted: "0x7f3a...9e2c", timestamp: "2024-03-15", lat: 48.8566, lng: 2.3522 },
  { id: 2, location: "Tokyo", encrypted: "0x9b1e...4d7f", timestamp: "2024-02-20", lat: 35.6762, lng: 139.6503 },
  { id: 3, location: "New York", encrypted: "0x2c4a...8f1b", timestamp: "2024-01-10", lat: 40.7128, lng: -74.0060 },
  { id: 4, location: "London", encrypted: "0x5e6d...3a9c", timestamp: "2023-12-05", lat: 51.5074, lng: -0.1278 },
];

const TravelMap = () => {
  const [selectedPoint, setSelectedPoint] = useState<TravelPoint | null>(null);

  return (
    <section className="py-16 px-4 bg-card/50">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-primary bg-clip-text text-transparent">
          Your Encrypted Journey Map
        </h2>
        
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border bg-card">
          {/* Simplified map visualization */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background opacity-90" />
          
          {/* Travel points */}
          {mockTravelPoints.map((point) => (
            <button
              key={point.id}
              onClick={() => setSelectedPoint(point)}
              className="absolute group transition-all duration-300 hover:scale-125"
              style={{
                left: `${((point.lng + 180) / 360) * 100}%`,
                top: `${((90 - point.lat) / 180) * 100}%`,
              }}
            >
              <div className="relative">
                <MapPin className="w-8 h-8 text-accent drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] animate-pulse" />
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                <div className="bg-card border border-border rounded-lg p-2 whitespace-nowrap shadow-lg">
                  <p className="text-sm font-semibold text-foreground">{point.location}</p>
                  <p className="text-xs text-muted-foreground">{point.timestamp}</p>
                </div>
              </div>
            </button>
          ))}
          
          {/* Connection lines */}
          <svg className="absolute inset-0 pointer-events-none">
            {mockTravelPoints.map((point, index) => {
              if (index === mockTravelPoints.length - 1) return null;
              const nextPoint = mockTravelPoints[index + 1];
              const x1 = ((point.lng + 180) / 360) * 100;
              const y1 = ((90 - point.lat) / 180) * 100;
              const x2 = ((nextPoint.lng + 180) / 360) * 100;
              const y2 = ((90 - nextPoint.lat) / 180) * 100;
              
              return (
                <line
                  key={`line-${point.id}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="hsl(var(--accent))"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.3"
                />
              );
            })}
          </svg>
        </div>

        {/* Selected point details */}
        {selectedPoint && (
          <div className="mt-8 p-6 bg-card border border-border rounded-lg">
            <h3 className="text-xl font-bold mb-4">{selectedPoint.location}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Encrypted Coordinates</p>
                <p className="font-mono text-accent">{selectedPoint.encrypted}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Timestamp</p>
                <p className="font-semibold">{selectedPoint.timestamp}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Verification Status</p>
                <p className="text-accent font-semibold">✓ Verified on Chain</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TravelMap;
