'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Mail, Lock, Eye, EyeOff, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { error } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      const role = res.data.user.role;
      router.push(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      setErrMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bn-bg">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-bn bg-yellow text-black">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-bnText-primary">Log In</h1>
            <p className="mt-2 text-sm text-bnText-secondary">Welcome back to FXONS</p>
          </div>

          <Card className="p-6">
            {errMsg && (
              <div className="mb-4 rounded-bn border border-bnRed/20 bg-bnRed/10 px-4 py-3 text-sm text-bnRed">
                {errMsg}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-bnText-secondary hover:text-yellow">
                  Forgot Password?
                </Link>
              </div>
              <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                Log In
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-bn-border" />
              <span className="text-xs text-bnText-muted">or</span>
              <div className="h-px flex-1 bg-bn-border" />
            </div>

            <p className="mt-6 text-center text-sm text-bnText-secondary">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-yellow hover:text-yellow-hover">
                Register
              </Link>
            </p>
          </Card>

          <div className="mt-4 rounded-bn border border-bn-border bg-bn-card p-3 text-center text-xs text-bnText-muted">
            Demo: admin@broker.pk / Admin123! &nbsp;|&nbsp; client@broker.pk / Client123!
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
