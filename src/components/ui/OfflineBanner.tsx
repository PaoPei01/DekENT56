import { WifiOff } from 'lucide-react';

type OfflineBannerProps = {
  visible: boolean;
  message: string;
};

export function OfflineBanner({ visible, message }: OfflineBannerProps) {
  if (!visible) return null;
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={18} />
      <span>{message}</span>
    </div>
  );
}
