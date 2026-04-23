"use client"

export function FantasyBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100">
      <div
        className="fixed inset-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(139, 69, 19, 0.08) 2px,
            rgba(139, 69, 19, 0.08) 4px
          ), repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139, 69, 19, 0.08) 2px,
            rgba(139, 69, 19, 0.08) 4px
          )`,
        }}
      />

      <div
        className="fixed inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #8B4513 1px, transparent 1px),
            linear-gradient(to bottom, #8B4513 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <svg
        className="fixed top-12 right-12 w-40 h-40 opacity-50 pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#8B4513"
        strokeWidth="0.8"
      >
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="35" />
        <circle cx="50" cy="50" r="8" fill="#8B4513" fillOpacity="0.4" />
        <path d="M50 5 L53 45 L50 50 L47 45 Z" fill="#8B4513" fillOpacity="0.6" />
        <path d="M50 95 L53 55 L50 50 L47 55 Z" fill="#8B4513" fillOpacity="0.4" />
        <path d="M5 50 L45 47 L50 50 L45 53 Z" fill="#8B4513" fillOpacity="0.4" />
        <path d="M95 50 L55 47 L50 50 L55 53 Z" fill="#8B4513" fillOpacity="0.4" />
        <path d="M15 15 L46 46 L50 50 L44 46 Z" fill="#8B4513" fillOpacity="0.3" />
        <path d="M85 15 L54 46 L50 50 L56 46 Z" fill="#8B4513" fillOpacity="0.3" />
        <path d="M15 85 L46 54 L50 50 L44 54 Z" fill="#8B4513" fillOpacity="0.3" />
        <path d="M85 85 L54 54 L50 50 L56 54 Z" fill="#8B4513" fillOpacity="0.3" />
        <text x="50" y="3" textAnchor="middle" fontSize="7" fill="#8B4513" fillOpacity="0.7" fontWeight="bold">N</text>
        <text x="50" y="99" textAnchor="middle" fontSize="7" fill="#8B4513" fillOpacity="0.7" fontWeight="bold">S</text>
        <text x="2" y="52" textAnchor="middle" fontSize="7" fill="#8B4513" fillOpacity="0.7" fontWeight="bold">W</text>
        <text x="98" y="52" textAnchor="middle" fontSize="7" fill="#8B4513" fillOpacity="0.7" fontWeight="bold">E</text>
      </svg>

      <svg
        className="fixed top-0 left-0 w-56 h-56 opacity-40 pointer-events-none"
        viewBox="0 0 120 120"
        fill="none"
        stroke="#8B4513"
        strokeWidth="0.9"
      >
        <path d="M10 0 L0 0 L0 10" strokeWidth="1.2" />
        <path d="M10 20 L0 20" strokeWidth="0.8" />
        <path d="M20 10 L20 0" strokeWidth="0.8" />
        <path d="M15 15 Q30 10, 45 15 Q50 20, 45 28 Q30 35, 15 30 Z" fill="#8B4513" fillOpacity="0.15" strokeWidth="0.8" />
        <circle cx="30" cy="30" r="18" strokeWidth="0.8" />
        <circle cx="30" cy="30" r="14" strokeWidth="0.6" />
        <circle cx="30" cy="30" r="10" strokeWidth="0.8" />
        <circle cx="30" cy="30" r="6" fill="#8B4513" fillOpacity="0.25" />
        <path d="M30 22 L36 30 L30 38 L24 30 Z" strokeWidth="0.7" />
        <path d="M30 24 L34 30 L30 36 L26 30 Z" fill="#8B4513" fillOpacity="0.1" />
        <path d="M45 15 Q55 10, 60 18 Q58 25, 50 28" strokeWidth="0.7" />
        <path d="M15 45 Q10 55, 18 60 Q25 58, 28 50" strokeWidth="0.7" />
        <path d="M25 0 L80 0" strokeWidth="0.8" />
        <path d="M25 3 L80 3" strokeWidth="0.6" />
        <circle cx="35" cy="1.5" r="1.5" fill="#8B4513" fillOpacity="0.4" />
        <circle cx="55" cy="1.5" r="1.5" fill="#8B4513" fillOpacity="0.4" />
        <circle cx="75" cy="1.5" r="1.5" fill="#8B4513" fillOpacity="0.4" />
        <path d="M0 25 L0 80" strokeWidth="0.8" />
        <path d="M3 25 L3 80" strokeWidth="0.6" />
        <circle cx="1.5" cy="35" r="1.5" fill="#8B4513" fillOpacity="0.4" />
        <circle cx="1.5" cy="55" r="1.5" fill="#8B4513" fillOpacity="0.4" />
        <circle cx="1.5" cy="75" r="1.5" fill="#8B4513" fillOpacity="0.4" />
        <path d="M8 8 L12 8 M8 8 L8 12" strokeWidth="0.8" />
      </svg>

      <svg
        className="fixed bottom-0 right-0 w-48 h-48 opacity-35 pointer-events-none rotate-180"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#8B4513"
        strokeWidth="0.7"
      >
        <path d="M0 0 Q 40 5, 60 40 Q 70 60, 80 80" />
        <path d="M0 0 Q 25 10, 40 30 Q 50 50, 70 75" />
        <path d="M0 0 L 60 0 Q 50 10, 40 25" />
        <path d="M0 0 L 0 60 Q 10 50, 25 40" />
        <circle cx="25" cy="25" r="10" />
        <circle cx="25" cy="25" r="5" fill="#8B4513" fillOpacity="0.3" />
      </svg>

      <svg
        className="fixed top-0 right-0 w-40 h-40 opacity-30 pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#8B4513"
        strokeWidth="0.7"
      >
        <path d="M100 0 L 50 0 Q 60 10, 65 25" />
        <path d="M100 0 L 100 50 Q 90 40, 75 35" />
        <circle cx="75" cy="25" r="8" />
      </svg>

      <svg
        className="fixed bottom-0 left-0 w-40 h-40 opacity-30 pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#8B4513"
        strokeWidth="0.7"
      >
        <path d="M0 100 L 50 100 Q 40 90, 35 75" />
        <path d="M0 100 L 0 50 Q 10 60, 25 65" />
        <circle cx="25" cy="75" r="8" />
      </svg>

      <svg
        className="fixed left-8 top-1/3 w-20 h-28 opacity-30 pointer-events-none"
        viewBox="0 0 40 50"
        fill="none"
        stroke="#8B4513"
        strokeWidth="0.9"
      >
        <path d="M20 2 L38 10 L38 25 Q38 40, 20 48 Q2 40, 2 25 L2 10 Z" />
        <path d="M20 8 L32 14 L32 24 Q32 35, 20 42 Q8 35, 8 24 L8 14 Z" />
        <path d="M20 15 L20 35" strokeWidth="1.5" />
        <path d="M12 25 L28 25" strokeWidth="1.5" />
      </svg>

      <svg
        className="fixed right-8 top-1/2 -translate-y-1/2 w-16 h-32 opacity-30 pointer-events-none"
        viewBox="0 0 30 60"
        fill="none"
        stroke="#8B4513"
        strokeWidth="0.8"
      >
        <path d="M5 5 Q2 5, 2 10 L2 50 Q2 55, 5 55" />
        <path d="M25 5 Q28 5, 28 10 L28 50 Q28 55, 25 55" />
        <path d="M5 5 L25 5" />
        <path d="M5 55 L25 55" />
        <ellipse cx="5" cy="5" rx="3" ry="2" />
        <ellipse cx="25" cy="5" rx="3" ry="2" />
        <ellipse cx="5" cy="55" rx="3" ry="2" />
        <ellipse cx="25" cy="55" rx="3" ry="2" />
        <line x1="8" y1="15" x2="22" y2="15" strokeWidth="0.5" />
        <line x1="8" y1="22" x2="22" y2="22" strokeWidth="0.5" />
        <line x1="8" y1="29" x2="22" y2="29" strokeWidth="0.5" />
        <line x1="8" y1="36" x2="18" y2="36" strokeWidth="0.5" />
      </svg>

      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-800/60 to-transparent pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-800/60 to-transparent pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
