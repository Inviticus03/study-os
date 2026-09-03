import { Subject } from '../types';

export const UPSC_DEFAULT_SUBJECTS: Omit<Subject, 'id' | 'createdAt' | 'userId'>[] = [
  {
    name: 'AMEC (Ancient, Medieval & Culture)',
    category: 'GS',
    color: '#f59e0b', // Amber
    icon: 'Landmark',
    weeklyTargetHours: 4,
    monthlyTargetHours: 18,
  },
  {
    name: 'MIH (Modern Indian History)',
    category: 'GS',
    color: '#ef4444', // Red
    icon: 'History',
    weeklyTargetHours: 4,
    monthlyTargetHours: 18,
  },
  {
    name: 'Economics & Development',
    category: 'GS',
    color: '#10b981', // Emerald
    icon: 'TrendingUp',
    weeklyTargetHours: 5,
    monthlyTargetHours: 22,
  },
  {
    name: 'Geography (Physical & Human)',
    category: 'GS',
    color: '#06b6d4', // Cyan
    icon: 'Globe',
    weeklyTargetHours: 5,
    monthlyTargetHours: 20,
  },
  {
    name: 'Polity & Governance',
    category: 'GS',
    color: '#6366f1', // Indigo
    icon: 'Scale',
    weeklyTargetHours: 6,
    monthlyTargetHours: 25,
  },
  {
    name: 'International Relations (IR)',
    category: 'GS',
    color: '#3b82f6', // Blue
    icon: 'Network',
    weeklyTargetHours: 3,
    monthlyTargetHours: 14,
  },
  {
    name: 'GS3 (Environment, S&T, Security)',
    category: 'GS',
    color: '#14b8a6', // Teal
    icon: 'Shield',
    weeklyTargetHours: 5,
    monthlyTargetHours: 20,
  },
  {
    name: 'GS4 (Ethics, Integrity & Aptitude)',
    category: 'GS',
    color: '#8b5cf6', // Purple
    icon: 'HeartHandshake',
    weeklyTargetHours: 4,
    monthlyTargetHours: 16,
  },
  {
    name: 'Optional Paper 1',
    category: 'OPTIONAL',
    color: '#ec4899', // Pink
    icon: 'GraduationCap',
    weeklyTargetHours: 7,
    monthlyTargetHours: 30,
  },
  {
    name: 'Optional Paper 2',
    category: 'OPTIONAL',
    color: '#d946ef', // Fuchsia
    icon: 'BookMarked',
    weeklyTargetHours: 7,
    monthlyTargetHours: 30,
  },
  {
    name: 'CSAT (Quant, Logic & RC)',
    category: 'CSAT',
    color: '#f97316', // Orange
    icon: 'Calculator',
    weeklyTargetHours: 3,
    monthlyTargetHours: 12,
  },
  {
    name: 'Essay & Current Affairs',
    category: 'ESSAY_CA',
    color: '#64748b', // Slate
    icon: 'FileText',
    weeklyTargetHours: 4,
    monthlyTargetHours: 16,
  },
];
