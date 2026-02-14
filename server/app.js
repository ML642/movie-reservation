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
   
    const allowedOrigins = new Set([
        'https://movie-reservation-1.onrender.com',
        'https://movie-reservation-z2nv.onrender.com',
        'http://localhost:3000',
        'https://movie-reservation-1-4uao.onrender.com'

    ]); 

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (allowedOrigins.has(origin) || isLocalhost) {
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
    // Demo account for quick project review:
    // email: user@gmail.com, password: user
    const demoUser = {
        id: "1",
        username: "user",
        email: "user@gmail.com",
        password: bcrypt.hashSync("user", 12),
        createdAt: new Date("2026-01-01T00:00:00.000Z")
    };
    let users = [demoUser];
    let currentId = 2;

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
                { userId: user.id, username: user.username, userEmail: user.email },
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

    app.post("/api/userInfo" , (req ,res)=> {
        const authHeader = req.headers["authorization"];
        let decodedToken = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
            } catch (error) {
                return res.status(401).json({ message: "Invalid or expired token" });
            }
        }

        const bodyUserId = req.body.userId;
        const tokenUserId = decodedToken?.userId;
        const id = tokenUserId || bodyUserId;

        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        if (tokenUserId && bodyUserId && tokenUserId !== bodyUserId) {
            return res.status(403).json({ message: "Forbidden: user mismatch" });
        }

        const user = users.find(user => user.id === id);

        if (user) {
            console.log("User info requested for ID:", id);
            console.log("User data:", user);
            return res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            });
        }

        // Fallback for restarted servers with in-memory storage:
        // if token is valid, return claims so profile page can still render.
        if (decodedToken && decodedToken.userId === id) {
            return res.json({
                id: decodedToken.userId,
                username: decodedToken.username || "User",
                email: decodedToken.userEmail || null,
                createdAt: null
            });
        }

        return res.status(404).json({ message: "User not found" });
    })
    app.patch("/api/changeInfo" , (req , res) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        let decodedToken = null;
        try {
            const token = authHeader.split(" ")[1];
            decodedToken = jwt.verify(token, process.env.JWT_SECRET || "secret-key");
        } catch (error) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        const tokenUserId = decodedToken?.userId;
        const bodyUserId = req.body.userId;
        if (!tokenUserId) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }
        if (bodyUserId && bodyUserId !== tokenUserId) {
            return res.status(403).json({ success: false, message: "Forbidden: user mismatch" });
        }

        const user = users.find((u) => u.id === tokenUserId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { newEmail, newName } = req.body;
        if (!newEmail && !newName) {
            return res.status(400).json({ success: false, message: "Nothing to update" });
        }

        if (newName) user.username = newName;
        if (newEmail) user.email = newEmail;

        return res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
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
    app.post('/api/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const loginId = (email || '').trim();
            if (!loginId || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email/username and password are required'
                });
            }

            const user = findUserByEmail(loginId) || findUserByUsername(loginId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username, userEmail: user.email },
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
