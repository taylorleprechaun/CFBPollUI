import { useState } from 'react';

interface TeamLogoProps {
  logoURL: string;
  teamName: string;
}

export function TeamLogo({ logoURL, teamName }: TeamLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!logoURL || hasError) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
        {teamName.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={logoURL}
      alt={`${teamName} logo`}
      className="w-8 h-8 object-contain"
      onError={() => setHasError(true)}
    />
  );
}
