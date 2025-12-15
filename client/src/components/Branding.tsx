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
  // Youtube Shorts is an outline "S" shape. We'll do a filled or outline "Z" shape.
  const color = active ? "currentColor" : "currentColor";
  const strokeWidth = active ? 0 : 2;
  const fill = active ? "currentColor" : "none";
  
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth={strokeWidth} xmlns="http://www.w3.org/2000/svg">
       {/* Stylized Z/Tail with a circle (ball) at the end? Or just the Z shape similar to Shorts S */}
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
