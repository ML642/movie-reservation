const express = require("express");
const router = express.Router();
const { getUsernameFromToken } = require("./utils/auth.js");

let LastId = 0;
let Reservations = [];
const ShowSeatAvailability = new Map();

const normalizeShowDate = (dateValue) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString().slice(0, 10);
};

const buildShowKey = ({ movieId, theaterId, bookingDate, showtime }) => {
    const dateKey = normalizeShowDate(bookingDate);
    if (!movieId || !theaterId || !showtime || !dateKey) {
        return null;
    }
    return `${movieId}::${theaterId}::${dateKey}::${showtime}`;
};

const getOrCreateSeatSet = (showKey) => {
    if (!ShowSeatAvailability.has(showKey)) {
        ShowSeatAvailability.set(showKey, new Set());
    }
    return ShowSeatAvailability.get(showKey);
};

const releaseBookedSeats = (showKey, seats) => {
    if (!showKey || !Array.isArray(seats)) {
        return;
    }
    const set = ShowSeatAvailability.get(showKey);
    if (!set) {
        return;
    }
    seats.forEach((seatId) => set.delete(seatId));
    if (set.size === 0) {
        ShowSeatAvailability.delete(showKey);
    }
};

const getReservationOwnerId = (reservation) => {
    if (reservation.userId) {
        return reservation.userId;
    }
    if (!reservation.jwt) {
        return null;
    }
    const decoded = getUsernameFromToken(reservation.jwt);
    return decoded?.userId || null;
};

router.get("/seats", (req, res) => {
    const { movieId, theaterId, date, time, bookingDate, showtime } = req.query;
    const showKey = buildShowKey({
        movieId,
        theaterId,
        bookingDate: date || bookingDate,
        showtime: time || showtime,
    });

    if (!showKey) {
        return res.status(400).json({
            success: false,
            message: "movieId, theaterId, date and time are required",
        });
    }

    return res.status(200).json({
        success: true,
        bookedSeats: Array.from(getOrCreateSeatSet(showKey)),
    });
});

router.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - Body:`, req.body);
    const authHeader = req.headers["authorization"];
    console.log("Authorization header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("Unauthorized: User not logged in");
        return res.status(401).json({
            success: false,
            message: "Please log in to make a reservation",
        });
    }
    const token = authHeader.split(" ")[1];
    req.user = getUsernameFromToken(token);
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
    next();
});

router.post("/", (req, res) => {
    console.log("POST /reservation - Request body:", req.body);
    const generateId = () => (++LastId).toString();

    try {
        const { userId } = req.user || {};
        const {
            movieId,
            theaterId,
            seats,
            totalPrice,
            movieName,
            moviePoster,
            theaterName,
            movieDuration,
            movieGenre,
            showtime,
            bookingDate,
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        if (
            !movieId ||
            !seats ||
            !Array.isArray(seats) ||
            !seats.length ||
            totalPrice === undefined ||
            !showtime ||
            !theaterId ||
            !movieName ||
            !moviePoster ||
            !theaterName ||
            !movieDuration ||
            !movieGenre ||
            !bookingDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        const showKey = buildShowKey({ movieId, theaterId, bookingDate, showtime });
        if (!showKey) {
            return res.status(400).json({
                success: false,
                message: "Invalid show date/time",
            });
        }

        const bookedSeats = getOrCreateSeatSet(showKey);
        const conflictingSeats = seats.filter((seatId) => bookedSeats.has(seatId));
        if (conflictingSeats.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Some seats are already taken",
                conflictingSeats,
            });
        }

        seats.forEach((seatId) => bookedSeats.add(seatId));

        const reservation = {
            id: generateId(),
            userId,
            movieId,
            seats,
            totalPrice,
            createdAt: new Date().toISOString(),
            movie: movieName,
            poster: moviePoster,
            date: bookingDate,
            time: showtime,
            seat: seats.join(", "),
            status: "upcoming",
            theater: theaterName,
            price: totalPrice,
            bookingDate,
            genre: movieGenre,
            duration: movieDuration,
            rating: 0,
            theaterId,
            theaterName,
            movieDuration,
            movieGenre,
            showtime,
            showKey,
        };

        Reservations.push(reservation);
        return res.status(201).json({
            success: true,
            message: "Reservation created successfully",
            data: reservation,
        });
    } catch (error) {
        console.error("Reservation error:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating reservation",
        });
    }
});

router.get("/all", (req, res) => {
    const { userId } = req.user || {};
    const userReservations = Reservations.filter(
        (reservation) => getReservationOwnerId(reservation) === userId
    );
    res.status(200).json({
        success: true,
        data: userReservations,
    });
});

router.post("/id", (req, res) => {
    const { userId } = req.user || {};
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required",
        });
    }

    const userReservations = Reservations.filter(
        (reservation) => getReservationOwnerId(reservation) === userId
    );
    return res.status(200).json({
        success: true,
        data: userReservations,
    });
});

router.delete("/delete/:id", (req, res) => {
    const id = req.params.id;
    const { userId } = req.user || {};

    const reservation = Reservations.find((r) => r.id === id);
    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: "Reservation not found",
        });
    }

    const reservationOwnerId = getReservationOwnerId(reservation);
    if (!reservationOwnerId || reservationOwnerId !== userId) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: not your reservation",
        });
    }

    if (reservation.status !== "cancelled") {
        const showKey =
            reservation.showKey ||
            buildShowKey({
                movieId: reservation.movieId,
                theaterId: reservation.theaterId,
                bookingDate: reservation.bookingDate || reservation.date,
                showtime: reservation.showtime || reservation.time,
            });
        releaseBookedSeats(showKey, reservation.seats);
    }

    reservation.status = "cancelled";
    return res.status(200).json({
        success: true,
        message: "Reservation cancelled successfully",
        data: reservation,
    });
});

module.exports = router;
