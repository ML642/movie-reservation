const express = require("express");
const router = express.Router();
const { getUsernameFromToken } = require("./utils/auth.js");

let LastId = 0;
let Reservations = [];

//midlleware to log request 

router.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - Body:`, req.body);
    const authHeader = req.headers["authorization"];
    console.log("Authorization header:", authHeader)
    const token = authHeader && authHeader.split(" ")[1];
    
    
    


    if (authHeader === undefined || authHeader === null || authHeader === "") {
        console.log("Unauthorized: User not logged in");
        return res.status(401).json({
            success: false,
            message: "Please log in to make a reservation"
        });
    }
    console.log("Authoritation token:", token);
    req.user = getUsernameFromToken(token)
    next();

})







router.post("/", (req, res) => {
    console.log("POST /reservation - Request body:", req.body);

    const generateId = () => (++LastId).toString();

    try {
        const {  movieId, theaterId , seats, totalPrice , isLoggedIN , movieName ,  moviePoster ,  theaterName ,  movieDuration ,movieGenre ,showtime , bookingDate  } = req.body;
        
        // Validate required fields
  


        if ( !movieId || !seats || !seats.length || totalPrice === undefined || !showtime || !isLoggedIN || !theaterId || !movieName || !moviePoster || !theaterName || !movieDuration || !movieGenre || !bookingDate) {
            console.log("Bad request: Missing required fields");
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields" 
            });
        }

        const reservation = {
            id: generateId(),
            jwt : req.headers["authorization"],
            movieId,
            seats,
            totalPrice,
           
            createdAt: new Date().toISOString() , 
            movie: movieName ,
            poster : moviePoster,
            date: bookingDate,
            time: showtime,
            seat : seats.join(", "),
            status : "upcoming",
            theater : theaterName , 
            price : totalPrice,
            bookingDate, 
            genre: movieGenre,
            duration: movieDuration,
            rating : 0 ,


            theaterId,
            theaterName,
            movieDuration,
            movieGenre,
            showtime,
           
       
          
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
    console.log("All reservations:", Reservations);
});

router.post("/id", (req , res) => {
    const {userId} = req.user  ;
    let userReservations = [] ;
    console.log("POST /reservation/id - User ID:", userId);
    console.log(Reservations)
    //  console.log("Checking reservation:", Reservations[0].jwt);
    //  console.log("Checking reservation:", getUsernameFromToken(Reservations[0].jwt));
    if (!userId) {
            console.log("bad request: User ID is required");
            return res.status(400).json({ 
                success: false, 
                message: "User ID is required" 
            });
        }
   
 
    
    for (let i of Reservations) { 
       
        let  reservationId = getUsernameFromToken(i.jwt).userId
        console.log("Checking reservation:", reservationId);
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
        if (reservationId=== userId) {
            userReservations.push(i);
    }

    }
    console.log("GET /reservation/:id - User reservations:", userReservations);
    res.status(200).json({
        success: true,
        data: userReservations
    });
    
})

router.delete("/delete/:id", (req, res) => {
    const id = req.params.id
    console.log(`DELETE /reservation/delete/${id} - Request received`);

    const index = Reservations.findIndex(r => r.id === id);
    if (index === -1) {
        console.log(`Reservation with ID ${id} not found`);
        return res.status(404).json({
            success: false,
            message: "Reservation not found"
        });
    }
    else {
        Reservations[index].status = "cancelled";
    }
    console.log(`Reservation with ID ${id} cancelled`);
    
    res.status(200).json({
        success: true,
        message: "Reservation cancelled successfully",
        data: Reservations[index]
    })
}
)

module.exports = router;