import React from 'react';
import WorldClock from './WorldClock';

export const WorldClockPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <WorldClock />
    </div>
  );
};
