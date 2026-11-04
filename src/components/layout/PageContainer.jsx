import React from 'react';

export default function PageContainer({
  children,
  className = '',
  maxWidth = 'max-w-7xl',
}) {
  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 py-6 mx-auto ${maxWidth} ${className}`}>
      {children}
    </div>
  );
}
