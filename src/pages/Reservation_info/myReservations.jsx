import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './myReservations.module.css';
import { getUserFromToken, isAuthenticated } from '../../utils/jwtDecoder';

// Dummy reservations data (replace with API call)
const dummyReservations = [
  {
    id: 1,
    movie: 'Inception',
    poster: '🎬',
    date: '2025-08-01',
    time: '19:30',
    seat: 'C12',
    status: 'upcoming',
    theater: 'Screen 1',
    price: '$12.50',
    bookingDate: '2025-07-25',
    genre: 'Sci-Fi',
    duration: '148 min',
    rating: 'PG-13'
  },
  {
    id: 2,
    movie: 'Oppenheimer',
    poster: '🎭',
    date: '2025-07-20',
    time: '21:00',
    seat: 'A5',
    status: 'completed',
    theater: 'Screen 2',
    price: '$15.00',
    bookingDate: '2025-07-15',
    genre: 'Biography',
    duration: '180 min',
    rating: 'R',
    userRating: 5
  },
  {
    id: 3,
    movie: 'Dune: Part Two',
    poster: '🚀',
    date: '2025-08-15',
    time: '18:00',
    seat: 'B8',
    status: 'upcoming',
    theater: 'IMAX',
    price: '$18.00',
    bookingDate: '2025-08-01',
    genre: 'Sci-Fi',
    duration: '166 min',
    rating: 'PG-13'
  },
  {
    id: 4,
    movie: 'The Batman',
    poster: '🦇',
    date: '2025-07-10',
    time: '20:00',
    seat: 'D15',
    status: 'cancelled',
    theater: 'Screen 3',
    price: '$13.50',
    bookingDate: '2025-07-05',
    genre: 'Action',
    duration: '176 min',
    rating: 'PG-13'
  },
  {
    id: 5,
    movie: 'Avatar: The Way of Water',
    poster: '🌊',
    date: '2025-08-20',
    time: '19:00',
    seat: 'E10',
    status: 'upcoming',
    theater: 'IMAX',
    price: '$20.00',
    bookingDate: '2025-08-05',
    genre: 'Adventure',
    duration: '192 min',
    rating: 'PG-13'
  }
];

