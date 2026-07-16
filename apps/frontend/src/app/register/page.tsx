'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, saveAuthTokens } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { TrendingUp, User, Mail, Lock, Eye, EyeOff, Gift, Globe, ShieldCheck, Check, Phone } from 'lucide-react';

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

function passwordStrength(password: string): { label: string; color: 'default' | 'warning' | 'success' | 'danger'; percent: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors: Array<'danger' | 'warning' | 'success'> = ['danger', 'danger', 'warning', 'warning', 'success', 'success'];
  return { label: labels[score], color: colors[score], percent: (score / 5) * 100 };
}

export default function RegisterPage() {
  const router = useRouter();
  const { error: showError, success } = useToast();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: 'PK',
    phoneNumber: '',
    referralCode: '',
    agree: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setForm((f) => ({ ...f, referralCode: ref }));
  }, []);

  const selectedCountry = COUNTRIES.find((c) => c.code === form.countryCode) || COUNTRIES[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errMsg) setErrMsg('');
  };

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    if (form.password !== form.confirmPassword) {
      setErrMsg('Passwords do not match');
      return;
    }
    if (!form.agree) {
      setErrMsg('You must agree to the terms and conditions');
      return;
    }
    const cleanPhone = form.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 6) {
      setErrMsg('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        country: selectedCountry.name,
        countryCode: selectedCountry.dial,
        phone: `${selectedCountry.dial}${form.phoneNumber.replace(/\D/g, '')}`,
        referralCode: form.referralCode,
      };
      const res = await api.post('/auth/register', payload);
      saveAuthTokens(res.data.accessToken, res.data.refreshToken);
      setStep('verify');
      success('Account created. Please verify your email.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      setErrMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { code: otp });
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid verification code';
      setErrMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-verification');
      success('A new verification code has been sent to your email');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not resend code';
      setErrMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bn-bg">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-bn bg-yellow text-black">
              {step === 'register' ? <TrendingUp className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <h1 className="text-2xl font-bold text-bnText-primary">
              {step === 'register' ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="mt-2 text-sm text-bnText-secondary">
              {step === 'register'
                ? 'Join FXONS — trade global markets'
                : `Enter the 6-digit code sent to ${form.email}`}
            </p>
          </div>

          <Card className="p-6">
            {errMsg && (
              <div className="mb-4 rounded-bn border border-bnRed/20 bg-bnRed/10 px-4 py-3 text-sm text-bnRed">
                {errMsg}
              </div>
            )}

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  icon={<User className="h-4 w-4" />}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  icon={<Mail className="h-4 w-4" />}
                />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-bnText-secondary">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-bnText-muted" />
                    <select
                      name="countryCode"
                      value={form.countryCode}
                      onChange={handleChange}
                      className="bn-select pl-10"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="mb-1.5 block text-xs font-medium text-bnText-secondary">Code</label>
                    <div className="bn-input flex h-[44px] items-center justify-center text-sm text-bnText-primary">
                      {selectedCountry.dial}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Input
                      label="Phone Number"
                      name="phoneNumber"
                      required
                      placeholder="300 1234567"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      icon={<Phone className="h-4 w-4" />}
                    />
                  </div>
                </div>
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-bnText-muted hover:text-bnText-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <div className="space-y-1.5">
                  <div className="h-1 w-full overflow-hidden rounded-bn bg-bn-border">
                    <div
                      className={`h-full transition-all ${
                        strength.color === 'danger'
                          ? 'bg-bnRed'
                          : strength.color === 'warning'
                          ? 'bg-yellow'
                          : 'bg-bnGreen'
                      }`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-bnText-muted">Password strength</span>
                    <Badge color={strength.color}>{strength.label}</Badge>
                  </div>
                </div>
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  right={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="text-bnText-muted hover:text-bnText-primary"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <Input
                  label="Referral Code (optional)"
                  name="referralCode"
                  placeholder="ABC123"
                  value={form.referralCode}
                  onChange={handleChange}
                  icon={<Gift className="h-4 w-4" />}
                />
                <label className="flex cursor-pointer items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    name="agree"
                    checked={form.agree}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded-bn border-bn-border bg-bn-input text-yellow focus:ring-yellow"
                  />
                  <span className="text-xs leading-relaxed text-bnText-secondary">
                    I agree to the{' '}
                    <Link href="#" className="text-yellow hover:underline">
                      Terms of Use
                    </Link>{' '}
                    and{' '}
                    <Link href="#" className="text-yellow hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                  Create Account
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                <Input
                  label="6-digit verification code"
                  name="otp"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-xl tracking-[0.5em]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                  disabled={otp.length !== 6}
                >
                  Verify & Continue
                </Button>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="w-full text-sm text-yellow transition hover:text-yellow-hover disabled:opacity-50"
                >
                  Resend code
                </button>
              </form>
            )}
            <p className="mt-6 text-center text-sm text-bnText-secondary">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-yellow hover:text-yellow-hover">
                Log In
              </Link>
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
