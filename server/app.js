    const express = require('express');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const cors = require('cors');
    require('dotenv').config();
    

    const listEndpoints = require('express-list-routes');

    const app = express();

    app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
    });
   
    const allowedOrigins = [
        'https://movie-reservation-1.onrender.com',
        'http://localhost:3000'
    ]; 

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204
};

    app.use(cors(corsOptions));

    app.use(express.json());


    const reservationRouter = require("./reservation") ; 
    console.log("reservation is done ")

    app.use("/api/reservation" , reservationRouter) ; 
    
    app.get('/', (req, res) => {
        res.json({ message: 'Movie Reservation API is running!' });
       
    });


    // In-memory user storage
    let users = [];
    let currentId = 1;

    const findUserByEmail = (email) => users.find(user => user.email === email);

    const findUserByUsername = (username) => users.find(user => user.username === username);

    // Helper function to generate user ID
    const generateId = () => (currentId++).toString();



    app.post('/api/register', async (req, res) => {
        console.log('Received registration request:', req.body);
        try {
            const { username, email, password } = req.body;

            // Check if user exists
            if (findUserByEmail(email) || findUserByUsername(username)) {
                console.log('User already exists');
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Create new user
            const user = {
                id: generateId(),
                username,
                email,
                password: hashedPassword,
                createdAt: new Date()
            };
            
            users.push(user);

            // Generate token
            const token = jwt.sign(
                { userId: user.id, username: user.username , userEmail: "some email" },
                process.env.JWT_SECRET || 'secret-key',
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        
       
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    });

    app.post("/api/userInfo" , (req ,res )=> {
        const id = req.body.userId ; 
        const user = users.find(user => user.id === id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        });

        console.log("User info requested for ID:", id);
        console.log("User data:", user);


    })
    app.patch("/api/changeInfo" , (req , res) => {
        const { userId, newEmail ,  newName  } = req.body;
        const user = users.find(user => user.id === userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.username = newName;
        user.email = newEmail;
        res.json({ message: "Email updated successfully", user });
        console.log("Email changed for user ID:", userId, "New email:", newEmai , "New name:", newName);
    })
    
    // app.post('/api/test', (req, res) => {
    //     console.log('Test endpoint hit! Request body:', req.body);
        
    //     // Simple validation
    //     if (!req.body.message) {
    //         return res.status(400).json({
    //             success: false,
    //             message: 'Message is required'
    //         });
    //     }
    
    //     // Return success response with received data
    //     res.status(200).json({
    //         success: true,
    //         message: 'Test successful!',
    //         receivedData: req.body,
    //         timestamp: new Date().toISOString()
    //     });
    // });
    app.get("/api/test" , (req , res) => {
        res.json({
            success : true , 
            message : "test"
        })
        
    }
)
    // User Login
    app.post('/api/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user
            const user = findUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET || 'secret-key',
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    });



    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0'; // Listen on all network interfaces


    
    app.listen(PORT, () => {
    
       console.log(listEndpoints(app));
     
    });