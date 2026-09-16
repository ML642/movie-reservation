const reportWebVitals = (onPerfEntry) => {
  if (typeof onPerfEntry !== 'function') {
    return;
  }

 
  import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  });
};

export default reportWebVitals;
