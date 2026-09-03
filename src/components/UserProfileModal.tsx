import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  GraduationCap,
  Calendar,
  LogOut,
  Save,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile, logout } = useAuth();
  const { analytics, syncStatus, isOnline } = useStudy();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [upscYear, setUpscYear] = useState(profile?.upscYear || '2026');
  const [targetService, setTargetService] = useState(profile?.targetService || 'IAS');
  const [optionalSubject, setOptionalSubject] = useState(profile?.optionalSubject || 'PSIR');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        upscYear,
        targetService,
        optionalSubject,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyUserId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#18181B] border border-[#27272A] rounded-3xl p-6 sm:p-7 shadow-2xl relative text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#6366F1]/15 text-[#6366F1] flex items-center justify-center border border-[#6366F1]/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Aspirant Profile
                </h2>
                <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5 font-mono">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{isOnline ? 'Cloud Synced' : 'Working Offline'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#71717A] hover:text-white hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {/* Authenticated UID Badge */}
            <div className="p-3 rounded-2xl bg-[#09090B] border border-[#27272A] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                  Isolated User ID
                </span>
                <span className="text-xs font-mono text-zinc-300">
                  {user?.uid ? `${user.uid.slice(0, 16)}...` : 'N/A'}
                </span>
              </div>
              <button
                type="button"
                onClick={copyUserId}
                className="px-2.5 py-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-xs font-mono text-zinc-200 flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedUid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy UID</span>
                  </>
                )}
              </button>
            </div>

            {/* Aspirant Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717A] absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={user?.email || profile?.email || ''}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#27272A]/60 bg-[#09090B]/60 text-zinc-400 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            {/* UPSC Target Config Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Target Year
                </label>
                <select
                  value={upscYear}
                  onChange={(e) => setUpscYear(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs font-mono"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Target Service
                </label>
                <select
                  value={targetService}
                  onChange={(e) => setTargetService(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs font-bold font-mono"
                >
                  <option value="IAS">IAS</option>
                  <option value="IPS">IPS</option>
                  <option value="IFS">IFS</option>
                  <option value="IRS">IRS</option>
                  <option value="IAAS">IAAS</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] mb-1">
                  Optional
                </label>
                <select
                  value={optionalSubject}
                  onChange={(e) => setOptionalSubject(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#27272A] bg-[#09090B] text-white text-xs font-mono"
                >
                  <option value="PSIR">PSIR</option>
                  <option value="Sociology">Sociology</option>
                  <option value="Geography">Geography</option>
                  <option value="History">History</option>
                  <option value="PubAd">Pub Admin</option>
                  <option value="Anthro">Anthro</option>
                  <option value="Economics">Economics</option>
                  <option value="Law">Law</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>
            </div>

            {/* Total Study Accomplished Metric */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-3 rounded-2xl bg-[#09090B] border border-[#27272A]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                  Lifetime Hours Logged
                </span>
                <span className="text-lg font-bold font-mono text-indigo-400">
                  {analytics.totalHours}h
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#09090B] border border-[#27272A]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                  Avg Focus Score
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {analytics.avgFocusScore}/10
                </span>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated & synchronized to Cloud Firestore!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#27272A]">
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await logout();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-[#E4E4E7] font-bold uppercase text-xs tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
