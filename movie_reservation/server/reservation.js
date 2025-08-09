const express = require("express");
const router = express.Router();

let LastId = 0;
let Reservations = [];

// POST /reservation
router.post("/", (req, res) => {
    console.log("POST /reservation - Request body:", req.body);

    const generateId = () => (++LastId).toString();

    try {
        const { jwt, movieId, theaterId,   showtime , seats, totalPrice , isLoggedIN } = req.body;
        
        // Validate required fields
        if (!jwt) {
            console.log("Unauthorized: User not logged in");
            return res.status(401).json({ 
                success: false, 
                message: "Please log in to make a reservation" 
            });
        }

        if (!jwt || !movieId || !seats || !seats.length || totalPrice === undefined || !showtime || !isLoggedIN) {
            console.log("Bad request: Missing required fields");
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        const reservation = {
            id: generateId(),
            jwt,
            movieId,
            seats,
            totalPrice,
            createdAt: new Date().toISOString()
        };
        
        Reservations.push(reservation);
        console.log("New reservation created:", reservation);
        
        res.status(201).json({
            success: true,
            message: "Reservation created successfully",
            data: reservation
        });

    } catch (error) {
        console.error("Reservation error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error creating reservation" 
        });
    }
});

// GET /reservation
router.get("/", (req, res) => {
    console.log("GET /reservation - Returning all reservations");
    res.status(200).json({
        success: true, 
        data: Reservations
    });
});

module.exports = router;