import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Users, ClipboardList, Calendar, MapPin, UserCheck } from 'lucide-react';
import api from '../../config/axios';
import Loader from '../../components/ui/Loader';

const formatSchedule = (group) => {
  const parts = [];
  if (group.weekDays) {
    try {
      const days = JSON.parse(group.weekDays);
      const labels = days.map(d => ({ mon: 'Du', tue: 'Se', wed: 'Cho', thu: 'Pa', fri: 'Ju', sat: 'Sha', sun: 'Ya' }[d])).filter(Boolean);
      if (labels.length) parts.push(labels.join(', '));
    } catch {}
  }
  if (group.startTime) parts.push(group.startTime + (group.endTime ? `–${group.endTime}` : ''));
  if (group.room) parts.push(group.room);
  return parts.join(' · ');
};

export default function ReceptionCenterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reception-center', id],
    queryFn: () => api.get(`/reception/branches/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (isError) {
      // If the center is not found or access denied, return to list
      navigate('/reception/centers', { replace: true });
    }
  }, [isError, navigate]);

  if (isLoading || !data) {
    return <div className="max-w-4xl mx-auto"><Loader /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/reception/centers')} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{data.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{data.address || 'Manzil kiritilmagan'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Building2 size={20} className="text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">O'quvchi sig'imi</div>
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{data.studentCapacity ?? '—'}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">Bu markaz uchun maksimal o'quvchilar soni.</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Users size={20} className="text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">O'quvchilar</div>
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{data.studentsCount}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">Faol guruhlardagi o'quvchilar.</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck size={20} className="text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">O'qituvchilar</div>
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{data.teachers?.length ?? 0}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">Bu markazga biriktirilgan o'qituvchilar.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Guruhlar</div>
              <div className="text-xs text-gray-500">{data.groups?.length ?? 0} ta guruh</div>
            </div>
            <div className="badge bg-primary/10 text-primary text-xs">Markazdagi</div>
          </div>
          <div className="space-y-3">
            {data.groups?.map(group => (
              <div key={group.id} className="border border-gray-100 dark:border-gray-800 rounded-3xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white">{group.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{group._count?.students || 0} o'quvchi</div>
                  </div>
                  <div className="text-xs text-gray-500">{group.monthlyFee ? `${group.monthlyFee} so'm/oy` : 'To‘lov yo‘q'}</div>
                </div>
                {formatSchedule(group) && (
                  <div className="text-xs text-primary/80 mt-2">{formatSchedule(group)}</div>
                )}
              </div>
            ))}
            {data.groups?.length === 0 && (
              <div className="text-sm text-gray-500">Bu markazga hali guruh biriktirilmagan.</div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">O'qituvchilar</div>
              <div className="text-xs text-gray-500">{data.teachers?.length ?? 0} ta</div>
            </div>
            <div className="badge bg-secondary/10 text-secondary text-xs">Markazga</div>
          </div>
          <div className="space-y-3">
            {data.teachers?.map(teacher => (
              <div key={teacher.id} className="border border-gray-100 dark:border-gray-800 rounded-3xl p-4">
                <div className="font-semibold text-gray-800 dark:text-white">{teacher.name}</div>
                <div className="text-xs text-gray-500 mt-1">@{teacher.username}</div>
                {teacher.phone && <div className="text-xs text-gray-500 mt-1">{teacher.phone}</div>}
              </div>
            ))}
            {data.teachers?.length === 0 && (
              <div className="text-sm text-gray-500">Bu markazga hali o'qituvchi tayinlanmagan.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <Calendar size={18} className="text-primary" />
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Markaz ma'lumotlari</div>
            <div className="text-xs text-gray-500">{data.createdAt ? new Date(data.createdAt).toLocaleDateString('uz-UZ') : '—'}</div>
          </div>
        </div>
        {data.address && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={16} />{data.address}
          </div>
        )}
        <div className="mt-4 text-sm text-gray-500">Qabulxona uchun markazni o'zgartirish bu yerda amalga oshiriladi.</div>
      </div>
    </div>
  );
}