export default function MyReservations() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.key]);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Get user data from JWT token
    const userData = getUserFromToken();
    if (userData) {
      setUser(userData);
      // In a real app, you'd fetch reservations from API using user.id
      setReservations(dummyReservations);
    }
    setLoading(false);
  }, [navigate]);

  // Filter reservations based on active filter
  const filteredReservations = reservations.filter(reservation => {
    if (activeFilter === 'all') return true;
    return reservation.status === activeFilter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: '🎬 Upcoming', class: styles.upcomingBadge },
      completed: { text: '✅ Completed', class: styles.completedBadge },
      cancelled: { text: '❌ Cancelled', class: styles.cancelledBadge }
    };
    return badges[status] || badges.upcoming;
  };

  const handleCancelReservation = (reservationId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      setReservations(prev => 
        prev.map(res => 
          res.id === reservationId 
            ? { ...res, status: 'cancelled' }
            : res
        )
      );
    }
  };

  const handleRateMovie = (reservationId, rating) => {
    setReservations(prev => 
      prev.map(res => 
        res.id === reservationId 
          ? { ...res, userRating: rating }
          : res
      )
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading your reservations...</p>
        </div>
      </div>
    );
  }

  // Show error if no user data
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Unable to load reservations</h2>
          <p>Please try logging in again.</p>
          <button onClick={() => navigate('/login')} className={styles.loginBtn}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const upcomingCount = reservations.filter(r => r.status === 'upcoming').length;
  const completedCount = reservations.filter(r => r.status === 'completed').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.animatedBackground}>
        <div className={styles.bgOrb1}></div>
        <div className={styles.bgOrb2}></div>
        <div className={styles.bgOrb3}></div>
      </div>

      <div className={styles.reservationsContainer}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>🎫 My Reservations</h1>
          <p className={styles.subtitle}>Manage your movie bookings and tickets</p>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{reservations.length}</span>
              <span className={styles.statLabel}>Total Bookings</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{upcomingCount}</span>
              <span className={styles.statLabel}>Upcoming</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{completedCount}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{cancelledCount}</span>
              <span className={styles.statLabel}>Cancelled</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button 
            className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            📋 All ({reservations.length})
          </button>
          <button 
            className={`${styles.filterBtn} ${activeFilter === 'upcoming' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            🎬 Upcoming ({upcomingCount})
          </button>
          <button 
            className={`${styles.filterBtn} ${activeFilter === 'completed' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            ✅ Completed ({completedCount})
          </button>
          <button 
            className={`${styles.filterBtn} ${activeFilter === 'cancelled' ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter('cancelled')}
          >
            ❌ Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Reservations List */}
        <div className={styles.reservationsList}>
          {filteredReservations.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎭</span>
              <h3 className={styles.emptyTitle}>No reservations found</h3>
              <p className={styles.emptyText}>
                {activeFilter === 'all' 
                  ? "You haven't made any movie reservations yet."
                  : `No ${activeFilter} reservations found.`
                }
              </p>
              <button 
                onClick={() => navigate('/movies')} 
                className={styles.bookNowBtn}
              >
                🎬 Browse Movies
              </button>
            </div>
          ) : (
            filteredReservations.map((reservation) => {
              const statusBadge = getStatusBadge(reservation.status);
              
              return (
                <div key={reservation.id} className={styles.reservationCard}>
                  <div className={styles.moviePoster}>{reservation.poster}</div>
                  
                  <div className={styles.reservationDetails}>
                    <div className={styles.movieHeader}>
                      <h3 className={styles.movieTitle}>{reservation.movie}</h3>
                      <span className={statusBadge.class}>{statusBadge.text}</span>
                    </div>
                    
                    <div className={styles.movieInfo}>
                      <span className={styles.infoItem}>🎭 {reservation.genre}</span>
                      <span className={styles.infoItem}>⏱️ {reservation.duration}</span>
                      <span className={styles.infoItem}>🔞 {reservation.rating}</span>
                    </div>
                    
                    <div className={styles.bookingDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>📅 Show Date:</span>
                        <span className={styles.detailValue}>{reservation.date} at {reservation.time}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>🎪 Theater:</span>
                        <span className={styles.detailValue}>{reservation.theater}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>💺 Seat:</span>
                        <span className={styles.detailValue}>{reservation.seat}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>💰 Price:</span>
                        <span className={styles.detailValue}>{reservation.price}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>📝 Booked:</span>
                        <span className={styles.detailValue}>{reservation.bookingDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.reservationActions}>
                    {reservation.status === 'upcoming' && (
                      <>
                        <button className={styles.primaryBtn}>
                          🎫 View Ticket
                        </button>
                        <button className={styles.secondaryBtn}>
                          📱 QR Code
                        </button>
                        <button 
                          className={styles.dangerBtn}
                          onClick={() => handleCancelReservation(reservation.id)}
                        >
                          ❌ Cancel
                        </button>
                      </>
                    )}
                    
                    {reservation.status === 'completed' && (
                      <>
                        <button className={styles.secondaryBtn}>
                          🔄 Book Again
                        </button>
                        {!reservation.userRating ? (
                          <button 
                            className={styles.primaryBtn}
                            onClick={() => handleRateMovie(reservation.id, 5)}
                          >
                            ⭐ Rate Movie
                          </button>
                        ) : (
                          <div className={styles.ratingDisplay}>
                            <span>Your Rating: </span>
                            <span className={styles.stars}>
                              {'⭐'.repeat(reservation.userRating)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {reservation.status === 'cancelled' && (
                      <button className={styles.secondaryBtn}>
                        🔄 Book Again
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
