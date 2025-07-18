import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text" style={{ width: '60%' }}></div>
      <div className="skeleton-button"></div>
      <div className="shimmer-wrapper"></div>
    </div>
  );
};

export default SkeletonCard;
