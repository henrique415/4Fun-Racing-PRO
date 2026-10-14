import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

interface DriverAvatarProps {
  name: string;
  avatarUrl?: string;
  teamColor?: string;
  kartNumber?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DriverAvatar: React.FC<DriverAvatarProps> = ({
  name,
  avatarUrl,
  teamColor = '#EF4444',
  kartNumber,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-20 h-20 text-xl font-mono',
  };

  const initials = (name || 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border border-zinc-700/80 bg-zinc-900 flex-shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
        {kartNumber && size === 'xl' && (
          <span className="absolute bottom-1 right-1 bg-black/80 border border-zinc-700 text-white text-[10px] font-mono px-1 rounded">
            #{kartNumber}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full font-black text-white flex-shrink-0 shadow-inner border border-white/20 select-none ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: teamColor || '#DC2626',
      }}
      title={`${name}${kartNumber ? ` (#${kartNumber})` : ''}`}
    >
      <span>{kartNumber && size === 'sm' ? `#${kartNumber}` : initials || <UserIcon className="w-3.5 h-3.5" />}</span>
      {kartNumber && size !== 'sm' && size !== 'xl' && (
        <span className="absolute -bottom-1 -right-1 bg-zinc-950 border border-zinc-800 text-zinc-200 text-[9px] font-mono px-1 rounded-full scale-90">
          #{kartNumber}
        </span>
      )}
    </div>
  );
};
