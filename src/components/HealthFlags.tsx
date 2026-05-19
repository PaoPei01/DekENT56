import { AlertTriangle, HeartPulse, Pill } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Profile } from '../lib/types';

type Props = {
  profile: Pick<Profile, 'food_allergy' | 'disease' | 'drug_allergy'>;
  detail?: boolean;
};

function hasValue(value?: string | null) {
  return Boolean(value && value.trim() && !['-', 'ไม่มี', 'none', 'no', 'n/a'].includes(value.trim().toLowerCase()));
}

export function hasHealthFlag(profile: Props['profile'], type?: 'disease' | 'drug_allergy' | 'food_allergy') {
  if (type) return hasValue(profile[type]);
  return hasValue(profile.disease) || hasValue(profile.drug_allergy) || hasValue(profile.food_allergy);
}

export function HealthFlags({ profile, detail = false }: Props) {
  const { language } = useLanguage();
  const flags = [
    { key: 'disease', label: language === 'th' ? 'โรคประจำตัว' : 'Medical condition', icon: <HeartPulse size={14} />, value: profile.disease },
    { key: 'drug_allergy', label: language === 'th' ? 'แพ้ยา' : 'Drug allergy', icon: <Pill size={14} />, value: profile.drug_allergy },
    { key: 'food_allergy', label: language === 'th' ? 'แพ้อาหาร' : 'Food allergy', icon: <AlertTriangle size={14} />, value: profile.food_allergy },
  ].filter((item) => hasValue(item.value));

  if (!flags.length) return null;

  return (
    <div className={`health-flags ${detail ? 'health-flags-detail' : ''}`}>
      {flags.map((flag) => (
        <span key={flag.key} title={`${flag.label}: ${flag.value}`}>
          {flag.icon}
          <strong>{flag.label}</strong>
          {detail ? <em>{flag.value}</em> : null}
        </span>
      ))}
    </div>
  );
}
