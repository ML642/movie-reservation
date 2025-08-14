// src/components/CustomAlert/CustomAlert.jsx
import  { useEffect, useRef } from "react";
import styles from "./movie_alert.module.css";
import { Link } from "react-router-dom";


export default function CustomAlert({
  open,
  movieTitle,
  theaterName,
  seat,
  showtime,
  onViewReservation,
  onBack
}) {
  const firstButtonRef = useRef(null);

  const seatLabel = Array.isArray(seat) ? seat.join(", ") : seat;

  useEffect(() => {
    if (open && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (open && e.key === "Escape") {
        onBack?.();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onBack]);

  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alertTitle"
        aria-describedby="alertDescription"
      >
        <div className={styles.header}>
          <span className={styles.badge}>Success</span>
        </div>

        <h2 id="alertTitle" className={styles.title}>
          Reservation Confirmed
        </h2>

        <p id="alertDescription" className={styles.description}>
          You booked seat <strong>{seatLabel}</strong>
          {movieTitle && <> for <strong>{movieTitle}</strong></>}
          {theaterName && <> at <strong>{theaterName}</strong></>}
          {showtime && <> on <strong>{showtime}</strong></>}.
        </p>

        <div className={styles.actions}>
          <Link to ={'/my-reservations'}
            className={styles.primaryButton}
            ref={firstButtonRef}
          >
            View my reservation
          </Link>
          <button className={styles.secondaryButton} onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
