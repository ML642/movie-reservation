import './spinner.css';


const MorphingSpinner = ({ 
  size = 'medium',
  speed = 'normal',
  color = 'cosmic',
  glow = true,
  className = ''
}) => {
  
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