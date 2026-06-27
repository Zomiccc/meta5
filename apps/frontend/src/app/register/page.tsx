'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { TrendingUp, User, Mail, Lock, Phone, Gift, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', referralCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setForm((f) => ({ ...f, referralCode: ref }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('accessToken', res.data.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <section className="flex min-h-[80vh] items-center justify-center py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <TrendingUp className="h-7 w-7 text-gold" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="mt-2 text-sm text-white/50">Join FXONS — trade global markets on MT5</p>
          </div>

          <div className="rounded-2xl border border-navy-700/50 bg-navy-900/50 p-8 backdrop-blur-sm">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input name="name" required placeholder="John Doe" value={form.name} onChange={handleChange} className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input name="email" type="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input name="phone" placeholder="+92 300 1234567" value={form.phone} onChange={handleChange} className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input name="password" type="password" required placeholder="••••••••" value={form.password} onChange={handleChange} className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">Referral Code (optional)</label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input name="referralCode" placeholder="ABC123" value={form.referralCode} onChange={handleChange} className="input-field pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-white/50">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-gold hover:text-gold-light">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
