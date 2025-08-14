import React from 'react';
import QRCode from 'react-qr-code';
import './generate_QR.css';
const QRCodeGenerator = ({ 
  reservationData, 
  isVisible, 
  onClose, 
  size = 256 
}) => {
  if (!isVisible || !reservationData) return null;

  // Create QR data string with reservation details
  const qrData = JSON.stringify({
    ticketId: reservationData.id,
    movie: reservationData.movie,
    date: reservationData.date,
    time: reservationData.time,
    seat: reservationData.seat,
    theater: reservationData.theater,
    verification: `TICKET-${reservationData.id}-${Date.now()}`
  });

  return (
    <div className="qr-overlay">
      <div className="qr-modal">
        <button className="qr-close-btn" onClick={onClose}>
          ✕
        </button>
        
        <div className="qr-code-container">
          <QRCode
            value={qrData}
            size={size}
            style={{ 
              height: "auto", 
              maxWidth: "100%", 
              width: "100%",
              background: 'white',
              padding: '16px',
              borderRadius: '12px'
            }}
            fgColor="#000000"
            bgColor="#ffffff"
            level="M"
          />
        </div>
      </div>
      
    
    </div>
  );
};

export default QRCodeGenerator;