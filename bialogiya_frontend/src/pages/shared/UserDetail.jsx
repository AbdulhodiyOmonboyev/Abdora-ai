import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, User, ShieldCheck, MapPin, CalendarCheck } from 'lucide-react';
import api from '../../config/axios';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-detail', id],
    queryFn: () => api.get(`/users/${id}`).then((res) => res.data.data),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  if (!user) {
    return <div className="max-w-3xl mx-auto py-20 text-center text-gray-500">User not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{user.name || user.username}</h1>
          <p className="text-sm text-gray-500">User details and profile information</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary grid place-items-center text-2xl font-bold">
              {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800 dark:text-white">{user.name || 'No name'}</div>
              <div className="text-sm text-gray-500">@{user.username}</div>
            </div>
          </div>
          <div className="badge text-xs bg-gray-100 text-gray-500">{user.role}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-3xl bg-gray-50 dark:bg-gray-900">
            <div className="text-xs uppercase tracking-wide text-gray-500">Contact</div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Phone</div>
                <div className="text-sm text-gray-500">{user.phone || '—'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Email</div>
                <div className="text-sm text-gray-500">{user.email || '—'}</div>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4 rounded-3xl bg-gray-50 dark:bg-gray-900">
            <div className="text-xs uppercase tracking-wide text-gray-500">Info</div>
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Role</div>
                <div className="text-sm text-gray-500">{user.role}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Branch / Group</div>
                <div className="text-sm text-gray-500">
                  {user.branch?.name || user.group?.name || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarCheck size={18} className="text-primary mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Joined</div>
                <div className="text-sm text-gray-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
