import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'full' | 'emblem' | 'white-text';
  height?: number | string;
}

export const BrandEmblem: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-7", 
  size 
}) => {
  return (
    <svg 
      viewBox="0 0 985 410" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      style={size ? { width: size, height: size * 0.42 } : undefined}
    >
      {/* Lower wave in brand teal #00bfb3 */}
      <path 
        fill="#1dbab0" 
        d="M982.29,317.6c-88.79-70.07-163.92-100.61-236.46-96.04-64.75,4.06-119.3,35.5-177.06,68.78C442.74,362.97,299.26,445.1,3.03,254.98c-.9-.58-2.11-.32-2.7.58-.59.91-.33,2.11.57,2.7l120.37,78.85c83.75,50.79,152.7,69.65,212.61,69.65,88.15,0,156.7-40.85,223.87-80.88,115.22-68.67,224.06-133.53,422.26-5.09.88.57,2.05.34,2.66-.5.61-.85.44-2.03-.38-2.68Z"
      />
      {/* Upper wave in accurate brand marine navy #023e63 */}
      <path 
        fill="currentColor" 
        d="M982.89,224.27c-.32-1.14-1.47-1.84-2.62-1.6-52.94,10.8-117.18-16.72-185.19-45.86-110.47-47.32-235.69-100.96-348.5-5.57-16.22,13.71-54.46,62.37-57.86,67.39-9.68,14.28-20.36,21.33-32.65,21.55-37.84.82-85.47-64.55-131.6-127.62C173.18,62.43,120.16-10.09,76.21,1.16,40.73,10.24,15.81,73.18.02,193.59c-.15,1.18.63,2.27,1.79,2.5,1.16.22,2.31-.48,2.62-1.62C28.31,106.07,55.22,60.35,86.69,54.7c42.24-7.62,90.02,59.55,136.26,124.47,47.45,66.62,96.51,135.5,145.33,136.3.3,0,.59,0,.89,0,19.99,0,38.17-11.09,55.56-33.88,133.15-174.06,249.35-128.02,361.73-83.49,67.32,26.68,130.92,51.88,195.02,28.89,1.11-.4,1.73-1.59,1.41-2.73Z"
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "h-9", 
  variant = 'white-text' 
}) => {
  if (variant === 'emblem') {
    return <BrandEmblem className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <BrandEmblem className="w-9 h-6 shrink-0 text-ink" />
      <div className="leading-tight hidden min-[420px]:block">
        <div className="text-[13px] font-semibold tracking-tight text-ink">Harbour &amp; Hills</div>
        <div className="text-[11px] text-ink-3">Payments API</div>
      </div>
    </div>
  );
};
