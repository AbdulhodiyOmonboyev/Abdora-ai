import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, Mail, MapPin, ShieldCheck, CalendarCheck, Building2,
  GraduationCap, Users, Clock, Flame, Snowflake, Coins, Star,
} from 'lucide-react';
import api from '../../config/axios';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';
import { formatDate, formatDateTime } from '../../utils/format';

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  reception: 'Qabulxona',
  teacher: "O'qituvchi",
  student: "O'quvchi",
};

const GENDER_LABELS = { male: 'Erkak', female: 'Ayol' };

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="text-primary mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-800 dark:text-white">{label}</div>
        <div className="text-sm text-gray-500 break-words">{value || '—'}</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl bg-[var(--surface)] dark:bg-slate-950/60 border border-[var(--border)] dark:border-slate-800 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary grid place-items-center flex-shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold dark:text-white leading-tight">{value}</div>
        <div className="text-xs dark:text-slate-400 truncate">{label}</div>
      </div>
    </div>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user-detail', id],
    queryFn: () => api.get(`/users/${id}`).then((res) => res.data.data),
    enabled: Boolean(id),
    retry: false,
  });

  const back = (
    <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl" aria-label="Orqaga">
      <ArrowLeft size={18} />
    </button>
  );

  if (isLoading) return <Loader />;

  if (isError || !user) {
    return (
      <div className="dashboard-shell max-w-5xl mx-auto">
        <div className="mb-6">{back}</div>
        <ErrorState
          error={error}
          onRetry={refetch}
          title={error?.response?.status === 404 ? 'Foydalanuvchi topilmadi' : "Ma'lumotni yuklab bo'lmadi"}
        />
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const ownBranches = [...(user.managedBranches || []), ...(user.branches || [])];
  const branchName = user.branch?.name || user.group?.branch?.name || ownBranches.map(b => b.name).join(', ');

  return (
    <div className="dashboard-shell max-w-5xl mx-auto">
      <header className="dashboard-header">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {back}
          <div className="min-w-0">
            <span className="dashboard-badge"><ShieldCheck size={12} /> Abdora AI</span>
            <h1>{user.name || user.username}</h1>
            <p>Foydalanuvchi ma'lumotlari</p>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="panel-card space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-16 h-16 rounded-3xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary grid place-items-center text-2xl font-bold flex-shrink-0">
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-lg font-semibold text-gray-800 dark:text-white truncate">{user.name || "Noma'lum"}</div>
              <div className="text-sm text-gray-500 truncate">@{user.username}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge text-xs bg-primary/10 text-primary">{roleLabel}</span>
            <span className={`badge text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {user.isActive ? 'Faol' : 'Nofaol'}
            </span>
            {user.isFrozen && (
              <span className="badge text-xs bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                <Snowflake size={11} /> Muzlatilgan
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-3xl bg-[var(--surface)] dark:bg-slate-950/50 border border-[var(--border)] dark:border-slate-800">
            <div className="text-xs uppercase tracking-wide dark:text-slate-400">Aloqa</div>
            <InfoRow icon={Phone} label="Telefon" value={user.phone} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={MapPin} label="Manzil" value={user.address} />
          </div>

          <div className="space-y-3 p-4 rounded-3xl bg-[var(--surface)] dark:bg-slate-950/50 border border-[var(--border)] dark:border-slate-800">
            <div className="text-xs uppercase tracking-wide dark:text-slate-400">Ma'lumot</div>
            <InfoRow icon={ShieldCheck} label="Rol" value={roleLabel} />
            <InfoRow icon={Building2} label="Filial" value={branchName} />
            {user.role === 'student' && (
              <>
                <InfoRow icon={Users} label="Guruh" value={user.group?.name} />
                <InfoRow icon={GraduationCap} label="O'qituvchi" value={user.teacher?.name} />
              </>
            )}
            <InfoRow
              icon={ShieldCheck}
              label="Jinsi / Yoshi"
              value={[GENDER_LABELS[user.gender] || user.gender, user.age && `${user.age} yosh`].filter(Boolean).join(' · ')}
            />
          </div>
        </div>

        {user.role === 'student' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Star} label="Daraja" value={user.level ?? 1} />
            <StatCard icon={Star} label="XP" value={user.xp ?? 0} />
            <StatCard icon={Coins} label="Tanga" value={user.coins ?? 0} />
            <StatCard icon={Flame} label="Streak" value={user.streak?.current ?? 0} />
          </div>
        )}

        {user.role === 'teacher' && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="O'quvchilar" value={user._count?.students ?? 0} />
            <StatCard icon={GraduationCap} label="Guruhlar" value={user._count?.taughtGroups ?? 0} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-[var(--border)] dark:border-slate-800">
          <div className="pt-4">
            <InfoRow icon={CalendarCheck} label="Qo'shilgan" value={user.createdAt && formatDate(user.createdAt)} />
          </div>
          <div className="sm:pt-4">
            <InfoRow icon={Clock} label="Oxirgi kirish" value={user.lastLogin ? formatDateTime(user.lastLogin) : 'Hali kirmagan'} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
