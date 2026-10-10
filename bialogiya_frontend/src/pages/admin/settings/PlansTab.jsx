import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Plus, Check, Pencil, Trash2, Shield, Sparkles,
  Bot, Smartphone, Users, GitBranch, Calendar, AlertTriangle,
  Clock, CheckCircle2, XCircle, RefreshCw, Layers
} from 'lucide-react';
import api from '../../../config/axios';
import toast from 'react-hot-toast';

const EMPTY_PLAN_FORM = {
  name: '',
  description: '',
  price: 199000,
  currency: 'UZS',
  trialDays: 7,
  aiEnabled: false,
  aiProvider: 'gemini',
  aiModel: 'gemini-1.5-flash',
  aiMonthlyTokenLimit: 500000,
  aiMonthlyRequestLimit: 1000,
  smsEnabled: false,
  smsProvider: 'eskiz',
  smsMonthlyLimit: 500,
  maxBranches: 1,
  maxStudents: 100,
  maxTeachers: 5,
  maxGroups: 10,
  features: {
    lms: true,
    crm: false,
    finance: true,
    gamification: false,
    ai_chat: false,
    ai_test: false,
    ai_grading: false,
    sms: false
  }
};

export default function PlansTab({ selectedCenterId, currentCenter }) {
  const qc = useQueryClient();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);

  // Payment confirmation modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMonths, setPayMonths] = useState(1);
  const [payNote, setPayNote] = useState('');

  // Assign plan modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [isTrialMode, setIsTrialMode] = useState(false);

  // 1. Fetch Plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api.get('/plans').then(r => r.data?.data || r.data || [])
  });

  // 2. Fetch Selected Center's Subscription
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['center-subscription', selectedCenterId],
    queryFn: () => api.get(`/subscriptions/${selectedCenterId || ''}`).then(r => r.data?.data || null),
    enabled: !!selectedCenterId
  });

  // Plan mutations
  const createPlanMutation = useMutation({
    mutationFn: (d) => api.post('/plans', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      setShowPlanModal(false);
      setPlanForm(EMPTY_PLAN_FORM);
      toast.success("Yangi tarif yaratildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/plans/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      setShowPlanModal(false);
      setEditingPlan(null);
      toast.success("Tarif ma'lumotlari yangilandi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success("Tarif o'chirildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  // Subscription action mutations
  const markPaidMutation = useMutation({
    mutationFn: (d) => api.post(`/subscriptions/${selectedCenterId}/mark-paid`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['center-subscription', selectedCenterId] });
      qc.invalidateQueries({ queryKey: ['admin-centers'] });
      setShowPayModal(false);
      toast.success("To'lov qabul qilindi, obuna uzaytirildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const assignPlanMutation = useMutation({
    mutationFn: (d) => api.post(`/subscriptions/${selectedCenterId}/assign`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['center-subscription', selectedCenterId] });
      qc.invalidateQueries({ queryKey: ['admin-centers'] });
      setShowAssignModal(false);
      toast.success("Tarif muvaffaqiyatli bog'landi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: (action) => api.post(`/subscriptions/${selectedCenterId}/${action}`),
    onSuccess: (_, action) => {
      qc.invalidateQueries({ queryKey: ['center-subscription', selectedCenterId] });
      qc.invalidateQueries({ queryKey: ['admin-centers'] });
      toast.success(action === 'suspend' ? "Markaz obunasi to'xtatildi" : "Obuna faollashtirildi");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Xatolik yuz berdi")
  });

  const handleEditPlan = (p) => {
    setEditingPlan(p);
    setPlanForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      currency: p.currency || 'UZS',
      trialDays: p.trialDays || 7,
      aiEnabled: p.aiEnabled,
      aiProvider: p.aiProvider || 'gemini',
      aiModel: p.aiModel || 'gemini-1.5-flash',
      aiMonthlyTokenLimit: p.aiMonthlyTokenLimit || 0,
      aiMonthlyRequestLimit: p.aiMonthlyRequestLimit || 0,
      smsEnabled: p.smsEnabled,
      smsProvider: p.smsProvider || 'eskiz',
      smsMonthlyLimit: p.smsMonthlyLimit || 0,
      maxBranches: p.maxBranches || 1,
      maxStudents: p.maxStudents || 100,
      maxTeachers: p.maxTeachers || 10,
      maxGroups: p.maxGroups || 10,
      features: p.features || {}
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = () => {
    if (!planForm.name) return toast.error("Tarif nomi kiritilishi shart");
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: planForm });
    } else {
      createPlanMutation.mutate(planForm);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. CURRENT CENTER SUBSCRIPTION STATUS ─── */}
      {selectedCenterId && (
        <div className="p-5 rounded-2xl border bg-[var(--card)] border-[var(--border)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  {currentCenter?.name || "Markaz"} — Obuna holati:
                </div>
                <div className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>{subscription?.plan?.name || "Tarif bog'lanmagan"}</span>
                  {subscription ? (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      subscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                      subscription.status === 'trial' ? 'bg-blue-500/10 text-blue-600' :
                      subscription.status === 'grace' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-rose-500/10 text-rose-600'
                    }`}>
                      {subscription.status === 'trial' ? `Demo (${subscription.trialEndsAt ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000*60*60*24))) : 0} kun qoldi)` :
                       subscription.status === 'active' ? 'Faol Obuna' :
                       subscription.status === 'grace' ? 'Imtiyozli muddat (Grace)' :
                       subscription.status}
                    </span>
                  ) : (
                    <span className="badge badge-warning text-xs">Bog'lanmagan</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setTargetPlanId(subscription?.planId || plans[0]?.id || '');
                  setShowAssignModal(true);
                }}
                className="btn-outline text-xs flex items-center gap-1.5"
              >
                <Layers size={14} /> Tarifni o'zgartirish
              </button>

              <button
                onClick={() => setShowPayModal(true)}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> To'lovni tasdiqlash
              </button>

              {subscription && (
                subscription.status === 'suspended' ? (
                  <button
                    onClick={() => toggleSuspendMutation.mutate('activate')}
                    className="btn-outline text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    Faollashtirish
                  </button>
                ) : (
                  <button
                    onClick={() => toggleSuspendMutation.mutate('suspend')}
                    className="btn-outline text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                  >
                    Bloklash
                  </button>
                )
              )}
            </div>
          </div>

          {/* Subscription detail badges */}
          {subscription && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-[var(--secondary-background)]">
                <span className="text-[var(--text-muted)] block mb-1">To'lov muddati:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {subscription.nextDueDate ? new Date(subscription.nextDueDate).toLocaleDateString('uz-UZ') : 'Belgilanmagan'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--secondary-background)]">
                <span className="text-[var(--text-muted)] block mb-1">Joriy oy AI sarfi:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {subscription.currentMonthTokens?.toLocaleString()} token ({subscription.currentMonthRequests} so'rov)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--secondary-background)]">
                <span className="text-[var(--text-muted)] block mb-1">Joriy oy SMS sarfi:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {subscription.currentMonthSms?.toLocaleString()} ta SMS
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--secondary-background)]">
                <span className="text-[var(--text-muted)] block mb-1">Oxirgi to'lov:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {subscription.lastPaidAt ? new Date(subscription.lastPaidAt).toLocaleDateString('uz-UZ') : "To'lanmagan"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 2. ALL TARIFF PLANS GRID ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Mavjud Tarif Rejalari</h3>
            <p className="text-xs text-[var(--text-secondary)]">O'quv markazlar uchun tariflar, limitlar va AI imkoniyatlari</p>
          </div>
          <button
            onClick={() => {
              setEditingPlan(null);
              setPlanForm(EMPTY_PLAN_FORM);
              setShowPlanModal(true);
            }}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Yangi tarif yaratish
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isUnlimited = p.aiMonthlyTokenLimit === -1;
            return (
              <div
                key={p.id}
                className="rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md bg-[var(--card)] border-[var(--border)] relative overflow-hidden"
              >
                {p.name.includes('Max') && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                    VIP
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-lg text-[var(--text-primary)]">{p.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] min-h-[32px] line-clamp-2 mt-0.5">
                        {p.description || "Ta'lim markazlari uchun qulay reja"}
                      </p>
                    </div>
                  </div>

                  <div className="my-4 pb-4 border-b border-[var(--border)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[var(--text-primary)]">
                        {p.price?.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">{p.currency} / oy</span>
                    </div>
                    <div className="text-[11px] text-[var(--primary)] font-medium mt-1 flex items-center gap-1">
                      <Clock size={12} /> {p.trialDays} kun bepul demo davri
                    </div>
                  </div>

                  {/* Quotas & Features */}
                  <div className="space-y-2 text-xs mb-5">
                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5"><Bot size={13} className="text-indigo-500" /> AI Moduli:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {p.aiEnabled ? (p.aiModel || "Flash") : "Yo'q"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-amber-500" /> Oylik Token:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {isUnlimited ? "Cheksiz" : p.aiMonthlyTokenLimit ? `${(p.aiMonthlyTokenLimit / 1000).toFixed(0)}K` : "0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5"><Smartphone size={13} className="text-emerald-500" /> Oylik SMS:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {p.smsMonthlyLimit === -1 ? "Cheksiz" : p.smsMonthlyLimit ? `${p.smsMonthlyLimit} ta` : "Yo'q"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5"><Users size={13} /> Talabalar limiti:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {p.maxStudents >= 9999 ? "Cheksiz" : p.maxStudents}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5"><GitBranch size={13} /> Filiallar soni:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {p.maxBranches >= 9999 ? "Cheksiz" : p.maxBranches}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => handleEditPlan(p)}
                    className="btn-outline text-xs flex-1 flex items-center justify-center gap-1"
                  >
                    <Pencil size={12} /> Tahrirlash
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`"${p.name}" tarifini o'chirishni xohlaysizmi?`)) {
                        deletePlanMutation.mutate(p.id);
                      }
                    }}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. PLAN EDIT/CREATE MODAL ─── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                {editingPlan ? "Tarifni tahrirlash" : "Yangi tarif yaratish"}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="btn-ghost p-1.5 rounded-lg text-xs">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-medium block mb-1">Tarif nomi *</label>
                <input
                  className="input-field"
                  placeholder="Starter Pro"
                  value={planForm.name}
                  onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-medium block mb-1">Oylik narx (UZS) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="399000"
                  value={planForm.price}
                  onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-medium block mb-1">Demo (sinov) kunlari</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="7"
                  value={planForm.trialDays}
                  onChange={e => setPlanForm(f => ({ ...f, trialDays: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-medium block mb-1">Maksimal filiallar</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="3"
                  value={planForm.maxBranches}
                  onChange={e => setPlanForm(f => ({ ...f, maxBranches: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-medium block mb-1">Maksimal talabalar</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="500"
                  value={planForm.maxStudents}
                  onChange={e => setPlanForm(f => ({ ...f, maxStudents: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-medium block mb-1">Maksimal o'qituvchilar</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="20"
                  value={planForm.maxTeachers}
                  onChange={e => setPlanForm(f => ({ ...f, maxTeachers: e.target.value }))}
                />
              </div>

              {/* AI Controls */}
              <div className="sm:col-span-2 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-500 flex items-center gap-1.5">
                    <Bot size={15} /> Sun'iy Intellekt (AI) Imkoniyatlari
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.aiEnabled}
                      onChange={e => setPlanForm(f => ({ ...f, aiEnabled: e.target.checked }))}
                    />
                    <span>Yoqilgan</span>
                  </label>
                </div>

                {planForm.aiEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block mb-1">AI Modeli</label>
                      <select
                        className="input-field"
                        value={planForm.aiModel || 'gemini-1.5-flash'}
                        onChange={e => setPlanForm(f => ({ ...f, aiModel: e.target.value }))}
                      >
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tez & Arzon)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Kuchli)</option>
                        <option value="gpt-4o">OpenAI GPT-4o</option>
                        <option value="all">Barcha modellar (Tanlov erkin)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1">Oylik Token Limiti (-1 = cheksiz)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="500000"
                        value={planForm.aiMonthlyTokenLimit}
                        onChange={e => setPlanForm(f => ({ ...f, aiMonthlyTokenLimit: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SMS Controls */}
              <div className="sm:col-span-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                    <Smartphone size={15} /> SMS Xabarnomalar Imkoniyati
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.smsEnabled}
                      onChange={e => setPlanForm(f => ({ ...f, smsEnabled: e.target.checked }))}
                    />
                    <span>Yoqilgan</span>
                  </label>
                </div>

                {planForm.smsEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block mb-1">SMS Provayder</label>
                      <select
                        className="input-field"
                        value={planForm.smsProvider || 'eskiz'}
                        onChange={e => setPlanForm(f => ({ ...f, smsProvider: e.target.value }))}
                      >
                        <option value="eskiz">Eskiz.uz (O'zbekiston)</option>
                        <option value="playmobile">Playmobile.uz (O'zbekiston)</option>
                        <option value="twilio">Twilio (Global)</option>
                        <option value="all">Barchasi + BYOS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1">Oylik SMS Limiti (-1 = cheksiz)</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="500"
                        value={planForm.smsMonthlyLimit}
                        onChange={e => setPlanForm(f => ({ ...f, smsMonthlyLimit: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="font-medium block mb-1">Tavsif</label>
                <textarea
                  className="input-field h-20"
                  placeholder="Tarif haqida qisqacha ma'lumot..."
                  value={planForm.description}
                  onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button onClick={() => setShowPlanModal(false)} className="btn-ghost text-xs">
                Bekor qilish
              </button>
              <button
                onClick={handleSavePlan}
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                className="btn-primary text-xs"
              >
                {createPlanMutation.isPending || updatePlanMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. CONFIRM PAYMENT MODAL ─── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" /> Oylik To'lovni Tasdiqlash
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Markaz to'lovni amalga oshirgan bo'lsa, obunani uzaytiring:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium block mb-1">Necha oylik to'lov?</label>
                <select
                  className="input-field"
                  value={payMonths}
                  onChange={e => setPayMonths(parseInt(e.target.value, 10))}
                >
                  <option value={1}>1 oy ({subscription?.plan?.price?.toLocaleString()} UZS)</option>
                  <option value={3}>3 oy ({((subscription?.plan?.price || 0) * 3)?.toLocaleString()} UZS)</option>
                  <option value={6}>6 oy ({((subscription?.plan?.price || 0) * 6)?.toLocaleString()} UZS)</option>
                  <option value={12}>1 yil ({((subscription?.plan?.price || 0) * 12)?.toLocaleString()} UZS)</option>
                </select>
              </div>

              <div>
                <label className="font-medium block mb-1">Izoh / To'lov ma'lumoti</label>
                <input
                  className="input-field"
                  placeholder="Naqd pul / Bank orqali qabul qilindi..."
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button onClick={() => setShowPayModal(false)} className="btn-ghost text-xs">Bekor</button>
              <button
                onClick={() => markPaidMutation.mutate({ monthsCount: payMonths, note: payNote })}
                disabled={markPaidMutation.isPending}
                className="btn-primary text-xs"
              >
                {markPaidMutation.isPending ? "Tasdiqlanmoqda..." : "Tasdiqlash & Faollashtirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. ASSIGN PLAN MODAL ─── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Tarifni Tanlash / O'zgartirish
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {currentCenter?.name} o'quv markaziga yangi tarif rejasini biriktiring:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium block mb-1">Tarif rejasi</label>
                <select
                  className="input-field"
                  value={targetPlanId}
                  onChange={e => setTargetPlanId(e.target.value)}
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price?.toLocaleString()} UZS/oy
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="trialCheck"
                  checked={isTrialMode}
                  onChange={e => setIsTrialMode(e.target.checked)}
                />
                <label htmlFor="trialCheck" className="cursor-pointer">
                  Bepul sinov muddati (Demo) sifatida belgilash
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button onClick={() => setShowAssignModal(false)} className="btn-ghost text-xs">Bekor</button>
              <button
                onClick={() => assignPlanMutation.mutate({ planId: targetPlanId, isTrial: isTrialMode })}
                disabled={assignPlanMutation.isPending}
                className="btn-primary text-xs"
              >
                {assignPlanMutation.isPending ? "Biriktirilmoqda..." : "Biriktirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
