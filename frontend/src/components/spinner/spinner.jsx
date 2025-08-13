import React from 'react';
import './spinner.css';

/**
 * MorphingSpinner - A shape-shifting spinner component
 * 
 * Props:
 * @param {string} size - 'small' | 'medium' | 'large' | 'xlarge'
 * @param {string} speed - 'slow' | 'normal' | 'fast' 
 * @param {string} color - 'cosmic' | 'fire' | 'ocean' | 'sunset' | 'aurora' | 'gold' | 'rainbow'
 * @param {boolean} glow - Enable/disable glow effect
 * @param {string} className - Additional CSS classes
 */
const MorphingSpinner = ({ 
  size = 'medium',
  speed = 'normal',
  color = 'cosmic',
  glow = true,
  className = ''
}) => {
  
  // Build CSS class names based on props
  const spinnerClasses = [
    'morphing-spinner',
    `morphing-spinner--${size}`,
    `morphing-spinner--${speed}`,
    `morphing-spinner--${color}`,
    glow ? 'morphing-spinner--glow' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={spinnerClasses} />
  );
};

export default MorphingSpinner;