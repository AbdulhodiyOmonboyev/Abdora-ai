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
import { formatDateTime } from '../../utils/format';

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

const ITEM_DEFAULT_IMAGES = {
  'item-merch-shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
  'item-merch-stickers': 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=600&auto=format&fit=crop&q=80',
  'item-book-biology': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
  'item-discount-10': 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
  'item-stationery-set': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
};

const CATEGORY_DEFAULT_IMAGES = {
  merch: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
  book: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
  discount: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
};

const getItemImage = (item) => {
  return item?.imageUrl || ITEM_DEFAULT_IMAGES[item?.id] || CATEGORY_DEFAULT_IMAGES[item?.category] || null;
};

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
      <div className="gradient-bg rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-soft relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              <Sparkles size={12} /> Tanga & Sovg'alar Tizimi
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Tangalar Do'koni
            </h1>
            <p className="hidden sm:block text-white/80 text-xs sm:text-sm max-w-xl">
              Darslarda qatnashib, vazifalarni vaqtida bajarib to'plagan tangalaringizni markazimizning brendli sovg'alari, darsliklar va chegirmalarga almashtiring!
            </p>
          </div>

          {/* Coin Balance Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 flex items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-inner">
              <Coins size={24} className="drop-shadow" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider font-medium">Balansingiz</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 flex items-baseline gap-1">
                {studentCoins.toLocaleString()}
                <span className="text-xs font-semibold text-white/80">tanga</span>
              </div>
              <div className="text-[11px] text-white/80 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1"><Flame size={11} className="text-orange-400" /> {user?.streakCurrent ?? user?.streak?.current ?? 0} kun ketma-ketlik</span>
                <span className="flex items-center gap-1"><Zap size={11} className="text-yellow-300" /> {user?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation (Catalog vs Orders) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--card)] rounded-xl border border-[var(--border)] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'catalog'
                ? 'bg-[var(--primary)] text-white shadow-soft'
                : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
            }`}
          >
            <ShoppingBag size={14} />
            Katalog ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'orders'
                ? 'bg-[var(--primary)] text-white shadow-soft'
                : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-background)]'
            }`}
          >
            <Package size={14} />
            Xaridlarim
            {orders.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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
                className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredItems.map(item => {
                const canAfford = studentCoins >= item.priceCoins;
                const isOutOfStock = item.stock !== null && item.stock <= 0;
                const itemImg = getItemImage(item);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="panel-card flex flex-col justify-between overflow-hidden p-0 hover:shadow-soft transition-all border border-[var(--border)] group relative rounded-2xl sm:rounded-3xl"
                  >
                    {/* Mahsulot rasmi va ustki nishonlar */}
                    <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-[var(--secondary-background)] flex items-center justify-center">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                          {renderIcon(item.icon, "w-10 h-10")}
                        </div>
                      )}

                      {/* Gradient soya */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35 pointer-events-none" />

                      {/* Toifa va Zaxira nishonlari */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="badge backdrop-blur-md bg-black/50 text-white border border-white/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                          {item.category === 'merch' ? 'Merch' :
                           item.category === 'book' ? 'Kitob' :
                           item.category === 'discount' ? 'Chegirma' : "Sovg'a"}
                        </span>

                        {item.stock !== null ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                            item.stock > 0 
                              ? 'bg-emerald-500/85 text-white border-emerald-400/30' 
                              : 'bg-rose-500/85 text-white border-rose-400/30'
                          }`}>
                            {item.stock > 0 ? `${item.stock} dona qoldi` : 'Tugagan'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md bg-white/20 text-white border border-white/20">
                            Cheksiz zaxira
                          </span>
                        )}
                      </div>

                      {/* Tanga narxi rasmdagi qatlam ustida */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/65 backdrop-blur-md border border-white/25 text-amber-300 font-bold text-xs sm:text-sm shadow-md">
                        <Coins size={14} className="text-amber-400 shrink-0" />
                        <span>{item.priceCoins}</span>
                        <span className="text-[10px] text-white/80 font-normal">tanga</span>
                      </div>
                    </div>

                    {/* Kartaning ichki ma'lumotlari */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
                          {item.description || "Markaz o'quvchilari uchun maxsus sovg'a."}
                        </p>
                      </div>

                      {/* Pastki qator: Xarid tugmasi va yordamchi matn */}
                      <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">
                          {canAfford ? "Balans yetarli" : `Yana ${item.priceCoins - studentCoins} tanga`}
                        </span>

                        <button
                          type="button"
                          onClick={() => setPurchasingItem(item)}
                          disabled={!canAfford || isOutOfStock}
                          className={`btn-sm flex items-center gap-1.5 text-xs py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl font-semibold transition-all ${
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
                            'Yetarli emas'
                          ) : (
                            <>
                              <ShoppingBag size={13} /> Xarid qilish
                            </>
                          )}
                        </button>
                      </div>
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
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-3">
                {orders.map(order => {
                  const isPending = order.status === 'pending';
                  const isFulfilled = order.status === 'fulfilled';
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <div key={order.id} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary-background)] space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-[var(--text-primary)] truncate">
                            {order.itemTitle}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">ID: #{order.id.slice(0, 8)}</div>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-amber-500 text-xs shrink-0 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          <Coins size={13} className="shrink-0" />
                          {order.priceCoins} tanga
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/70 text-xs">
                        <span className="text-[var(--text-secondary)] text-[11px]">
                          {formatDateTime(order.createdAt)}
                        </span>
                        <div>
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Clock size={11} /> Kutilmoqda
                            </span>
                          )}
                          {isFulfilled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={11} /> Topshirildi
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              <X size={11} /> Bekor qilingan
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)] bg-[var(--card)] px-2.5 py-1.5 rounded-lg border border-[var(--border)]/50">
                        {isPending && "Markaz qabulxonasidan olib keting"}
                        {isFulfilled && "Muvaffaqiyatli qabul qilib olindi"}
                        {isCancelled && "Tangalar balansingizga qaytarildi"}
                        {order.note && ` • ${order.note}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
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
                          <td className="py-3.5 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
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
            </>
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
            <div className="p-3.5 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--card)] flex-shrink-0 border border-[var(--border)] flex items-center justify-center">
                {getItemImage(purchasingItem) ? (
                  <img src={getItemImage(purchasingItem)} alt={purchasingItem.title} className="w-full h-full object-cover" />
                ) : (
                  renderIcon(purchasingItem.icon, "w-6 h-6 text-primary")
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-[var(--text-primary)] truncate">{purchasingItem.title}</div>
                <div className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">{purchasingItem.description}</div>
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
