const express = require("express");
const router = express.Router();
const { getUsernameFromToken } = require("./utils/auth.js");

let LastId = 0;
let Reservations = [];

//midlleware to log request 

router.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - Body:`, req.body);
    
    if (req.body.jwt === undefined || req.body.jwt === null || req.body.jwt === "") {
        console.log("Unauthorized: User not logged in");
        return res.status(401).json({
            success: false,
            message: "Please log in to make a reservation"
        });
    }
    next();

})







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


router.get("/all", (req, res) => {
    console.log("GET /reservation - Returning all reservations");
    res.status(200).json({
        success: true, 
        data: Reservations
    });
});

router.post("/id", (req , res) => {
    const {UserId} = req.body ;
    let userReservations = [] ;
    console.log("POST /reservation/id - User ID:", UserId);
    if (!UserId) {
            console.log("bad request: User ID is required");
            return res.status(400).json({ 
                success: false, 
                message: "User ID is required" 
            });
        }
   
 

    for (let i of Reservations) { 
        let { reservationId} = getUsernameFromToken(i.jwt)
        try {
       
        if (!reservationId) {
            console.log("Decoding error");
            return res.status(400).json({
                success: false,
                message: "Invalid token"
            });
        }
    } 
    catch (error) {
        console.error("Error decoding token:", error);
        return res.status(400).json({
            success: false,
            message: "Invalid token"
        });
    }  
        if (reservationId=== UserId) {
            userReservations.push(i);
    }

    }
    console.log("GET /reservation/:id - User reservations:", userReservations);
    res.status(200).json({
        success: true,
        data: userReservations
    });
    
})
module.exports = router;