export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="70" rx="16" fill="#FF0000" />
      <g fill="white">
        <path d="M40 48.5C40 50.5 42.5 52.5 44.5 51.5L62 40.5C64 39.5 64 36.5 62 35.5L44.5 24.5C42.5 23.5 40 25.5 40 27.5V48.5Z" />
        <ellipse cx="32" cy="20" rx="6" ry="8" transform="rotate(-20 32 20)" />
        <ellipse cx="50" cy="14" rx="6" ry="8" />
        <ellipse cx="68" cy="20" rx="6" ry="8" transform="rotate(20 68 20)" />
      </g>
    </svg>
  );
}

export function ZoomiesLogo({ className = "w-6 h-6", active = false }: { className?: string, active?: boolean }) {
  // Outline "Z" shape vs Filled "Z" shape
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
       <path 
         d="M16 3L5 14H13L11 21L20 9H12L16 3Z" 
         fill={active ? "currentColor" : "none"}
         stroke="currentColor"
         strokeWidth={active ? "0" : "1.5"}
         strokeLinejoin="round"
       />
    </svg>
  );
}

export function HomeNavIcon({ className = "w-6 h-6", active = false }: { className?: string, active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      {active ? (
        // Active: Filled
        <path 
          d="M4 10.42V20H10V14H14V20H20V10.42L12 3.3L4 10.42Z" 
          fill="currentColor" 
        />
      ) : (
        // Inactive: Outline
        <path 
          d="M4 10.42V20H10V14H14V20H20V10.42L12 3.3L4 10.42Z" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinejoin="round" 
        />
      )}
    </svg>
  );
}

export function SubscriptionsNavIcon({ className = "w-6 h-6", active = false }: { className?: string, active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      {active ? (
         // Active: Filled
         <path d="M20 6H4V18H20V6ZM20 4C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H20ZM18 2H6V3H18V2Z" fill="currentColor" />
      ) : (
         // Inactive: Outline
         <>
           <path d="M20 6H4V18H20V6ZM20 4C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4H20Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
           <path d="M18 2H6V3H18V2Z" fill="currentColor" />
         </>
      )}
    </svg>
  );
}

export function UploadNavIcon({ className = "w-6 h-6" }: { className?: string }) {
  // Consistent 1.5px stroke
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8V16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12H16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
