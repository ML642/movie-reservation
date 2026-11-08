import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './myReservations.module.css';
import { getUserFromToken, isAuthenticated } from '../../utils/jwtDecoder';
import axios from 'axios';
import { Link } from 'react-router-dom';
import TicketQR from './generate_QR';
import { API_BASE_URL } from '../../config/api';
export default function MyReservations() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
 
  const location = useLocation();
  const navigate = useNavigate();
   const [alertQr , setAlertQr] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      const token = localStorage.getItem('token');
      if (!isAuthenticated() || !token) {
        navigate('/login');
        setLoading(false);
        return;
      }

      const userData = getUserFromToken();
      if (!userData) {
        navigate('/login');
        setLoading(false);
        return;
      }

      setUser(userData);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/reservation/id`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setReservations(response.data.data);
        }
      } catch (error) {
        console.log("Error fetching reservations:", error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [navigate]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.key]);
  
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
      )
      
       try {

          axios.delete(`${API_BASE_URL}/api/reservation/delete/${reservationId}`,{
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })}
      catch (error) {
        console.error("Error cancelling reservation:", error);
        alert("Failed to cancel reservation. Please try again later.");
      }
      
      ;
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
                onClick={() => navigate('/movie_list')} 
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
                  <div className={styles.moviePoster}>{<img style={{width:"100%"}} src={reservation.poster} alt="failed to load"/> } </div>
                  {<TicketQR 
                    reservationData={reservation} 
                    isVisible={alertQr === reservation.id} 
                    onClose={() => setAlertQr(false)} 
                  />}
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
                        <button className={styles.secondaryBtn} onClick= {()=>setAlertQr(reservation.id)}>
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
                      <Link to ="/movie_list">
                        <button className={styles.secondaryBtn}>
                          🔄 Book Again
                        </button> </Link>
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
                     <Link to = "/movie_list">

                      <button className={styles.secondaryBtn}>
                        🔄 Book Again
                      </button>
                      </Link>
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
