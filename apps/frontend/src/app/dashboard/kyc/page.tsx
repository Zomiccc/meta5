'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import {
  FileText,
  CreditCard,
  Camera,
  CheckCircle,
  Loader2,
  XCircle,
  Upload,
  ScanFace,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function KycPage() {
  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  useEffect(() => {
    api.get('/kyc').then((res) => setKyc(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!kyc || kyc.status !== 'pending') return;
    const interval = setInterval(() => {
      api
        .get('/kyc')
        .then((res) => setKyc(res.data))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [kyc?.status]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnicFront || !cnicBack || !selfie) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('cnicFront', cnicFront);
    formData.append('cnicBack', cnicBack);
    formData.append('selfie', selfie);
    try {
      const res = await api.post('/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setKyc(res.data);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'KYC verification failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 0, label: 'CNIC Front', icon: CreditCard },
    { num: 1, label: 'CNIC Back', icon: FileText },
    { num: 2, label: 'Selfie', icon: Camera },
  ];

  const isApproved = kyc?.status === 'approved';
  const isRejected = kyc?.status === 'rejected';
  const isPending = kyc?.status === 'pending';

  const FileUpload = ({ file, setFile, label, icon: Icon }: any) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-white/70">{label}</label>
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="flex-1 truncate text-sm text-white">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} className="text-white/40 hover:text-red-400">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-navy-600 bg-navy-900/30 p-6 transition hover:border-gold hover:bg-navy-800/30">
          <Icon className="h-8 w-8 text-white/30" />
          <span className="text-sm text-white/50">Click to upload</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFile(e.target.files[0]);
                if (step < 2) setStep(step + 1);
              }
            }}
          />
        </label>
      )}
    </div>
  );

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
        <p className="text-white/50">AI-powered identity verification in 3 simple steps</p>
      </div>

      <div className="mx-auto max-w-2xl">
        {kyc && (isApproved || isPending || isRejected) && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border p-4 animate-slide-up ${
              isApproved
                ? 'border-green-500/20 bg-green-500/10'
                : isRejected
                ? 'border-red-500/20 bg-red-500/10'
                : 'border-yellow-500/20 bg-yellow-500/10'
            }`}
          >
            {isApproved ? (
              <ShieldCheck className="h-6 w-6 text-green-400" />
            ) : isRejected ? (
              <AlertCircle className="h-6 w-6 text-red-400" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
            )}
            <div>
              <p className={`font-medium ${isApproved ? 'text-green-300' : isRejected ? 'text-red-300' : 'text-yellow-300'}`}>
                {isApproved ? 'Verified' : isRejected ? 'Verification Rejected' : 'Verification in Progress'}
              </p>
              {isPending && <p className="text-xs text-white/50">Your documents are being analyzed. This may take a few moments.</p>}
              {isRejected && kyc.rejectionReason && (
                <div className="mt-2 rounded bg-red-500/10 px-3 py-2 text-xs text-red-300/90">
                  <p className="font-semibold mb-1">Rejection reason:</p>
                  <p>{kyc.rejectionReason}</p>
                </div>
              )}
              {isApproved && <p className="text-xs text-green-300/80">Your identity has been verified. MT5 account is ready.</p>}
            </div>
          </div>
        )}

        {isApproved ? (
          <div className="card animate-slide-up text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
              <ShieldCheck className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">KYC Complete</h3>
            <p className="mt-2 text-sm text-white/50">Your account is fully verified. You can now deposit and trade.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isDone = (s.num === 0 && cnicFront) || (s.num === 1 && cnicBack) || (s.num === 2 && selfie);
                const isCurrent = step === s.num;
                return (
                  <div key={s.num} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all sm:h-10 sm:w-10 sm:rounded-xl ${
                          isDone
                            ? 'bg-green-500/10 text-green-400'
                            : isCurrent
                            ? 'bg-gold/10 text-gold animate-pulse-gold'
                            : 'bg-navy-800 text-white/30'
                        }`}
                      >
                        {isDone ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </div>
                      <span className={`text-[10px] sm:text-xs ${isCurrent || isDone ? 'text-white' : 'text-white/30'}`}>{s.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`mx-1 h-0.5 flex-1 sm:mx-2 ${isDone ? 'bg-green-500/30' : 'bg-navy-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={submit} className="card animate-slide-up space-y-5">
              <FileUpload file={cnicFront} setFile={setCnicFront} label="Step 1: CNIC Front Side" icon={CreditCard} />
              <FileUpload file={cnicBack} setFile={setCnicBack} label="Step 2: CNIC Back Side" icon={FileText} />
              <FileUpload file={selfie} setFile={setSelfie} label="Step 3: Selfie (Face Verification)" icon={ScanFace} />

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !cnicFront || !cnicBack || !selfie}
                className="btn-gold w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying documents...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Submit for Verification
                  </span>
                )}
              </button>

              <div className="flex items-start gap-2 rounded-lg bg-navy-900/50 p-3 text-xs text-white/40">
                <Upload className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <p>Upload clear photos of your CNIC (both sides) and a selfie. Your documents will be reviewed and verified by our compliance team. You will be notified once your KYC is approved.</p>
              </div>
            </form>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
