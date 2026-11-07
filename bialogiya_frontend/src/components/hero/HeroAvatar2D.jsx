import React from 'react';

/**
 * HeroAvatar2D - Procedural Vector 2D Character Renderer
 * Draws a real 2D stylized illustrated character with:
 * - Dynamic height (bo'y-basti: 140 - 200cm)
 * - Dynamic body build / weight (semizlik/og'irlik: 40 - 120kg)
 * - Race-specific features (Elves, Humans, Cyber, Dragons, Beasts, etc.)
 * - Profession-specific high-tech outfits & gear (Robotic Surgeon, AI Engineer, Geneticist...)
 * - Animated idle breathing / hologram platform
 */
export default function HeroAvatar2D({
  height = 170, // 140 - 200 cm
  weight = 65,  // 40 - 120 kg
  skinTone = '#ffd1b3',
  hairStyle = 'short', // 'short', 'flowing', 'curly', 'fade', 'ponytail'
  hairColor = '#1e293b',
  raceCategory = 'human_civilization',
  raceId = 'race_111_inson_robotik_jarroh',
  dreamJob = 'robotic_surgeon',
  gender = 'neutral',
  size = 360,
  showPedestal = true,
  interactive = false,
}) {
  // Normalize parameters
  const heightFactor = Math.max(0.85, Math.min(1.2, height / 170)); // 0.85 to 1.2
  const bulkFactor = Math.max(0.75, Math.min(1.4, weight / 65));     // 0.75 (slim) to 1.4 (heavy/bulky)

  // Derived dimensions
  const headRadius = 26;
  const torsoWidth = 32 * bulkFactor;
  const torsoHeight = 58 * heightFactor;
  const legHeight = 70 * heightFactor;
  const armThickness = 10 * bulkFactor;
  const shoulderWidth = 54 * bulkFactor;

  // Race feature detection
  const isHuman = raceCategory === 'human_civilization' || raceId?.includes('inson');
  const isElf = raceCategory === 'classic_fantasy' || raceId?.includes('elf');
  const isCyber = raceCategory === 'cyber_scifi' || raceId?.includes('kiber') || raceId?.includes('android') || raceId?.includes('sintetik');
  const isDragon = raceCategory === 'dragon_reptile' || raceId?.includes('ajdaho');
  const isBeast = raceCategory === 'beastfolk' || raceId?.includes('bo\'ri') || raceId?.includes('mushuk') || raceId?.includes('sher');
  const isGoblin = raceCategory === 'orc_goblin' || raceId?.includes('goblin') || raceId?.includes('kobold');
  const isElemental = raceCategory === 'elemental';

  // Skin and accent colors
  let effectiveSkin = skinTone;
  if (isCyber && skinTone === '#ffd1b3') effectiveSkin = '#cfd8dc';
  if (isElf && skinTone === '#ffd1b3') effectiveSkin = '#ffe8df';
  if (isDragon && skinTone === '#ffd1b3') effectiveSkin = '#e07a5f';
  if (isGoblin && skinTone === '#ffd1b3') effectiveSkin = '#81c784';

  // Profession Outfit Palette
  const outfits = {
    robotic_surgeon: {
      primary: '#0284c7',   // Medical Cyan Blue
      secondary: '#f8fafc', // Clean White Coat
      accent: '#38bdf8',    // Cyan Glow
      tool: 'stethoscope',
    },
    doctor: {
      primary: '#0284c7',
      secondary: '#f8fafc',
      accent: '#38bdf8',
      tool: 'stethoscope',
    },
    genetic_engineer: {
      primary: '#059669',   // Bio Emerald
      secondary: '#ecfdf5', // Clean White
      accent: '#34d399',    // Green DNA Glow
      tool: 'dna_helix',
    },
    scientist: {
      primary: '#059669',
      secondary: '#ecfdf5',
      accent: '#34d399',
      tool: 'dna_helix',
    },
    ai_engineer: {
      primary: '#4f46e5',   // Indigo Tech
      secondary: '#0f172a', // Dark Cyber Tech
      accent: '#818cf8',    // Purple/Blue Neon
      tool: 'hologram_hud',
    },
    programmer: {
      primary: '#4f46e5',
      secondary: '#0f172a',
      accent: '#818cf8',
      tool: 'hologram_hud',
    },
    cyber_security: {
      primary: '#0f172a',   // Stealth Charcoal
      secondary: '#334155', // Kevlar Slate
      accent: '#06b6d4',    // Cyan Hacker Glow
      tool: 'shield_deck',
    },
    aerospace_engineer: {
      primary: '#ea580c',   // Astronaut Flight Orange / Navy
      secondary: '#1e293b', // Deep Space Navy
      accent: '#fb923c',    // Solar Gold
      tool: 'telemetry_pad',
    },
    smart_agronomist: {
      primary: '#65a30d',   // Smart Agro Lime
      secondary: '#1c1917', // Earth Utility
      accent: '#a3e635',    // Plant Glow
      tool: 'hover_drone',
    },
    biologist: {
      primary: '#65a30d',
      secondary: '#1c1917',
      accent: '#a3e635',
      tool: 'hover_drone',
    },
    neuroscientist: {
      primary: '#9333ea',   // Neuro Violet
      secondary: '#3b0764', // Deep Violet
      accent: '#c084fc',    // Synapse Glow
      tool: 'bci_crown',
    },
    green_ecologist: {
      primary: '#10b981',   // Clean Earth Green
      secondary: '#064e3b', // Deep Forest
      accent: '#6ee7b7',    // Biosphere Glow
      tool: 'eco_sensor',
    },
    rescue_hero: {
      primary: '#f97316',   // High-Vis Rescue Neon Orange
      secondary: '#18181b', // Heavy-Duty Dark
      accent: '#facc15',    // Reflective Yellow
      tool: 'rescue_gear',
    },
  };

  const outfit = outfits[dreamJob] || outfits.robotic_surgeon;

  // Geometry anchors
  const centerX = 160;
  const groundY = 350;
  const feetY = groundY - 15;
  const crotchY = feetY - legHeight;
  const waistY = crotchY - 8;
  const neckY = waistY - torsoHeight;
  const headCenterY = neckY - headRadius + 4;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size * 1.15 }}>
      <svg
        viewBox="0 0 320 380"
        className="w-full h-full drop-shadow-2xl overflow-visible transition-all duration-300"
      >
        <defs>
          {/* Hologram Stage Gradient */}
          <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={outfit.accent} stopOpacity="0.4" />
            <stop offset="60%" stopColor={outfit.primary} stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Pedestal Metallic Gradient */}
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Outfit Gradients */}
          <linearGradient id="outfitPrimary" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={outfit.primary} />
            <stop offset="100%" stopColor={outfit.secondary} />
          </linearGradient>

          {/* Aura Filter */}
          <filter id="neonAura" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Hologram Platform / Stage */}
        {showPedestal && (
          <g className="pedestal-group">
            {/* Ground Aura Light */}
            <ellipse cx={centerX} cy={groundY} rx={115} ry={32} fill="url(#stageGlow)" />
            {/* Rotating Tech Ring 1 */}
            <ellipse
              cx={centerX}
              cy={groundY}
              rx={92}
              ry={22}
              fill="none"
              stroke={outfit.accent}
              strokeWidth="1.5"
              strokeDasharray="10 8 4 8"
              opacity="0.7"
              className="animate-spin-slow origin-center"
            />
            {/* Inner Ring */}
            <ellipse
              cx={centerX}
              cy={groundY}
              rx={65}
              ry={15}
              fill="url(#pedestalGrad)"
              stroke={outfit.accent}
              strokeWidth="2"
              opacity="0.9"
            />
            {/* Vertical Projection Beams */}
            <line x1={centerX - 50} y1={groundY} x2={centerX - 50} y2={neckY} stroke={outfit.accent} strokeWidth="0.75" strokeDasharray="3 6" opacity="0.25" />
            <line x1={centerX + 50} y1={groundY} x2={centerX + 50} y2={neckY} stroke={outfit.accent} strokeWidth="0.75" strokeDasharray="3 6" opacity="0.25" />
          </g>
        )}

        {/* 2. Character Body Container (with gentle breathing idle animation) */}
        <g className="animate-hero-breathe origin-bottom">
          {/* Back Shadow */}
          <ellipse cx={centerX} cy={feetY + 4} rx={36 * bulkFactor} ry={10} fill="#000000" opacity="0.4" />

          {/* 3. Legs & Shoes */}
          <g id="legs">
            {/* Left Leg */}
            <path
              d={`M ${centerX - 16 * bulkFactor} ${crotchY} 
                 L ${centerX - 18 * bulkFactor} ${feetY - 8} 
                 L ${centerX - 8 * bulkFactor} ${feetY - 8} 
                 L ${centerX - 4 * bulkFactor} ${crotchY} Z`}
              fill={outfit.secondary}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Left Shoe */}
            <path
              d={`M ${centerX - 24 * bulkFactor} ${feetY} 
                 Q ${centerX - 13 * bulkFactor} ${feetY - 10} ${centerX - 6 * bulkFactor} ${feetY} 
                 Q ${centerX - 15 * bulkFactor} ${feetY + 3} ${centerX - 24 * bulkFactor} ${feetY} Z`}
              fill={outfit.primary}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Left Shoe Sole Grip */}
            <line x1={centerX - 22 * bulkFactor} y1={feetY + 1} x2={centerX - 7 * bulkFactor} y2={feetY + 1} stroke={outfit.accent} strokeWidth="1.5" />

            {/* Right Leg */}
            <path
              d={`M ${centerX + 4 * bulkFactor} ${crotchY} 
                 L ${centerX + 8 * bulkFactor} ${feetY - 8} 
                 L ${centerX + 18 * bulkFactor} ${feetY - 8} 
                 L ${centerX + 16 * bulkFactor} ${crotchY} Z`}
              fill={outfit.secondary}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Right Shoe */}
            <path
              d={`M ${centerX + 6 * bulkFactor} ${feetY} 
                 Q ${centerX + 13 * bulkFactor} ${feetY - 10} ${centerX + 24 * bulkFactor} ${feetY} 
                 Q ${centerX + 15 * bulkFactor} ${feetY + 3} ${centerX + 6 * bulkFactor} ${feetY} Z`}
              fill={outfit.primary}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Right Shoe Sole Grip */}
            <line x1={centerX + 7 * bulkFactor} y1={feetY + 1} x2={centerX + 22 * bulkFactor} y2={feetY + 1} stroke={outfit.accent} strokeWidth="1.5" />
          </g>

          {/* 4. Torso & Clothes */}
          <g id="torso">
            {/* Main Torso Block (Responsive to weight / bulk) */}
            <path
              d={`M ${centerX - shoulderWidth / 2} ${neckY + 6}
                 Q ${centerX - torsoWidth} ${neckY + torsoHeight / 2} ${centerX - (torsoWidth * 0.85)} ${waistY}
                 L ${centerX + (torsoWidth * 0.85)} ${waistY}
                 Q ${centerX + torsoWidth} ${neckY + torsoHeight / 2} ${centerX + shoulderWidth / 2} ${neckY + 6}
                 Z`}
              fill="url(#outfitPrimary)"
              stroke="#0f172a"
              strokeWidth="2.5"
            />

            {/* Profession Lab Coat / Tech Vest Overlay */}
            {dreamJob === 'robotic_surgeon' || dreamJob === 'doctor' || dreamJob === 'genetic_engineer' ? (
              // Open White Surgeon / Scientist Coat
              <g>
                {/* Left Lapel */}
                <path
                  d={`M ${centerX - shoulderWidth / 2} ${neckY + 6}
                     L ${centerX - 10} ${neckY + 28}
                     L ${centerX - 12} ${waistY}
                     L ${centerX - (torsoWidth * 0.9)} ${waistY} Z`}
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                {/* Right Lapel */}
                <path
                  d={`M ${centerX + shoulderWidth / 2} ${neckY + 6}
                     L ${centerX + 10} ${neckY + 28}
                     L ${centerX + 12} ${waistY}
                     L ${centerX + (torsoWidth * 0.9)} ${waistY} Z`}
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                {/* ID Badge on Chest */}
                <rect x={centerX - 18 * bulkFactor} y={neckY + 14} width="9" height="12" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={centerX - 16 * bulkFactor} y1={neckY + 18} x2={centerX - 11 * bulkFactor} y2={neckY + 18} stroke="#0284c7" strokeWidth="1.2" />
                {/* Stethoscope Tubing around neck */}
                <path
                  d={`M ${centerX - 12} ${neckY + 6} Q ${centerX} ${neckY + 36} ${centerX + 10} ${neckY + 24}`}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx={centerX + 10} cy={neckY + 24} r="4" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
              </g>
            ) : dreamJob === 'ai_engineer' || dreamJob === 'cyber_security' ? (
              // Cyber Hoodie with Neon Circuit Lines
              <g>
                <path
                  d={`M ${centerX - 8} ${neckY + 8} L ${centerX} ${neckY + 22} L ${centerX + 8} ${neckY + 8}`}
                  fill="none"
                  stroke={outfit.accent}
                  strokeWidth="2"
                />
                {/* Glowing Matrix Circuit line */}
                <path
                  d={`M ${centerX - 14 * bulkFactor} ${neckY + 24} H ${centerX - 6} V ${waistY - 6}`}
                  fill="none"
                  stroke={outfit.accent}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <circle cx={centerX - 14 * bulkFactor} cy={neckY + 24} r="2" fill={outfit.accent} />
              </g>
            ) : dreamJob === 'aerospace_engineer' ? (
              // Astronaut Flight Harness
              <g>
                <line x1={centerX - 14} y1={neckY + 6} x2={centerX - 10} y2={waistY} stroke="#fb923c" strokeWidth="3" />
                <line x1={centerX + 14} y1={neckY + 6} x2={centerX + 10} y2={waistY} stroke="#fb923c" strokeWidth="3" />
                <rect x={centerX - 14} y={neckY + 26} width="28" height="6" fill="#fb923c" rx="1" />
                {/* Mission Patch */}
                <circle cx={centerX - 16 * bulkFactor} cy={neckY + 16} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              </g>
            ) : dreamJob === 'rescue_hero' ? (
              // High-Vis Reflective Strips
              <g>
                <rect x={centerX - (torsoWidth * 0.8)} y={neckY + 18} width={torsoWidth * 1.6} height="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                <rect x={centerX - (torsoWidth * 0.75)} y={waistY - 12} width={torsoWidth * 1.5} height="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              </g>
            ) : (
              // Smart Belt / Utility Pouch
              <rect x={centerX - torsoWidth * 0.85} y={waistY - 6} width={torsoWidth * 1.7} height="7" fill="#1e293b" rx="2" />
            )}

            {/* Belt */}
            <rect x={centerX - (torsoWidth * 0.85)} y={waistY - 5} width={torsoWidth * 1.7} height="6" fill="#0f172a" rx="1" />
            <rect x={centerX - 6} y={waistY - 7} width="12" height="10" fill={outfit.accent} rx="2" stroke="#0f172a" strokeWidth="1" />
          </g>

          {/* 5. Arms & Hands */}
          <g id="arms">
            {/* Left Arm */}
            <path
              d={`M ${centerX - (shoulderWidth / 2) + 2} ${neckY + 8}
                 Q ${centerX - (shoulderWidth / 2) - 14} ${neckY + torsoHeight / 2} ${centerX - (shoulderWidth / 2) - 10} ${waistY + 12}
                 Q ${centerX - (shoulderWidth / 2) - 4} ${waistY + 12} ${centerX - (shoulderWidth / 2) + armThickness} ${neckY + 14} Z`}
              fill={outfit.primary}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Left Hand */}
            <circle cx={centerX - (shoulderWidth / 2) - 10} cy={waistY + 16} r={7 * bulkFactor} fill={effectiveSkin} stroke="#0f172a" strokeWidth="1.5" />

            {/* Right Arm */}
            <path
              d={`M ${centerX + (shoulderWidth / 2) - 2} ${neckY + 8}
                 Q ${centerX + (shoulderWidth / 2) + 14} ${neckY + torsoHeight / 2} ${centerX + (shoulderWidth / 2) + 12} ${waistY + 8}
                 Q ${centerX + (shoulderWidth / 2) + 4} ${waistY + 8} ${centerX + (shoulderWidth / 2) - armThickness} ${neckY + 14} Z`}
              fill={outfit.primary}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Right Hand */}
            <circle cx={centerX + (shoulderWidth / 2) + 12} cy={waistY + 12} r={7 * bulkFactor} fill={effectiveSkin} stroke="#0f172a" strokeWidth="1.5" />

            {/* Held Tool Hologram / Item in Hand */}
            {dreamJob === 'genetic_engineer' || dreamJob === 'scientist' ? (
              // Floating DNA Double Helix Hologram
              <g className="animate-pulse" filter="url(#neonAura)">
                <path d={`M ${centerX + (shoulderWidth / 2) + 12} ${waistY - 8} Q ${centerX + (shoulderWidth / 2) + 22} ${waistY - 14} ${centerX + (shoulderWidth / 2) + 12} ${waistY - 20}`} stroke="#34d399" strokeWidth="2" fill="none" />
                <path d={`M ${centerX + (shoulderWidth / 2) + 22} ${waistY - 8} Q ${centerX + (shoulderWidth / 2) + 12} ${waistY - 14} ${centerX + (shoulderWidth / 2) + 22} ${waistY - 20}`} stroke="#38bdf8" strokeWidth="2" fill="none" />
                <line x1={centerX + (shoulderWidth / 2) + 14} y1={waistY - 11} x2={centerX + (shoulderWidth / 2) + 20} y2={waistY - 11} stroke="#ffffff" strokeWidth="1" />
                <line x1={centerX + (shoulderWidth / 2) + 14} y1={waistY - 17} x2={centerX + (shoulderWidth / 2) + 20} y2={waistY - 17} stroke="#ffffff" strokeWidth="1" />
              </g>
            ) : dreamJob === 'ai_engineer' || dreamJob === 'programmer' ? (
              // Floating Futuristic Terminal HUD
              <g className="animate-pulse">
                <rect x={centerX + (shoulderWidth / 2) + 4} y={waistY - 18} width="26" height="18" rx="3" fill="#0f172a" fillOpacity="0.8" stroke="#818cf8" strokeWidth="1.2" />
                <line x1={centerX + (shoulderWidth / 2) + 8} y1={waistY - 12} x2={centerX + (shoulderWidth / 2) + 24} y2={waistY - 12} stroke="#38bdf8" strokeWidth="1.5" />
                <line x1={centerX + (shoulderWidth / 2) + 8} y1={waistY - 7} x2={centerX + (shoulderWidth / 2) + 18} y2={waistY - 7} stroke="#a855f7" strokeWidth="1.5" />
              </g>
            ) : dreamJob === 'smart_agronomist' ? (
              // Hovering Mini Agro-Drone
              <g className="animate-bounce" style={{ animationDuration: '2s' }}>
                <circle cx={centerX - (shoulderWidth / 2) - 22} cy={waistY - 32} r="8" fill="#1c1917" stroke="#84cc16" strokeWidth="1.5" />
                <line x1={centerX - (shoulderWidth / 2) - 30} y1={waistY - 32} x2={centerX - (shoulderWidth / 2) - 14} y2={waistY - 32} stroke="#a3e635" strokeWidth="2" />
                <circle cx={centerX - (shoulderWidth / 2) - 22} cy={waistY - 32} r="3" fill="#84cc16" />
              </g>
            ) : null}
          </g>

          {/* 6. Head & Face */}
          <g id="head">
            {/* Neck */}
            <rect x={centerX - 7 * bulkFactor} y={neckY} width={14 * bulkFactor} height={12} fill={effectiveSkin} stroke="#0f172a" strokeWidth="1" />

            {/* Race Ears Behind Head (Elves, Goblins, Beastfolk) */}
            {isElf && (
              <g id="elf-ears">
                {/* Left Long Pointy Ear */}
                <path d={`M ${centerX - headRadius + 4} ${headCenterY} Q ${centerX - headRadius - 20} ${headCenterY - 16} ${centerX - headRadius + 2} ${headCenterY - 10}`} fill={effectiveSkin} stroke="#0f172a" strokeWidth="1.5" />
                {/* Right Long Pointy Ear */}
                <path d={`M ${centerX + headRadius - 4} ${headCenterY} Q ${centerX + headRadius + 20} ${headCenterY - 16} ${centerX + headRadius - 2} ${headCenterY - 10}`} fill={effectiveSkin} stroke="#0f172a" strokeWidth="1.5" />
              </g>
            )}
            {isGoblin && (
              <g id="goblin-ears">
                {/* Broad Pointed Goblin Ears */}
                <path d={`M ${centerX - headRadius + 4} ${headCenterY + 4} Q ${centerX - headRadius - 26} ${headCenterY + 8} ${centerX - headRadius + 2} ${headCenterY - 8}`} fill={effectiveSkin} stroke="#0f172a" strokeWidth="1.5" />
                <path d={`M ${centerX + headRadius - 4} ${headCenterY + 4} Q ${centerX + headRadius + 26} ${headCenterY + 8} ${centerX + headRadius - 2} ${headCenterY - 8}`} fill={effectiveSkin} stroke="#0f172a" strokeWidth="1.5" />
              </g>
            )}
            {isDragon && (
              <g id="dragon-horns">
                {/* Left Horn */}
                <path d={`M ${centerX - 14} ${headCenterY - 16} Q ${centerX - 28} ${headCenterY - 36} ${centerX - 36} ${headCenterY - 32} Q ${centerX - 24} ${headCenterY - 22} ${centerX - 8} ${headCenterY - 18}`} fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                {/* Right Horn */}
                <path d={`M ${centerX + 14} ${headCenterY - 16} Q ${centerX + 28} ${headCenterY - 36} ${centerX + 36} ${headCenterY - 32} Q ${centerX + 24} ${headCenterY - 22} ${centerX + 8} ${headCenterY - 18}`} fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
              </g>
            )}
            {isBeast && (
              <g id="beast-ears">
                {/* Animal Wolf/Cat Ears on top */}
                <polygon points={`${centerX - 20},${headCenterY - 16} ${centerX - 24},${headCenterY - 34} ${centerX - 8},${headCenterY - 22}`} fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <polygon points={`${centerX - 19},${headCenterY - 18} ${centerX - 22},${headCenterY - 30} ${centerX - 11},${headCenterY - 22}`} fill="#fb7185" />
                <polygon points={`${centerX + 20},${headCenterY - 16} ${centerX + 24},${headCenterY - 34} ${centerX + 8},${headCenterY - 22}`} fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <polygon points={`${centerX + 19},${headCenterY - 18} ${centerX + 22},${headCenterY - 30} ${centerX + 11},${headCenterY - 22}`} fill="#fb7185" />
              </g>
            )}

            {/* Head Shape */}
            <circle
              cx={centerX}
              cy={headCenterY}
              r={headRadius}
              fill={effectiveSkin}
              stroke="#0f172a"
              strokeWidth="2"
            />

            {/* Standard Ears (Human / Others) */}
            {!isElf && !isGoblin && (
              <g>
                <ellipse cx={centerX - headRadius + 2} cy={headCenterY + 2} rx="4" ry="7" fill={effectiveSkin} stroke="#0f172a" strokeWidth="1" />
                <ellipse cx={centerX + headRadius - 2} cy={headCenterY + 2} rx="4" ry="7" fill={effectiveSkin} stroke="#0f172a" strokeWidth="1" />
              </g>
            )}

            {/* Cyber Implants / Circuit on Face */}
            {isCyber && (
              <g>
                <line x1={centerX - headRadius + 4} y1={headCenterY} x2={centerX - 12} y2={headCenterY + 6} stroke="#06b6d4" strokeWidth="1.5" />
                <circle cx={centerX - 12} cy={headCenterY + 6} r="2" fill="#06b6d4" />
                <line x1={centerX + headRadius - 4} y1={headCenterY} x2={centerX + 12} y2={headCenterY + 6} stroke="#06b6d4" strokeWidth="1.5" />
                <circle cx={centerX + 12} cy={headCenterY + 6} r="2" fill="#06b6d4" />
              </g>
            )}

            {/* Eyes */}
            {isCyber ? (
              // Cyber Neon Eye Visor
              <rect x={centerX - 18} y={headCenterY - 4} width="36" height="8" rx="3" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" filter="url(#neonAura)" />
            ) : (
              // Stylized Animated Expressive Eyes
              <g id="human-eyes">
                {/* Left Eye */}
                <ellipse cx={centerX - 9} cy={headCenterY} rx="4.5" ry="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <circle cx={centerX - 8.5} cy={headCenterY} r="3" fill="#0f172a" />
                <circle cx={centerX - 9.5} cy={headCenterY - 1.5} r="1.2" fill="#ffffff" />
                {/* Left Eyebrow */}
                <path d={`M ${centerX - 15} ${headCenterY - 8} Q ${centerX - 9} ${headCenterY - 11} ${centerX - 3} ${headCenterY - 8}`} stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />

                {/* Right Eye */}
                <ellipse cx={centerX + 9} cy={headCenterY} rx="4.5" ry="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <circle cx={centerX + 8.5} cy={headCenterY} r="3" fill="#0f172a" />
                <circle cx={centerX + 7.5} cy={headCenterY - 1.5} r="1.2" fill="#ffffff" />
                {/* Right Eyebrow */}
                <path d={`M ${centerX + 3} ${headCenterY - 8} Q ${centerX + 9} ${headCenterY - 11} ${centerX + 15} ${headCenterY - 8}`} stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* Smart Glasses option for Doctors, Scientists & Coders */}
            {(dreamJob === 'robotic_surgeon' || dreamJob === 'ai_engineer' || dreamJob === 'genetic_engineer') && !isCyber && (
              <g id="smart-glasses">
                <rect x={centerX - 16} y={headCenterY - 6} width="13" height="11" rx="3" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.2" />
                <rect x={centerX + 3} y={headCenterY - 6} width="13" height="11" rx="3" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1={centerX - 3} y1={headCenterY - 1} x2={centerX + 3} y2={headCenterY - 1} stroke="#38bdf8" strokeWidth="1.2" />
              </g>
            )}

            {/* Nose & Friendly Smile */}
            <path d={`M ${centerX} ${headCenterY + 4} L ${centerX - 1} ${headCenterY + 8} L ${centerX + 2} ${headCenterY + 8}`} stroke="#94a3b8" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d={`M ${centerX - 5} ${headCenterY + 13} Q ${centerX} ${headCenterY + 17} ${centerX + 5} ${headCenterY + 13}`} stroke="#0f172a" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Hair Style */}
            <g id="hair">
              {hairStyle === 'short' && (
                <path
                  d={`M ${centerX - headRadius - 2} ${headCenterY - 2}
                     Q ${centerX - headRadius} ${headCenterY - headRadius - 8} ${centerX} ${headCenterY - headRadius - 8}
                     Q ${centerX + headRadius} ${headCenterY - headRadius - 8} ${centerX + headRadius + 2} ${headCenterY - 2}
                     Q ${centerX + 12} ${headCenterY - 16} ${centerX} ${headCenterY - 12}
                     Q ${centerX - 12} ${headCenterY - 16} ${centerX - headRadius - 2} ${headCenterY - 2} Z`}
                  fill={hairColor}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              )}
              {hairStyle === 'flowing' && (
                <g>
                  {/* Left Long Strand */}
                  <path d={`M ${centerX - headRadius} ${headCenterY - 6} Q ${centerX - headRadius - 10} ${headCenterY + 24} ${centerX - headRadius - 2} ${headCenterY + 42}`} stroke={hairColor} strokeWidth="6" fill="none" strokeLinecap="round" />
                  {/* Right Long Strand */}
                  <path d={`M ${centerX + headRadius} ${headCenterY - 6} Q ${centerX + headRadius + 10} ${headCenterY + 24} ${centerX + headRadius + 2} ${headCenterY + 42}`} stroke={hairColor} strokeWidth="6" fill="none" strokeLinecap="round" />
                  {/* Top */}
                  <path
                    d={`M ${centerX - headRadius - 2} ${headCenterY}
                       Q ${centerX - 10} ${headCenterY - headRadius - 10} ${centerX} ${headCenterY - headRadius - 10}
                       Q ${centerX + 10} ${headCenterY - headRadius - 10} ${centerX + headRadius + 2} ${headCenterY}
                       Q ${centerX} ${headCenterY - 14} ${centerX - headRadius - 2} ${headCenterY} Z`}
                    fill={hairColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                </g>
              )}
              {hairStyle === 'fade' && (
                <path
                  d={`M ${centerX - headRadius + 2} ${headCenterY - 8}
                     Q ${centerX - 8} ${headCenterY - headRadius - 12} ${centerX + 4} ${headCenterY - headRadius - 12}
                     Q ${centerX + headRadius} ${headCenterY - headRadius - 6} ${centerX + headRadius - 2} ${headCenterY - 8}
                     Q ${centerX} ${headCenterY - 16} ${centerX - headRadius + 2} ${headCenterY - 8} Z`}
                  fill={hairColor}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              )}
            </g>

            {/* Headgear Special (Neuroscientist BCI Crown or Doctor Surgical Cap) */}
            {dreamJob === 'neuroscientist' && (
              // BCI Neural Synapse Crown
              <g filter="url(#neonAura)">
                <path d={`M ${centerX - 24} ${headCenterY - 10} Q ${centerX} ${headCenterY - 22} ${centerX + 24} ${headCenterY - 10}`} fill="none" stroke="#c084fc" strokeWidth="2.5" />
                <circle cx={centerX - 16} cy={headCenterY - 14} r="3" fill="#e879f9" />
                <circle cx={centerX} cy={headCenterY - 17} r="3.5" fill="#a855f7" />
                <circle cx={centerX + 16} cy={headCenterY - 14} r="3" fill="#e879f9" />
              </g>
            )}
            {dreamJob === 'aerospace_engineer' && (
              // Astronaut Communicator Headset
              <g>
                <path d={`M ${centerX + headRadius - 2} ${headCenterY + 2} Q ${centerX + 18} ${headCenterY + 18} ${centerX + 8} ${headCenterY + 16}`} fill="none" stroke="#fb923c" strokeWidth="2" />
                <circle cx={centerX + 8} cy={headCenterY + 16} r="2.5" fill="#ea580c" />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
