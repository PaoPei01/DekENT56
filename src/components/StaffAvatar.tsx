import { useEffect, useMemo, useState } from 'react';
import { AvatarPlaceholder } from './ui/AvatarPlaceholder';
import { resolveStaffAvatarUrl } from '../services/staffAvatar';

type StaffAvatarProps = {
  avatarPath?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function StaffAvatar({ avatarPath, avatarUrl, name, size = 'md', className = '' }: StaffAvatarProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(avatarUrl ?? null);
  const profile = useMemo(() => ({ avatar_path: avatarPath ?? null, avatar_url: avatarUrl ?? null }), [avatarPath, avatarUrl]);

  useEffect(() => {
    let active = true;
    setResolvedUrl(avatarUrl ?? null);
    void resolveStaffAvatarUrl(profile).then((url) => {
      if (active) setResolvedUrl(url);
    });
    return () => {
      active = false;
    };
  }, [avatarUrl, profile]);

  return <AvatarPlaceholder src={resolvedUrl} name={name} size={size} className={className} />;
}
