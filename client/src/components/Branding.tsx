export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* YouTube-like Container */}
      <rect width="100" height="70" rx="16" fill="#FF0000" />
      
      {/* Paw Print */}
      <g fill="white">
        {/* The "Play" Pad - Triangle pointing right, rounded corners */}
        <path d="M40 48.5C40 50.5 42.5 52.5 44.5 51.5L62 40.5C64 39.5 64 36.5 62 35.5L44.5 24.5C42.5 23.5 40 25.5 40 27.5V48.5Z" />
        
        {/* Toes */}
        <ellipse cx="32" cy="20" rx="6" ry="8" transform="rotate(-20 32 20)" />
        <ellipse cx="50" cy="14" rx="6" ry="8" />
        <ellipse cx="68" cy="20" rx="6" ry="8" transform="rotate(20 68 20)" />
      </g>
    </svg>
  );
}

export function ZoomiesLogo({ className = "w-6 h-6", active = false }: { className?: string, active?: boolean }) {
  // A stylized "Z" shape that looks like a lightning bolt / fast movement
  const color = "currentColor";
  const strokeWidth = active ? 0 : 2;
  const fill = active ? "currentColor" : "none";
  
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth={strokeWidth} xmlns="http://www.w3.org/2000/svg">
       <path 
         d="M16 3L5 14H13L11 21L20 9H12L16 3Z" 
         fill={fill}
         stroke={color}
         strokeWidth={active ? 0 : 2}
         strokeLinejoin="round"
       />
    </svg>
  );
}

export function HomeNavIcon({ className = "w-6 h-6", active = false }: { className?: string, active?: boolean }) {
  const color = "currentColor";
  const strokeWidth = active ? 0 : 2;
  const fill = active ? "currentColor" : "none";

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth={strokeWidth} xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10Z"
        fill={fill}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SubscriptionsNavIcon({ className = "w-6 h-6", active = false }: { className?: string, active?: boolean }) {
  const color = "currentColor";
  const strokeWidth = active ? 0 : 2;
  const fill = active ? "currentColor" : "none";

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth={strokeWidth} xmlns="http://www.w3.org/2000/svg">
      {/* Stack style icon */}
      <path 
        d="M20 6H4V18C4 18.55 4.45 19 5 19H19C19.55 19 20 18.55 20 18V6ZM20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM18 2H6V3H18V2Z"
        fill={active ? "currentColor" : "none"}
        stroke={active ? "none" : "currentColor"}
      />
      {active && <path d="M4 6H20V18H4V6Z" fill="currentColor" />}
    </svg>
  );
}

export function UploadNavIcon({ className = "w-6 h-6" }: { className?: string }) {
  // Always outlined/stroked usually, or filled circle with cutout plus
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8V16" strokeLinecap="round" />
      <path d="M8 12H16" strokeLinecap="round" />
    </svg>
  );
}
