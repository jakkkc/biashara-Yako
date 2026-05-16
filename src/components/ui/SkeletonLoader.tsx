import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  count = 1, 
  height = 'h-4', 
  className = '' 
}) => {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx}
          className={`w-full ${height} bg-slate-800/40 rounded-lg animate-pulse ${className}`}
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  );
};
export default SkeletonLoader;
