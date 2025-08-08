import React from 'react';
import styles from './profile.module.css';

// Dummy user data (replace with real user data from context or API)
const user = {
  name: 'Martin Example',
  email: 'martin@example.com',
  avatar: '', // fallback if empty
  reservations: [
    {
      id: 1,
      movie: 'Inception',
      date: '2025-08-01',
      time: '19:30',
      seat: 'C12',
    },
    {
      id: 2,
      movie: 'Oppenheimer',
      date: '2025-07-20',
      time: '21:00',
      seat: 'A5',
    },
  ],
};

export default function Profile() {
  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>
              {user.name[0]}
            </div>
          )}
        </div>
        <div className={styles.userInfo}>
          <h2 className={styles.userName}>{user.name}</h2>
          <p className={styles.userEmail}>{user.email}</p>
          <button className={styles.editBtn}>Edit Profile</button>
        </div>
      </div>
      <div className={styles.reservationsSection}>
        <h3 className={styles.sectionTitle}>Recent Reservations</h3>
        {user.reservations.length === 0 ? (
          <p className={styles.noReservations}>No reservations yet.</p>
        ) : (
          <ul className={styles.reservationsList}>
            {user.reservations.map((r) => (
              <li key={r.id} className={styles.reservationItem}>
                <span className={styles.movieTitle}>{r.movie}</span>
                <span className={styles.reservationInfo}>{r.date} &bull; {r.time} &bull; Seat {r.seat}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
