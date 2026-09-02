import React from 'react';
import {
  Calculator,
  Atom,
  FlaskConical,
  Code,
  BookOpen,
  Dna,
  Sparkles,
  Globe,
  Music,
  Compass,
  Briefcase,
  Layers,
  GraduationCap,
  FileText,
  Palette,
  Cpu,
} from 'lucide-react';

interface SubjectIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SUBJECT_ICON_OPTIONS = [
  { id: 'Calculator', label: 'Calculator / Math', icon: Calculator },
  { id: 'Atom', label: 'Atom / Physics', icon: Atom },
  { id: 'FlaskConical', label: 'Flask / Chemistry', icon: FlaskConical },
  { id: 'Code', label: 'Code / CS', icon: Code },
  { id: 'BookOpen', label: 'Book / Literature', icon: BookOpen },
  { id: 'Dna', label: 'DNA / Biology', icon: Dna },
  { id: 'Globe', label: 'Globe / History', icon: Globe },
  { id: 'Briefcase', label: 'Briefcase / Business', icon: Briefcase },
  { id: 'Music', label: 'Music / Arts', icon: Music },
  { id: 'Cpu', label: 'Hardware / Tech', icon: Cpu },
  { id: 'Compass', label: 'Compass / Geometry', icon: Compass },
  { id: 'Palette', label: 'Palette / Design', icon: Palette },
  { id: 'FileText', label: 'Document / Notes', icon: FileText },
  { id: 'GraduationCap', label: 'Academic / Degree', icon: GraduationCap },
  { id: 'Sparkles', label: 'Sparkles / General', icon: Sparkles },
];

export const SUBJECT_COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald Green
  '#8b5cf6', // Violet
  '#f59e0b', // Amber Orange
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#64748b', // Slate
  '#d97706', // Ochre
];

export const SubjectIcon: React.FC<SubjectIconProps> = ({ name, className = 'w-5 h-5', style }) => {
  switch (name) {
    case 'Calculator':
      return <Calculator className={className} style={style} />;
    case 'Atom':
      return <Atom className={className} style={style} />;
    case 'FlaskConical':
      return <FlaskConical className={className} style={style} />;
    case 'Code':
      return <Code className={className} style={style} />;
    case 'BookOpen':
      return <BookOpen className={className} style={style} />;
    case 'Dna':
      return <Dna className={className} style={style} />;
    case 'Globe':
      return <Globe className={className} style={style} />;
    case 'Briefcase':
      return <Briefcase className={className} style={style} />;
    case 'Music':
      return <Music className={className} style={style} />;
    case 'Cpu':
      return <Cpu className={className} style={style} />;
    case 'Compass':
      return <Compass className={className} style={style} />;
    case 'Palette':
      return <Palette className={className} style={style} />;
    case 'FileText':
      return <FileText className={className} style={style} />;
    case 'GraduationCap':
      return <GraduationCap className={className} style={style} />;
    default:
      return <Sparkles className={className} style={style} />;
  }
};
