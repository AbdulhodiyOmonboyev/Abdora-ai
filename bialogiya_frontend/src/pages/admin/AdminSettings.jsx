import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Bot, Shield, Globe } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('platform');
  const [settings, setSettings] = useState({
    platformName: 'Abdora AI',
    defaultLanguage: 'uz',
    aiEnabled: true,
    registrationOpen: false,
    maxGroupSize: 30,
    passingScore: 60,
  });

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', d),
    onSuccess: () => toast.success('Sozlamalar muvaffaqiyatli saqlandi!'),
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const navItems = [
    { id: 'platform', label: 'Platforma', icon: Globe },
    { id: 'ai', label: 'AI Funksiyalari', icon: Bot },
    { id: 'security', label: 'Xavfsizlik & Kirish', icon: Shield },
  ];

  return (
    <div className="dashboard-shell max-w-5xl">
      <PageHeader
        title="Sozlamalar"
        subtitle="Platformaning global parametrlari va AI integratsiyasini boshqarish"
        actions={
          <button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            <Save size={15} /> {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        }
      />

      <div className="settings-shell">
        {/* Settings Navigation */}
        <div className="settings-nav space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`settings-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className={isActive ? 'text-primary' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Panel Content */}
        <div className="space-y-4 min-w-0">
          {activeTab === 'platform' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel-card space-y-5"
            >
              <div>
                <span className="panel-kicker">Asosiy konfiguratsiya</span>
                <h2 className="panel-title">Platforma ma'lumotlari</h2>
                <p className="panel-subtitle">Tizim nomi, standart til va guruh cheklovlari</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Platforma nomi</label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
                    className="input-field"
                    placeholder="Abdora AI"
                  />
                </div>

                <div>
                  <label className="form-label">Standart til</label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings((s) => ({ ...s, defaultLanguage: e.target.value }))}
                    className="input-field"
                  >
                    <option value="uz">O'zbekcha</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Maksimal guruh sig'imi</label>
                    <input
                      type="number"
                      value={settings.maxGroupSize}
                      onChange={(e) => setSettings((s) => ({ ...s, maxGroupSize: +e.target.value }))}
                      className="input-field"
                    />
                    <span className="form-hint">Bitta guruhga biriktiriladigan maksimal o'quvchilar soni</span>
                  </div>

                  <div>
                    <label className="form-label">O'tish bali (%)</label>
                    <input
                      type="number"
                      value={settings.passingScore}
                      onChange={(e) => setSettings((s) => ({ ...s, passingScore: +e.target.value }))}
                      className="input-field"
                    />
                    <span className="form-hint">Testlardan o'tish uchun minimal foiz</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel-card space-y-5"
            >
              <div>
                <span className="panel-kicker">Sun'iy intellekt</span>
                <h2 className="panel-title">AI Generatsiya & Tavsiyalar</h2>
                <p className="panel-subtitle">Darslar, testlar va tahliliy hisobotlar uchun AI modullarini boshqarish</p>
              </div>

              <div className="p-4 rounded-xl space-y-4" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      AI dars & test generatsiyasi
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      O'qituvchilar uchun avtomatik dars rejalari va test savollarini tuzish imkoniyati
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, aiEnabled: !s.aiEnabled }))}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{ backgroundColor: settings.aiEnabled ? 'var(--primary)' : 'var(--border)' }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        settings.aiEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel-card space-y-5"
            >
              <div>
                <span className="panel-kicker">Xavfsizlik</span>
                <h2 className="panel-title">Kirish & Ro'yxatdan o'tish</h2>
                <p className="panel-subtitle">Platformaga yangi foydalanuvchilar qo'shilishi qoidalari</p>
              </div>

              <div className="p-4 rounded-xl space-y-4" style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Ochiq ro'yxatdan o'tish
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Foydalanuvchilar admin taklifsiz mustaqil ro'yxatdan o'ta olishlari
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, registrationOpen: !s.registrationOpen }))}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{ backgroundColor: settings.registrationOpen ? 'var(--primary)' : 'var(--border)' }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        settings.registrationOpen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
