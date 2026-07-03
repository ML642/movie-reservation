import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './profile.module.css';
import { getUserFromToken, isAuthenticated } from '../../utils/jwtDecoder';
import axios from "axios" ;
import TicketQR from '../Reservation_info/generate_QR';
import {Link} from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { FaCrown, FaFilm, FaStar, FaTicketAlt, FaUser, FaVideo } from 'react-icons/fa';
import { getStoredUserIcon, setStoredUserIcon, USER_ICON_OPTIONS } from '../../utils/userIcon';


export default  function Profile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [alertQr , setAlertQr] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(getStoredUserIcon);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  
  const userData1 = getUserFromToken();
  const tokenUserId = userData1?.id;
  const tokenUserName = userData1?.name;
  const tokenUserEmail = userData1?.email;
  const tokenUserAvatar = userData1?.avatar;
  const tokenUserRole = userData1?.role;
  const tokenIssuedAt = userData1?.iat;
    
  const navigate = useNavigate();


  
  useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!isAuthenticated() || !token || !tokenUserId) {
      navigate('/login');
      setLoading(false);
      return;
    }

    const getFallbackUser = (reservationsData = []) => ({
      name: tokenUserName || localStorage.getItem('username') || 'User',
      email: tokenUserEmail || localStorage.getItem('userEmail') || 'No email provided',
      avatar: tokenUserAvatar || '',
      memberSince: tokenIssuedAt ? new Date(tokenIssuedAt * 1000).getFullYear() : '2024',
      totalReservations: reservationsData.length,
      favoriteGenre: 'Action',
      reservations: reservationsData,
      id: tokenUserId,
      role: tokenUserRole
    });

    let reservationsData = [];

    try {
      const resReservations = await axios.post(
        `${API_BASE_URL}/api/reservation/id`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      reservationsData = resReservations.data.data || [];
    } catch (err) {
      console.error("Error fetching reservations:", err);
      if (err.response?.status === 401) {
        navigate('/login');
        setLoading(false);
        return;
      }
    }

    setReservations(reservationsData);

    try {
      const resUser = await axios.post(
        `${API_BASE_URL}/api/userInfo`,
        { userId: tokenUserId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const userData = resUser.data;

      const formattedUser = {
        name: userData?.name || userData?.username || 'User',
        email: userData?.email || localStorage.getItem('userEmail') || 'No email provided',
        avatar: userData?.avatar || userData?.picture || '',
        memberSince: userData?.createdAt ? new Date(userData.createdAt).getFullYear() : '2024',
        totalReservations: reservationsData.length,
        favoriteGenre: userData?.favoriteGenre || 'Action',
        reservations: reservationsData,
        id: userData?.id || tokenUserId,
        role: userData?.role || tokenUserRole
      };

      setUser(formattedUser);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        setLoading(false);
        return;
      }

      if (err.response?.status === 404) {
        console.warn('User profile was not found on backend. Falling back to token/local storage data.');
      } else {
        console.error("Error fetching user profile:", err);
      }

      setUser(getFallbackUser(reservationsData));
    }

    setLoading(false);
  };

  fetchData();
}, [navigate, tokenIssuedAt, tokenUserAvatar, tokenUserEmail, tokenUserId, tokenUserName, tokenUserRole]);
    
    console.log(  "Reservations:", reservations);
    
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.key]);

 



  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error if no user data
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Unable to load profile</h2>
          <p>Please try logging in again.</p>
          <button onClick={() => navigate('/login')} className={styles.loginBtn}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const upcomingReservations = user.reservations.filter(r => r.status === 'upcoming');
  const pastReservations = user.reservations.filter(r => r.status === 'completed');
  const userInitials = user.name.split(' ').map(n => n[0]).join('');

  const renderUserIcon = (iconId = selectedIcon) => {
    if (iconId === 'film') return <FaFilm />;
    if (iconId === 'ticket') return <FaTicketAlt />;
    if (iconId === 'star') return <FaStar />;
    if (iconId === 'video') return <FaVideo />;
    if (iconId === 'crown') return <FaCrown />;
    return userInitials || <FaUser />;
  };

  const handleIconSelect = (iconId) => {
    setSelectedIcon(iconId);
    setStoredUserIcon(iconId);
    setIsIconPickerOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.animatedBackground}>
        <div className={styles.bgOrb1}></div>
        <div className={styles.bgOrb2}></div>
        <div className={styles.bgOrb3}></div>
      </div>

      <div className={styles.profileContainer}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <button
              type="button"
              className={styles.avatarWrapper}
              onClick={() => setIsIconPickerOpen((isOpen) => !isOpen)}
              aria-label="Change profile icon"
              title="Change profile icon"
            >
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>
                  {renderUserIcon()}
                </div>
              )}
              <div className={styles.avatarBadge}>👑</div>
            </button>

            {isIconPickerOpen && (
              <div className={styles.iconPicker}>
                {USER_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.iconChoice} ${selectedIcon === option.id ? styles.selectedIcon : ''}`}
                    onClick={() => handleIconSelect(option.id)}
                    aria-label={`Use ${option.label} profile icon`}
                  >
                    <span>{renderUserIcon(option.id)}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            )}

          </div>
          
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{user.name}</h1>
            <p className={styles.userEmail}>✉️ {user.email}</p>
            <p className={styles.memberSince}>🎭 Member since {user.memberSince}</p>
            
            <div className={styles.userStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{reservations.reduce((value,obj,inde)=>{if(obj.status==="completed") value++ ; return value},0)}</span>
                <span className={styles.statLabel}>Movies Watched</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{upcomingReservations.length}</span>
                <span className={styles.statLabel}>Upcoming</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{user.favoriteGenre}</span>
                <span className={styles.statLabel}>Favorite Genre</span>
              </div>
            </div>
            
 
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabNavigation}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            🎬 Upcoming ({upcomingReservations.length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📚 History ({pastReservations.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.quickActions}>
                <h3 className={styles.sectionTitle}>🚀 Quick Actions</h3>
                <div className={styles.actionGrid}>
                  <Link to="/movie_list" className={styles.actionCard}>
                    <span className={styles.actionIcon}>🎫</span>
                    <span className={styles.actionText}>Book New Ticket</span>
                  </Link>
                  <Link to="/pricing"className={styles.actionCard}>
                    <span className={styles.actionIcon}>💰</span>
                    <span className={styles.actionText}>View Pricing</span>
                  </Link>
                  <Link to="/pricing" className={styles.actionCard}>
                    <span className={styles.actionIcon}>🎁</span>
                    <span className={styles.actionText}>Rewards & Offers</span>
                  </Link>
                 
                </div>
              </div>
              {/*HARDCODED DATA FOR DEMO PURPOSEs*/}
              <div className={styles.recentActivity}>
                <h3 className={styles.sectionTitle}>📈 Recent Activity</h3>
                <div className={styles.activityList}>
              <div className={styles.activityItem}>
                    <span className={styles.activityIcon}>🎁</span>
                    <span className={styles.activityText}>Earned loyalty points</span>
                    <span className={styles.activityTime}>1 weeks ago</span>
                  </div> <div className={styles.activityItem}>
                    <span className={styles.activityIcon}>🎁</span>
                    <span className={styles.activityText}>Earned loyalty points</span>
                    <span className={styles.activityTime}>2 weeks ago</span>
                  </div>
                  <div className={styles.activityItem}>
                    <span className={styles.activityIcon}>🎁</span>
                    <span className={styles.activityText}>Earned loyalty points</span>
                    <span className={styles.activityTime}>3 weeks ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className={styles.reservationsTab}>
              <h3 className={styles.sectionTitle}>🎬 Upcoming Movies</h3>
              {upcomingReservations.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>🎭</span>
                  <p className={styles.emptyText}>No upcoming reservations</p>
                  <button className={styles.bookNowBtn}>📅 Book Now</button>
                </div>
              ) : (
                <div className={styles.reservationsList}>
                  {upcomingReservations.map((r) => (
                    
                    <div key={r.id} className={styles.reservationCard}>

                      <div className={styles.moviePoster}>{<img style={{width:"100%"}} src={r.poster} alt="failed to load"/> }</div>
                       {<TicketQR 
                    reservationData={r} 
                    isVisible={alertQr === r.id} 
                    onClose={() => setAlertQr(false)} 
                  />}
                      <div className={styles.reservationDetails}>
                        
                        <h4 className={styles.movieTitle}>{r.movie}</h4>
                        <div className={styles.reservationInfo}>
                          <span className={styles.infoItem}>📅 {r.date}</span>
                          <span className={styles.infoItem}>🕐 {r.time}</span>
                          <span className={styles.infoItem}>🎪 {r.theater}</span>
                          <span className={styles.infoItem}>💺 Seat {r.seat}</span>
                        </div>
                      </div>
                      <div className={styles.reservationActions}>
                        <button className={styles.actionBtnSecondary} onClick={()=>{setAlertQr(r.id)}}>📱 QR Code</button>
                       
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className={styles.reservationsTab}>
              <h3 className={styles.sectionTitle}>📚 Movie History</h3>
              {pastReservations.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📽️</span>
                  <p className={styles.emptyText}>No movie history yet</p>
                </div>
              ) : (
                <div className={styles.reservationsList}>
                  {pastReservations.map((r) => (
                    <div key={r.id} className={`${styles.reservationCard} ${styles.pastReservation}`}>
                      <div className={styles.moviePoster}>{<img style={{width:"100%"}} src={r.poster} alt="failed to load"/> }</div>
                      <div className={styles.reservationDetails}>
                        <h4 className={styles.movieTitle}>{r.movie}</h4>
                        <div className={styles.reservationInfo}>
                          <span className={styles.infoItem}>📅 {r.date}</span>
                          <span className={styles.infoItem}>🕐 {r.time}</span>
                          <span className={styles.infoItem}>🎪 {r.theater}</span>
                          <span className={styles.infoItem}>💺 Seat {r.seat}</span>
                        </div>
                      </div>
                      <div className={styles.reservationActions}>
                        <button className={styles.actionBtnSecondary}>⭐ Rate Movie</button>
                        <button className={styles.actionBtnSecondary}>🔄 Book Again</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
