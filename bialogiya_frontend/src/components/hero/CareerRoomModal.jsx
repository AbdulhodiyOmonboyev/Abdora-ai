import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Award, Shield, Check, Stethoscope, Microscope, Beaker, Briefcase, Cpu, Dna, Laptop } from 'lucide-react';

export default function CareerRoomModal({ isOpen, onClose, hero }) {
  if (!isOpen || !hero) return null;

  const room = hero.room || {};
  const stats = hero.stats || {};
  const raceIcon = hero.raceIcon || '🧑‍⚕️';

  const roomThemes = {
    medical_clinic: {
      title: 'Robotik Jarrohlik & Tibbiyot Markazi',
      icon: '🏥',
      bgGrad: 'from-blue-600/20 via-cyan-500/10 to-transparent',
      items: [
        { id: 'davinci_xi', name: 'da Vinci Xi Robot Tizimi', icon: '🤖', desc: '4 ta robot-qo\'l bilan mikromillimetr darajasidagi jarrohlik' },
        { id: 'mri_3t', name: '3-Tesla MRT Apparati', icon: '🩻', desc: 'Tana to\'qimalari va a\'zolarni 3D skanerlash' },
        { id: 'harmonic_scalpel', name: 'Ultratovush Skalpeli (Harmonic)', icon: '🔪', desc: 'Qonsiz va nozik jarrohlik asbobi' },
        { id: 'stethoscope', name: 'Raqamli Stetoskop', icon: '🩺', desc: 'Yurak va o\'pka tovushlarini AI orqali tahlil qilish' },
      ],
    },
    bio_lab: {
      title: 'Genetika & Biotexnologiya Markazi',
      icon: '🧬',
      bgGrad: 'from-emerald-600/20 via-teal-500/10 to-transparent',
      items: [
        { id: 'crispr_cas9', name: 'CRISPR-Cas9 Fermenti', icon: '✂️', desc: 'DNK zanjiridagi nuqsonlarni nuqtali tahrirlash' },
        { id: 'dna_sequencer', name: 'Illumina DNK Sekvenatori', icon: '🧬', desc: 'To\'liq genom kodlarini yuqori tezlikda o\'qish' },
        { id: 'pcr_cycler', name: 'RT-PCR Amplifikatori', icon: '🧪', desc: 'Genetik namunalarni million martagacha ko\'paytirish' },
        { id: 'cryo_freezer', name: '-80°C Kriogen Muzlatkich', icon: '❄️', desc: 'Noyob hujayra va biomateriallarni muzlatib saqlash' },
      ],
    },
    cyber_lab: {
      title: 'Kiber & AI Texnoparki',
      icon: '💻',
      bgGrad: 'from-purple-600/20 via-indigo-500/10 to-transparent',
      items: [
        { id: 'gpu_cluster', name: 'NVIDIA H100 Klasteri', icon: '⚡', desc: 'Katta sun\'iy intellekt modellarini o\'qitish va hisoblash' },
        { id: 'flipper_zero', name: 'Flipper Zero Radio Analizator', icon: '🐬', desc: 'Radio, RFID va NFC chastotalari xavfsizligini testlash' },
        { id: 'workstation_128', name: '128GB Ish Stansiyasi', icon: '🖥️', desc: 'Ko\'p yadroli og\'ir hisob-kitoblar va simulyatsiya konsoli' },
        { id: 'kali_workstation', name: 'Kali Linux Xavfsizlik Muhiti', icon: '🛡️', desc: 'Axborot xavfsizligi va kiberhujumlarni qaytarish' },
      ],
    },
    smart_farm: {
      title: 'Aqlli Agrobiologiya & Smart Issiqxona',
      icon: '🌾',
      bgGrad: 'from-lime-600/20 via-green-500/10 to-transparent',
      items: [
        { id: 'dji_agras', name: 'DJI Agras Purkagich Droni', icon: '🛸', desc: 'Avtopilot yordamida o\'simliklarni tejamkor oziqlantirish' },
        { id: 'ndvi_camera', name: 'Multispektral NDVI Kamera', icon: '📷', desc: 'O\'simliklarning fotosintez va xlorofill ko\'rsatkichini o\'lchash' },
        { id: 'smart_hydroponics', name: 'Avtomatlashgan Gidroponika', icon: '🌱', desc: 'Tuproqsiz suvli oziqlantirish kompyuter tizimi' },
        { id: 'soil_sensors', name: 'NPK Tuproq Sensorlari', icon: '🧪', desc: 'Azot, fosfor va kaliy minerallarini aniqlash' },
      ],
    },
    aerospace_hangar: {
      title: 'Aviakosmik Angar & Astrobiologiya',
      icon: '🚀',
      bgGrad: 'from-sky-600/20 via-blue-500/10 to-transparent',
      items: [
        { id: 'metal_3d_printer', name: 'Sanoat 3D Metall Printeri', icon: '🖨️', desc: 'Titan va Inconel qotishmalaridan raketa detallarini chiqarish' },
        { id: 'space_telescope', name: 'Fazoviy Teleskop', icon: '🔭', desc: 'Koinotdagi sayyoralar va biosferalarni kuzatish' },
        { id: 'wind_tunnel', name: 'Aerodinamik Sinov Quvuri', icon: '🌪️', desc: 'Tezyurar korpuslarni havo oqimida sinovdan o\'tkazish' },
        { id: 'telemetry_system', name: 'Orbital Telemetriya', icon: '📡', desc: 'Koinot stansiyalari bilan jonli ilmiy aloqa' },
      ],
    },
    neuro_lab: {
      title: 'Neyro-interfeys & Ong Laboratoriyasi',
      icon: '🧠',
      bgGrad: 'from-fuchsia-600/20 via-purple-500/10 to-transparent',
      items: [
        { id: 'bci_headset', name: 'BCI Neyro-interfeys Garniturasi', icon: '🎧', desc: 'Miyadagi elektr signallarini bevosita o\'qish' },
        { id: 'mri_3t', name: '3-Tesla MRT Apparati', icon: '🩻', desc: 'Neyronlar tolalari va asab tizimi 3D xaritasi' },
        { id: 'eeg_sensors', name: 'EEG Yuqori Aniq Elektrodlar', icon: '⚡', desc: 'Miya to\'lqinlarini millisekundda aniqlash' },
        { id: 'dicom_ai', name: 'DICOM AI Tahlil Monitori', icon: '🖥️', desc: 'Miya kasalliklarini sun\'iy intellekt bilan aniqlash' },
      ],
    },
    botanical_garden: {
      title: 'Sehrli Issiqxona & Biosfera Bog\'i',
      icon: '🌿',
      bgGrad: 'from-green-600/20 via-emerald-500/10 to-transparent',
      items: [
        { id: 'flir_drone', name: 'FLIR Termovizorli Dron', icon: '🛸', desc: 'Tabiatdagi harorat va mikroyoriqlarni kuzatish' },
        { id: 'gc_ms_spec', name: 'Gaz Xromatograf (GC-MS)', icon: '🔬', desc: 'Havodagi ifloslantiruvchi moddalarni aniqlash' },
        { id: 'magic_pot', name: 'Sehrli Guldon', icon: '🪴', desc: 'Fotosintez qiluvchi noyob o\'simliklar to\'plami' },
        { id: 'crystal_lamp', name: 'Kristall Chiroq', icon: '💡', desc: 'O\'sishni tezlashtiruvchi fotobiologik nur' },
      ],
    },
  };

  const themeKey = room.theme || 'medical_clinic';
  const currentTheme = roomThemes[themeKey] || roomThemes.medical_clinic;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        className="w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-500 p-1.5 rounded-xl hover:bg-[var(--secondary-background)] z-10"
        >
          <X size={16} />
        </button>

        {/* Room Header Banner */}
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${currentTheme.bgGrad} border border-[var(--border)] mb-4 relative`}>
          <div className="flex items-center gap-3.5">
            <span className="w-14 h-14 rounded-2xl bg-[var(--card)] flex items-center justify-center text-3xl shadow-sm">
              {currentTheme.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[var(--text-primary)]">{currentTheme.title}</h3>
                <span className="badge text-[10px] py-0.5 px-2 bg-primary/20 text-primary font-bold">
                  Level {room.level || 1}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Qahramon: <b>{hero.name}</b> ({hero.raceName || 'Inson Mutaxassis'})
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="p-3 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] text-center">
            <span className="text-xs text-[var(--text-muted)] block">Tushuntirish mahorati</span>
            <span className="text-sm font-bold text-primary">Level {stats.teachingSkill || 1}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] text-center">
            <span className="text-xs text-[var(--text-muted)] block">O'rgatilgan darslar</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {stats.totalTaughtLessons || 0} ta
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] text-center">
            <span className="text-xs text-[var(--text-muted)] block">Fokus darajasi</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {stats.focus || 14} ball
            </span>
          </div>
        </div>

        {/* Room Items / Equipment Grid */}
        <div>
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Real Laboratoriya Jihozlari va Asboblari</span>
            <span className="text-[11px] font-normal text-[var(--text-muted)]">
              Darslarni o'zlashtirganing sari yangi uskunalar ochiladi
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {currentTheme.items.map((item) => {
              const isUnlocked = room.unlockedItems?.includes(item.id) || room.equippedItems?.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    isUnlocked
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-[var(--border)] bg-[var(--secondary-background)] opacity-50'
                  }`}
                >
                  <span className="text-2xl p-1.5 rounded-xl bg-[var(--card)] shadow-xs flex-shrink-0">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[var(--text-primary)]">{item.name}</span>
                      {isUnlocked && (
                        <span className="text-emerald-500 flex items-center gap-0.5 text-[10px] font-semibold">
                          <Check size={11} /> Faol
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary py-2 px-5 rounded-xl text-xs font-semibold"
          >
            Tushundim
          </button>
        </div>
      </motion.div>
    </div>
  );
}
