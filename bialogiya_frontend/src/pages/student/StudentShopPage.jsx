import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Coins, Gift, Sparkles, Shirt, BookOpen, Tag,
  Pencil, Award, Star, CheckCircle2, AlertCircle, Clock,
  ArrowRight, Check, X, RefreshCw, Flame, Zap, Package
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';

const ICON_MAP = {
  Shirt,
  Sparkles,
  BookOpen,
  Tag,
  Pencil,
  Gift,
  Award,
  Star,
  Package,
};

const CATEGORIES = [
  { key: 'all', label: 'Barcha mahsulotlar' },
  { key: 'merch', label: 'Brendli buyumlar (Merch)' },
  { key: 'book', label: 'Kitoblar & Qo\'llanmalar' },
  { key: 'discount', label: 'Chegirma vaucherlari' },
  { key: 'other', label: 'Boshqa sovg\'alar' },
];

export default function StudentShopPage() {
  const qc = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'orders'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchasingItem, setPurchasingItem] = useState(null);

  // Fetch shop items
  const { data: items = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ['shop-items'],
    queryFn: () => api.get('/shop/items').then(r => r.data?.data || []),
  });

  // Fetch student orders
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['shop-orders-student'],
    queryFn: () => api.get('/shop/orders').then(r => r.data?.data || []),
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (itemId) => api.post('/shop/purchase', { itemId }),
    onSuccess: (res) => {
      const data = res.data?.data;
      if (data && typeof data.newCoins === 'number') {
        updateUser({ ...user, coins: data.newCoins });
      }
      qc.invalidateQueries({ queryKey: ['shop-items'] });
      qc.invalidateQueries({ queryKey: ['shop-orders-student'] });
      toast.success(data?.message || "Xarid muvaffaqiyatli amalga oshirildi!");
      setPurchasingItem(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Xaridni amalga oshirib bo'lmadi");
    },
  });

  const studentCoins = user?.coins || 0;

  // Filter items by category
  const filteredItems = items.filter(it => {
    if (selectedCategory === 'all') return true;
    return it.category === selectedCategory;
  });

  const renderIcon = (iconName, className = "w-6 h-6") => {
    const IconComponent = ICON_MAP[iconName] || Gift;
    return <IconComponent className={className} />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── Page Header & Balance Banner ── */}
      <div className="gradient-bg rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              <Sparkles size={14} /> Tanga & Sovg'alar Tizimi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tangalar Do'koni (Coin Shop)
            </h1>
            <p className="text-white/80 text-sm max-w-xl">
              Darslarda qatnashib, vazifalarni vaqtida bajarib to'plagan tangalaringizni markazimizning brendli sovg'alari, darsliklar va chegirmalarga almashtiring!
            </p>
          </div>

          {/* Coin Balance Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex items-center gap-4 self-stretch md:self-auto min-w-[220px]">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-inner">
              <Coins size={30} className="drop-shadow" />
            </div>
            <div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-medium">Sizning balansingiz</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 flex items-baseline gap-1.5">
                {studentCoins.toLocaleString()}
                <span className="text-sm font-semibold text-white/80">tanga</span>
              </div>
              <div className="text-xs text-white/60 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> {user?.streak?.current || 0} kun streak</span>
                <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-300" /> {user?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation (Catalog vs Orders) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'catalog'
                ? 'bg-[var(--primary)] text-white shadow-soft'
                : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
            }`}
          >
            <ShoppingBag size={16} />
            Mahsulotlar katalogi ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
              activeTab === 'orders'
                ? 'bg-[var(--primary)] text-white shadow-soft'
                : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
            }`}
          >
            <Package size={16} />
            Mening xaridlarim
            {orders.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'orders' ? 'bg-white text-[var(--primary)]' : 'bg-[var(--primary-50)] text-[var(--primary)]'
              }`}>
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-[var(--primary-50)] text-[var(--primary)] font-bold border border-[var(--primary-100)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)] border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Catalog Tab ── */}
      {activeTab === 'catalog' && (
        <div>
          {isItemsLoading ? (
            <div className="py-16 text-center text-sm text-[var(--text-muted)]">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />
              Do'kon mahsulotlari yuklanmoqda...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center panel-card space-y-3">
              <ShoppingBag size={36} className="mx-auto text-[var(--text-muted)] opacity-50" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Mahsulotlar topilmadi</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Hozircha ushbu bo'limda mahsulotlar mavjud emas. Tez orada yangi sovg'alar qo'shiladi!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map(item => {
                const canAfford = studentCoins >= item.priceCoins;
                const isOutOfStock = item.stock !== null && item.stock <= 0;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="panel-card flex flex-col justify-between p-5 hover:shadow-soft transition-all border border-[var(--border)] group relative"
                  >
                    <div>
                      {/* Top Row: Icon + Category + Stock */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          {renderIcon(item.icon, "w-6 h-6")}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="badge badge-gray text-[10px] uppercase font-semibold">
                            {item.category === 'merch' ? 'Merch' :
                             item.category === 'book' ? 'Kitob' :
                             item.category === 'discount' ? 'Chegirma' : 'Sovg\'a'}
                          </span>
                          {item.stock !== null ? (
                            <span className={`text-[11px] font-medium ${item.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 font-bold'}`}>
                              {item.stock > 0 ? `${item.stock} dona qoldi` : 'Tugagan'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                              Cheksiz zaxira
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-base text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                        {item.description || "Markaz o'quvchilari uchun maxsus sovg'a."}
                      </p>
                    </div>

                    {/* Bottom Row: Price & Buy Button */}
                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <Coins size={18} className="text-amber-500 flex-shrink-0" />
                        <span className="text-lg font-black text-[var(--text-primary)]">
                          {item.priceCoins}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] font-medium">tanga</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPurchasingItem(item)}
                        disabled={!canAfford || isOutOfStock}
                        className={`btn-sm flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl font-semibold transition-all ${
                          !canAfford
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                            : isOutOfStock
                            ? 'bg-rose-50 text-rose-400 cursor-not-allowed'
                            : 'btn-primary shadow-xs hover:shadow-soft'
                        }`}
                      >
                        {isOutOfStock ? (
                          'Tugagan'
                        ) : !canAfford ? (
                          'Tangalar yetarli emas'
                        ) : (
                          <>
                            <ShoppingBag size={14} /> Xarid qilish
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        <div className="panel-card space-y-4">
          <div className="pb-3 border-b border-[var(--border)]">
            <h3 className="panel-title">Mening xaridlarim jurnali</h3>
            <p className="panel-subtitle">Tangalarga almashtirilgan barcha sovg'alar va ularning holati</p>
          </div>

          {isOrdersLoading ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
              Buyurtmalar yuklanmoqda...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package size={36} className="mx-auto text-[var(--text-muted)] opacity-50" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Sizda hali xaridlar yo'q</div>
              <p className="text-xs text-[var(--text-secondary)]">
                Katalogdan o'zingizga yoqqan sovg'ani tanlang va tangalarga xarid qiling!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="btn-primary btn-sm mx-auto mt-2"
              >
                Katalogni ko'rish
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Mahsulot</th>
                    <th className="py-3 px-3">Narxi</th>
                    <th className="py-3 px-3">Sana</th>
                    <th className="py-3 px-3">Holat</th>
                    <th className="py-3 px-3 text-right">Eslatma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {orders.map(order => {
                    const isPending = order.status === 'pending';
                    const isFulfilled = order.status === 'fulfilled';
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <tr key={order.id} className="hover:bg-[var(--secondary-background)] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-sm text-[var(--text-primary)]">
                            {order.itemTitle}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">ID: #{order.id.slice(0, 8)}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1 font-bold text-amber-500">
                            <Coins size={14} />
                            {order.priceCoins} tanga
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[var(--text-secondary)]">
                          {new Date(order.createdAt).toLocaleDateString('uz-UZ', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-3">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Clock size={12} /> Kutilmoqda
                            </span>
                          )}
                          {isFulfilled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={12} /> Topshirildi
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              <X size={12} /> Bekor qilingan
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {isPending && (
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              Markaz qabulxonasidan olib keting
                            </span>
                          )}
                          {isFulfilled && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              Muvaffaqiyatli qabul qilib olindi
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-[11px] text-rose-500">
                              Tangalar balansingizga qaytarildi
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Purchase Confirmation Modal ── */}
      <Modal
        open={!!purchasingItem}
        onClose={() => setPurchasingItem(null)}
        title="Xaridni tasdiqlash"
        subtitle="Tangalarni sarflashdan oldin ma'lumotlarni tekshiring"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPurchasingItem(null)}
              className="btn-ghost"
              disabled={purchaseMutation.isPending}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={() => purchasingItem && purchaseMutation.mutate(purchasingItem.id)}
              disabled={purchaseMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {purchaseMutation.isPending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Xarid qilinmoqda...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Tasdiqlash va xarid qilish
                </>
              )}
            </button>
          </>
        }
      >
        {purchasingItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                {renderIcon(purchasingItem.icon, "w-6 h-6")}
              </div>
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">{purchasingItem.title}</div>
                <div className="text-xs text-[var(--text-secondary)] line-clamp-1">{purchasingItem.description}</div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Mahsulot narxi:</span>
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  <Coins size={13} /> {purchasingItem.priceCoins} tanga
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Joriy hisobingiz:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {studentCoins} tanga
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Xariddan keyingi qoldiq:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {studentCoins - purchasingItem.priceCoins} tanga
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                Xarid amalga oshirilgach, markaz ma'muriyatiga (qabulxona yoki menejerga) murojaat qilib sovg'angizni qabul qilib olishingiz mumkin.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
