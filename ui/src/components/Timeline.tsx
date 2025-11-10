import { Check, Lock } from "lucide-react";

const timelineEvents = [
  { id: 1, title: "Location Encrypted", time: "2 hours ago", verified: true },
  { id: 2, title: "Blockchain Timestamp", time: "2 hours ago", verified: true },
  { id: 3, title: "Journey Verified", time: "1 hour ago", verified: true },
  { id: 4, title: "Proof Generated", time: "30 min ago", verified: true },
];

const Timeline = () => {
  return (
    <footer className="bg-card py-12 px-4 border-t border-border">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Lock className="w-6 h-6 text-accent" />
          <h3 className="text-2xl font-bold text-center">Encrypted Journey Summary Timeline</h3>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 max-w-4xl mx-auto">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="flex items-start gap-3 flex-1">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                event.verified ? 'bg-accent shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-muted'
              }`}>
                {event.verified && <Check className="h-4 w-4 text-accent-foreground" />}
              </div>
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.time}</p>
              </div>
              {index < timelineEvents.length - 1 && (
                <div className="hidden md:block flex-1 h-0.5 bg-gradient-to-r from-accent/50 to-accent/10 mt-4 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Timeline;
