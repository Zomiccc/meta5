'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { TrendingUp, User, Mail, Lock, Phone, Gift, Loader2, Globe, ShieldCheck } from 'lucide-react';

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    countryCode: 'PK',
    phoneNumber: '',
    referralCode: '',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setForm((f) => ({ ...f, referralCode: ref }));
  }, []);

  const selectedCountry = COUNTRIES.find((c) => c.code === form.countryCode) || COUNTRIES[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        country: selectedCountry.name,
        countryCode: selectedCountry.dial,
        phone: `${selectedCountry.dial} ${form.phoneNumber.trim()}`,
        referralCode: form.referralCode,
      };
      const res = await api.post('/auth/register', payload);
      localStorage.setItem('accessToken', res.data.accessToken);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-email', { code: otp });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/resend-verification');
      setError('A new code has been sent to your email');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <section className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              {step === 'register' ? <TrendingUp className="h-7 w-7 text-gold" /> : <ShieldCheck className="h-7 w-7 text-gold" />}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {step === 'register' ? 'Create Account' : 'Verify Email'}
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {step === 'register'
                ? 'Join FXONS — trade global markets'
                : `Enter the 6-digit code sent to ${form.email}`}
            </p>
          </div>

          <div className="rounded-2xl border border-navy-700/50 bg-navy-900/50 p-6 sm:p-8 backdrop-blur-sm">
            {error && (
              <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error.includes('sent') ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
                {error}
              </div>
            )}

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-5">
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
                  <label className="mb-1.5 block text-sm font-medium text-white/70">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <select
                      name="countryCode"
                      value={form.countryCode}
                      onChange={handleChange}
                      className="input-field appearance-none pl-10"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">Phone Number</label>
                  <div className="relative flex gap-2">
                    <span className="input-field flex w-24 items-center justify-center text-sm text-white/80">
                      {selectedCountry.dial}
                    </span>
                    <input
                      name="phoneNumber"
                      required
                      placeholder="300 1234567"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      className="input-field flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input name="password" type="password" required placeholder="••••••••" value={form.password} onChange={handleChange} className="input-field pl-10" />
                  </div>
                  <p className="mt-1 text-xs text-white/40">Min 8 chars, uppercase, lowercase, and number</p>
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
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">6-digit verification code</label>
                  <input
                    name="otp"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center text-xl tracking-[0.5em]"
                  />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-gold w-full">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="w-full text-sm text-gold hover:text-gold-light disabled:opacity-50"
                >
                  Resend code
                </button>
              </form>
            )}
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
