/**
 * Shared page shell for every public marketing page (landing, services,
 * documents, contact): white/near-white background in light mode, deep
 * warm-brown in dark mode, the orange brand gradient, subtle grain texture
 * and ambient glow. Keeps every public page visually consistent.
 */
export default function PublicShell({ dark, children }) {
  return (
    <div className={dark ? 'dark' : ''}>
      <div
        className="min-h-screen overflow-x-hidden transition-colors duration-300
          bg-white text-[#2B1B10]
          dark:bg-[#150D07] dark:text-[#FFF3E2]"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
          .display-font { font-family: 'Space Grotesk', system-ui, sans-serif; }
          .abdora-gradient { background: linear-gradient(135deg, #FF7A1A 0%, #FFA94D 100%); }
          .abdora-glow { box-shadow: 0 0 32px rgba(255, 122, 26, 0.35); }
          .abdora-milk { background: #FFFBF4; }
          .dark .abdora-milk { background: rgba(255, 255, 255, 0.04); }
          .abdora-grain {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          }
        `}</style>

        {/* Subtle film-grain texture for warmth */}
        <div className="pointer-events-none fixed inset-0 abdora-grain opacity-[0.02] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-screen" />

        {/* Ambient glow backdrop */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-[#FF7A1A]/10 dark:bg-[#FF7A1A]/20 blur-[120px]" />
          <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-[#FFA94D]/15 dark:bg-[#FFA94D]/15 blur-[120px]" />
        </div>

        {children}
      </div>
    </div>
  );
}
