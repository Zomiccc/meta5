'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-bnText-primary">Profile Settings</h1>
        <p className="text-bnText-secondary">Manage your account information</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-lg rounded-bn-lg border border-bn-border bg-bn-card p-6 shadow-card"
      >
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-bn border px-4 py-3 text-sm ${
              success ? 'border-bnGreen/20 bg-bnGreen/10 text-bnGreen' : 'border-bnRed/20 bg-bnRed/10 text-bnRed'
            }`}
          >
            {success && <CheckCircle className="h-4 w-4" />}
            {message}
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bnText-secondary">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bnText-muted" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bn-input pl-10" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bnText-secondary">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bnText-muted" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bn-input pl-10" placeholder="Optional" />
            </div>
          </div>
          <button className="bn-btn-primary w-full">Save Changes</button>
        </form>
      </motion.div>
    </DashboardShell>
  );
}
