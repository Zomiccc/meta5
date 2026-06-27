'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { User, Mail, Phone, CheckCircle, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setForm({ name: res.data.name || '', phone: res.data.phone || '' }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);
    try {
      await api.put('/users/me', form);
      setSuccess(true);
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setSuccess(false);
      setMessage(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-white/50">Manage your account information</p>
      </div>

      <div className="max-w-lg card animate-slide-up">
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              success ? 'border-green-500/20 bg-green-500/10 text-green-300' : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {success && <CheckCircle className="h-4 w-4" />}
            {message}
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field pl-10" placeholder="Optional" />
            </div>
          </div>
          <button className="btn-gold w-full">Save Changes</button>
        </form>
      </div>
    </DashboardShell>
  );
}
