const express = require ("express") ; 
const router = express.Router();

let LastId = 0;
let Reservations = [ ] ; 

router.post("/", (req , res)=>{
    console.log("reservationAPI") ; 


    const generateId = () => {
            return (LastId+=1).toString()
        }

    try {

        const {userId , movieId , seats , totalPrice , isLoggedIN  } = req.body;
        
        if (!isLoggedIN) {
            return res.redirect("/login") ; 

        }
        const reservation = {
            userId,
            movieId,
            seats,
            totalPrice,
            createdAt: new Date() , 
            id: generateId()
        };
        
       Reservations.push(reservation) ; 
       res.status(201).json(reservation) ;
    }

    catch (error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}
)

module.exports = router ; 
