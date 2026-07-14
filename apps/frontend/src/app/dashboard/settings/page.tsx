'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { User, Mail, Phone, Lock, Globe, Moon, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        setForm({ name: res.data.name || '', phone: res.data.phone || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/me', form);
      success('Profile updated successfully');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      error('New passwords do not match');
      return;
    }
    if (passwordForm.new.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', passwordForm);
      success('Password changed successfully');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      error(err.response?.data?.message || 'Password change is not available or failed');
    } finally {
      setSaving(false);
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
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-bnText-primary">Profile Settings</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                icon={<User className="h-4 w-4" />}
              />
              <Input label="Email" value={user?.email || ''} disabled icon={<Mail className="h-4 w-4" />} />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                icon={<Phone className="h-4 w-4" />}
              />
              <Button type="submit" variant="primary" isLoading={saving}>
                Save Changes
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-bnText-primary">Security</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                icon={<Lock className="h-4 w-4" />}
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                icon={<Lock className="h-4 w-4" />}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                icon={<Lock className="h-4 w-4" />}
              />
              <Button type="submit" variant="primary">
                Change Password
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-bnText-primary">Account Status</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-bnText-secondary">KYC</span>
                <Badge color={user?.kyc?.status === 'approved' ? 'success' : 'warning'}>
                  {user?.kyc?.status || 'Not submitted'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-bnText-secondary">Account</span>
                <Badge color={user?.status === 'active' ? 'success' : 'default'}>{user?.status || 'active'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-bnText-secondary">Role</span>
                <span className="capitalize text-bnText-primary">{user?.role || 'client'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-bnText-primary">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-bnText-secondary">
                  <Globe className="h-4 w-4" /> Language
                </div>
                <select className="bn-select w-32">
                  <option>English</option>
                  <option>Urdu</option>
                  <option>Arabic</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-bnText-secondary">
                  <Moon className="h-4 w-4" /> Theme
                </div>
                <select className="bn-select w-32">
                  <option>Dark</option>
                  <option>Light</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
