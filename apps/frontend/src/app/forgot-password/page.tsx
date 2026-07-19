'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg('');
    try {
      await api.post('/auth/forgot-password', { email });
      success('Reset code sent to your email');
      setStep('code');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send reset code';
      setErrMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setErrMsg('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setErrMsg('');
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      setStep('password');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired code';
      setErrMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrMsg('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrMsg('Passwords do not match');
      return;
    }
    setLoading(true);
    setErrMsg('');
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      success('Password reset successfully');
      setStep('success');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setErrMsg(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = {
    email: 'Reset Password',
    code: 'Enter Reset Code',
    password: 'Set New Password',
    success: 'Password Reset',
  }[step];

  const stepSubtitle = {
    email: 'Enter your email to receive a reset code',
    code: `Enter the 6-digit code sent to ${email}`,
    password: 'Create a strong new password',
    success: 'Your password has been reset successfully',
  }[step];

  return (
    <div className="flex min-h-screen flex-col bg-bn-bg">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-bn bg-yellow text-black shadow-glow-yellow">
              {step === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
            </div>
            <h1 className="text-2xl font-bold text-bnText-primary">{stepTitle}</h1>
            <p className="mt-2 text-sm text-bnText-secondary">{stepSubtitle}</p>
          </div>

          <Card noPadding className="p-6">
            <div className="p-6">
              {errMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 rounded-bn border border-bnRed/20 bg-bnRed/10 px-4 py-3 text-sm text-bnRed"
                >
                  {errMsg}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {step === 'email' && (
                  <motion.form
                    key="email"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleRequestCode}
                    className="space-y-5"
                  >
                    <Input
                      label="Email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                      Send Reset Code
                    </Button>
                  </motion.form>
                )}

                {step === 'code' && (
                  <motion.form
                    key="code"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleVerifyCode}
                    className="space-y-5"
                  >
                    <Input
                      label="Reset Code"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      icon={<KeyRound className="h-4 w-4" />}
                    />
                    <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                      Verify Code
                    </Button>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="flex w-full items-center justify-center gap-1.5 text-xs text-bnText-secondary transition hover:text-yellow"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back to email
                    </button>
                  </motion.form>
                )}

                {step === 'password' && (
                  <motion.form
                    key="password"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleResetPassword}
                    className="space-y-5"
                  >
                    <Input
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      right={
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-bnText-muted transition hover:text-bnText-primary"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                    <Input
                      label="Confirm New Password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      right={
                        <button
                          type="button"
                          onClick={() => setShowConfirm((s) => !s)}
                          className="text-bnText-muted transition hover:text-bnText-primary"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                    <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                      Reset Password
                    </Button>
                  </motion.form>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-bnGreen/10">
                      <CheckCircle2 className="h-8 w-8 text-bnGreen" />
                    </div>
                    <p className="text-sm text-bnText-secondary">
                      Redirecting you to login...
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-bn bg-yellow py-3 text-sm font-bold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-[0.97] shadow-glow-yellow"
                    >
                      Log In Now
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {step !== 'success' && (
                <p className="mt-6 text-center text-sm text-bnText-secondary">
                  Remember your password?{' '}
                  <Link href="/login" className="font-medium text-yellow transition hover:text-yellow-hover">
                    Log In
                  </Link>
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
