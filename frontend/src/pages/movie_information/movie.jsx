import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft,
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaStar,
  FaPlay,
  FaTicketAlt,
  FaUsers
} from 'react-icons/fa';
import styles from './movie.module.css';
import MorphingSpinner from '../../components/spinner/spinner';
import CustomAlert from './movie_alert.jsx';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const THEATERS = [
  { id: 1, name: 'Cineplex Downtown', location: '123 Movie St, City' },
  { id: 2, name: 'MegaPlex Mall', location: '456 Cinema Ave, Town' },
  { id: 3, name: 'Starlight Theater', location: '789 Film Blvd, Village' },
];

const SHOWTIMES = ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM', '10:00 PM'];
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const SEATS_PER_ROW = 10;

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toBookingIso = (date) => `${toDateKey(date)}T12:00:00.000Z`;

const Movie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(THEATERS[0].id);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(SHOWTIMES[0]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeatSet, setBookedSeatSet] = useState(new Set());
  const [seatSyncUnavailable, setSeatSyncUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.key]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}`,
          {
            params: {
              api_key: API_KEY,
              append_to_response: 'credits,videos,images',
            },
          }
        );
        setMovie(data);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  const fetchBookedSeats = useCallback(async () => {
    if (!process.env.REACT_APP_API_URL || !id) {
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reservation/seats`, {
        params: {
          movieId: id,
          theaterId: selectedTheater,
          date: toDateKey(selectedDate),
          time: selectedTime,
        },
      });

      const taken = Array.isArray(response.data?.bookedSeats) ? response.data.bookedSeats : [];
      const takenSet = new Set(taken);
      setSeatSyncUnavailable(false);
      setBookedSeatSet(takenSet);
      setSelectedSeats((prev) => prev.filter((seatId) => !takenSet.has(seatId)));
    } catch (seatError) {
      console.error('Error fetching booked seats:', seatError);
      setSeatSyncUnavailable(true);
    }
  }, [id, selectedTheater, selectedDate, selectedTime]);

  useEffect(() => {
    fetchBookedSeats();
  }, [fetchBookedSeats]);

  const toggleSeat = (seatId) => {
    if (bookedSeatSet.has(seatId)) {
      return;
    }
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((idValue) => idValue !== seatId)
        : [...prev, seatId]
    );
  };

  const createReservation = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to make a reservation');
      navigate('/login');
      setIsLoading(false);
      return;
    }

    try {
      const reservationData = {
        jwt: token,
        movieId: id,
        movieName: movie.title,
        moviePoster: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : 'https://via.placeholder.com/500x750?text=No+Poster',
        theaterId: selectedTheater,
        theaterName: THEATERS.find((t) => t.id === selectedTheater)?.name,
        movieDuration: movie.runtime,
        movieGenre: movie.genres?.map((g) => g.name).join(', ') || 'N/A',
        bookingDate: toBookingIso(selectedDate),
        showtime: selectedTime,
        seats: selectedSeats,
        totalPrice: (selectedSeats.length * 12.99).toFixed(2),
        isLoggedIN: true,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reservation`,
        reservationData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        setBookedSeatSet((prev) => {
          const next = new Set(prev);
          selectedSeats.forEach((seatId) => next.add(seatId));
          return next;
        });
        setAlertData({
          movieTitle: movie.title,
          theaterName: THEATERS.find((t) => t.id === selectedTheater)?.name,
          seat: selectedSeats,
          showtime: selectedTime,
        });
        setSelectedSeats([]);
        await fetchBookedSeats();
      }
    } catch (requestError) {
      const status = requestError.response?.status;
      if (status === 401) {
        alert('Please log in to make a reservation');
        navigate('/login');
      } else if (status === 409) {
        const conflictSeats = requestError.response?.data?.conflictingSeats || [];
        alert(
          conflictSeats.length
            ? `Seats already taken: ${conflictSeats.join(', ')}`
            : 'Some seats were just taken. Please pick different seats.'
        );
        await fetchBookedSeats();
      } else {
        alert(requestError.response?.data?.message || 'Reservation failed. Please try again.');
      }
      console.log(requestError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    void createReservation();
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.moviePage}>
      <div
        className={styles.movieHero}
        style={{
          backgroundImage: movie.backdrop_path
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className={styles.heroContent}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back to Movies
          </button>

          <div className={styles.movieHeader}>
            <div className={styles.moviePoster}>
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                />
              ) : (
                <div className={styles.posterPlaceholder}>
                  <FaPlay size={40} />
                  <span>No Image Available</span>
                </div>
              )}
            </div>

            <div className={styles.movieInfo}>
              <h1>{movie.title}</h1>
              <div className={styles.movieMeta}>
                <div className={styles.metaItem}>
                  <FaStar className={styles.metaIcon} />
                  <span className={styles.rating}>{movie.vote_average?.toFixed(1)}/10</span>
                </div>
                <div className={styles.metaItem}>
                  <FaClock className={styles.metaIcon} />
                  <span>{movie.runtime} min</span>
                </div>
                <div className={styles.metaItem}>
                  <FaCalendarAlt className={styles.metaIcon} />
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                </div>
              </div>

              <div className={styles.genres}>
                {movie.genres?.map((genre) => (
                  <span key={genre.id} className={styles.genreTag}>
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className={styles.overview}>{movie.overview}</p>

              <div className={styles.movieDetails}>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Director:</span>
                  <span>{movie.credits?.crew?.find((person) => person.job === 'Director')?.name || 'N/A'}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Cast:</span>
                  <span>{movie.credits?.cast?.slice(0, 3).map((actor) => actor.name).join(', ') || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.movieContainer}>
        <div className={styles.bookingSection}>
          <h2>Book Your Tickets</h2>

          <div className={styles.bookingOption}>
            <div className={styles.sectionHeader}>
              <FaMapMarkerAlt className={styles.sectionIcon} />
              <h3>Select Theater</h3>
            </div>
            <div className={styles.theaterOptions}>
              {THEATERS.map((theater) => (
                <button
                  key={theater.id}
                  className={`${styles.theaterOption} ${
                    selectedTheater === theater.id ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedTheater(theater.id)}
                >
                  <div className={styles.theaterInfo}>
                    <h4>{theater.name}</h4>
                    <p><FaMapMarkerAlt /> {theater.location}</p>
                  </div>
                  {selectedTheater === theater.id && (
                    <div className={styles.selectedIndicator}>✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.bookingOption}>
            <div className={styles.sectionHeader}>
              <FaCalendarAlt className={styles.sectionIcon} />
              <h3>Select Date</h3>
            </div>
            <div className={styles.dateOptions}>
              {getAvailableDates().map((date, index) => (
                <button
                  key={index}
                  className={`${styles.dateOption} ${
                    selectedDate.toDateString() === date.toDateString() ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className={styles.day}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={styles.date}>{date.getDate()}</span>
                  <span className={styles.month}>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.bookingOption}>
            <div className={styles.sectionHeader}>
              <FaClock className={styles.sectionIcon} />
              <h3>Select Time</h3>
            </div>
            <div className={styles.timeOptions}>
              {SHOWTIMES.map((time, index) => (
                <button
                  key={index}
                  className={`${styles.timeOption} ${selectedTime === time ? styles.selected : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  <FaClock className={styles.timeIcon} />
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.seatSelection}>
            <div className={styles.sectionHeader}>
              <FaUsers className={styles.sectionIcon} />
              <h3>Select Seats</h3>
              <div className={styles.seatCounter}>
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </div>
            </div>
            {seatSyncUnavailable && (
              <div className={styles.seatSyncWarning}>
                Live seat sync unavailable. Restart backend to sync all users.
              </div>
            )}
            <div className={styles.screen}>🎬 SCREEN 🎬</div>
            <div className={styles.seatMap}>
              {SEAT_ROWS.map((row) => (
                <div key={row} className={styles.seatRow}>
                  <span className={styles.rowLabel}>{row}</span>
                  <div className={styles.seats}>
                    {Array.from({ length: SEATS_PER_ROW }, (_, seatNum) => {
                      const seatId = `${row}${seatNum + 1}`;
                      const isBooked = bookedSeatSet.has(seatId);
                      const isSelected = selectedSeats.includes(seatId);

                      return (
                        <button
                          key={seatId}
                          className={`${styles.seat} ${isBooked ? styles.booked : ''} ${isSelected ? styles.selected : ''}`}
                          onClick={() => toggleSeat(seatId)}
                          disabled={isBooked}
                          aria-label={`Seat ${seatId}${isBooked ? ' (Booked)' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.seatLegend}>
              <div className={styles.legendItem}>
                <div className={`${styles.seat} ${styles.available}`}></div>
                <span>Available</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.seat} ${styles.selected}`}></div>
                <span>Selected</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.seat} ${styles.booked}`}></div>
                <span>Booked</span>
              </div>
            </div>
          </div>

          {alertData && (
            <CustomAlert
              open={true}
              movieTitle={alertData.movieTitle}
              theaterName={alertData.theaterName}
              seat={alertData.seat}
              showtime={alertData.showtime}
              onViewReservation={() => console.log('Go to reservations')}
              onBack={() => setAlertData(null)}
            />
          )}

          <div className={styles.bookingSummary}>
            <div className={styles.sectionHeader}>
              <FaTicketAlt className={styles.sectionIcon} />
              <h3>Order Summary</h3>
            </div>
            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Movie:</span>
                <span>{movie.title}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Theater:</span>
                <span>{THEATERS.find((t) => t.id === selectedTheater)?.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Date & Time:</span>
                <span>{formatDate(selectedDate)} at {selectedTime}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Seats ({selectedSeats.length}):</span>
                <span>{selectedSeats.join(', ') || 'None selected'}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total:</span>
                <span>${(selectedSeats.length * 12.99).toFixed(2)}</span>
              </div>
            </div>
            <button
              className={styles.bookButton}
              onClick={handleBooking}
              disabled={selectedSeats.length === 0 || isLoading}
            >
              <FaTicketAlt className={styles.buttonIcon} />
              {selectedSeats.length === 0 ? 'Select Seats to Continue' : null}
              {selectedSeats.length > 0 && isLoading === false
                ? `Book ${selectedSeats.length} Ticket${selectedSeats.length !== 1 ? 's' : ''}`
                : null}
              {isLoading ? 'Booking... ' : null}
              {isLoading ? <MorphingSpinner /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movie;
