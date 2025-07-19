import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './movie.css';
const API_KEY = '306506d2d27da7e2c7e566411a66ea35';

// Mock theater data - in a real app, this would come from your backend
const THEATERS = [
  { id: 1, name: 'Cineplex Downtown', location: '123 Movie St, City' },
  { id: 2, name: 'MegaPlex Mall', location: '456 Cinema Ave, Town' },
  { id: 3, name: 'Starlight Theater', location: '789 Film Blvd, Village' },
];

// Mock showtimes - in a real app, this would come from your backend
const SHOWTIMES = [
  '10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM', '10:00 PM'
];

// Seat map configuration
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const SEATS_PER_ROW = 10;

const Movie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(THEATERS[0].id);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(SHOWTIMES[0]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showtime, setShowtime] = useState(null);

  // Fetch movie details
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

  // Handle seat selection
  const toggleSeat = (seatId) => {
    setSelectedSeats(prev => 
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };

  // Handle booking
  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    // In a real app, you would navigate to checkout or show a booking confirmation
    alert(`Booking confirmed for ${selectedSeats.length} seat(s)!`);
    // navigate('/checkout', { state: { movie, selectedSeats, showtime } });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Generate dates for the next 7 days
  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  // Render movie details
  return (
    <div className="movie-container">
      {/* Back button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        &larr; Back to Movies
      </button>

      {/* Movie Header */}
      <div className="movie-header">
        <div className="movie-poster">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              loading="lazy"
            />
          ) : (
            <div className="poster-placeholder">No Image</div>
          )}
        </div>
        <div className="movie-info">
          <h1>{movie.title}</h1>
          <div className="movie-meta">
            <span>{new Date(movie.release_date).getFullYear()}</span>
            <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
            <span className="rating">
              ★ {movie.vote_average.toFixed(1)}/10
            </span>
          </div>
          <div className="genres">
            {movie.genres.map(genre => (
              <span key={genre.id} className="genre-tag">
                {genre.name}
              </span>
            ))}
          </div>
          <p className="overview">{movie.overview}</p>
          
          {/* Movie Details */}
          <div className="movie-details">
            <div className="detail">
              <span className="detail-label">Director:</span>
              <span>{
                movie.credits?.crew?.find(p => p.job === 'Director')?.name || 'N/A'
              }</span>
            </div>
            <div className="detail">
              <span className="detail-label">Cast:</span>
              <span>{
                movie.credits?.cast?.slice(0, 3).map(p => p.name).join(', ')
              }</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Section */}
      <div className="booking-section">
        <h2>Book Tickets</h2>
        
        {/* Theater Selection */}
        <div className="booking-option">
          <h3>Select Theater</h3>
          <div className="theater-options">
            {THEATERS.map(theater => (
              <button
                key={theater.id}
                className={`theater-option ${selectedTheater === theater.id ? 'selected' : ''}`}
                onClick={() => setSelectedTheater(theater.id)}
              >
                <h4>{theater.name}</h4>
                <p>{theater.location}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="booking-option">
          <h3>Select Date</h3>
          <div className="date-options">
            {getAvailableDates().map((date, index) => (
              <button
                key={index}
                className={`date-option ${selectedDate.toDateString() === date.toDateString() ? 'selected' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="day">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="date">{date.getDate()}</span>
                <span className="month">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div className="booking-option">
          <h3>Select Time</h3>
          <div className="time-options">
            {SHOWTIMES.map((time, index) => (
              <button
                key={index}
                className={`time-option ${selectedTime === time ? 'selected' : ''}`}
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Seat Selection */}
        <div className="seat-selection">
          <h3>Select Seats</h3>
          <div className="screen">Screen</div>
          <div className="seat-map">
            {SEAT_ROWS.map((row, rowIndex) => (
              <div key={row} className="seat-row">
                <span className="row-label">{row}</span>
                <div className="seats">
                  {Array.from({ length: SEATS_PER_ROW }, (_, seatNum) => {
                    const seatId = `${row}${seatNum + 1}`;
                    // In a real app, check if seat is already booked
                    const isBooked = Math.random() < 0.1; // 10% chance a seat is "booked"
                    const isSelected = selectedSeats.includes(seatId);
                    
                    return (
                      <button
                        key={seatId}
                        className={`seat ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => !isBooked && toggleSeat(seatId)}
                        disabled={isBooked}
                        aria-label={`Seat ${seatId}${isBooked ? ' (Booked)' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="seat-legend">
            <div className="legend-item">
              <div className="seat available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="seat selected"></div>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <div className="seat booked"></div>
              <span>Booked</span>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="booking-summary">
          <h3>Order Summary</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Movie:</span>
              <span>{movie.title}</span>
            </div>
            <div className="summary-row">
              <span>Theater:</span>
              <span>{THEATERS.find(t => t.id === selectedTheater)?.name}</span>
            </div>
            <div className="summary-row">
              <span>Date & Time:</span>
              <span>{formatDate(selectedDate)} at {selectedTime}</span>
            </div>
            <div className="summary-row">
              <span>Seats ({selectedSeats.length}):</span>
              <span>{selectedSeats.join(', ') || 'None selected'}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>${(selectedSeats.length * 12.99).toFixed(2)}</span>
            </div>
          </div>
          <button 
            className="book-button"
            onClick={handleBooking}
            disabled={selectedSeats.length === 0}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Movie;