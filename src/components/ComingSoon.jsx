import React from 'react';

const ComingSoon = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">🚧</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title || "Coming Soon"}</h2>
      <p className="text-gray-500 max-w-md">
        This module is currently under development. Please check back later or proceed with the Inventory & Sales modules which are fully active.
      </p>
    </div>
  );
};

export default ComingSoon;
