const reportWebVitals = (onPerfEntry) => {
  if (typeof onPerfEntry !== 'function') {
    return;
  }

  // web-vitals v4 reports INP, which replaced FID as the interaction metric.
  // The library is loaded lazily so it does not block the application bootstrap.
  import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  });
};

export default reportWebVitals;
