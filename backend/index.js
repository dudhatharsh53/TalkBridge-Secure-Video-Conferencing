const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for development and local network demo
        methods: ["GET", "POST"]
    }
});

// Controllers for socket events
const { saveMessage, savePrivateMessage } = require('./controllers/chatController');
const { createNotification } = require('./controllers/notificationController');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/meet', require('./routes/meetingRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('--- GLOBAL ERROR CAUGHT ---');
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    res.status(500).json({
        message: 'A global server error occurred',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Video Conferencing API is running...');
});

app.get('/debug-session', require('./middleware/auth').protect, (req, res) => {
    res.json({ user: req.user });
});

// Socket.io Signaling Logic
const users = {}; // Map socket IDs to user info
const socketToRoom = {}; // Map socket IDs to Room IDs
const roomHosts = {}; // Map Room IDs to Host Socket IDs
const userSockets = {}; // Map User IDs to Socket IDs for private messages
const onlineUsers = new Set(); // Track online user IDs

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track user socket for private messages
    socket.on('register-user', (userId) => {
        userSockets[userId] = socket.id;
        onlineUsers.add(userId);
        io.emit('online-users', Array.from(onlineUsers));
        console.log(`User registered for socket: ${userId} -> ${socket.id}`);
    });

    // Host joins the room directly
    socket.on('join-room', async ({ roomId, userId, userName, isHost }) => {
        console.log(`User ${userName} (${userId}) ${isHost ? 'as Host' : ''} joining room: ${roomId}`);

        if (isHost) {
            roomHosts[roomId] = socket.id;
        }

        socket.join(roomId);
        socketToRoom[socket.id] = roomId;

        if (!users[roomId]) {
            users[roomId] = [];
        }

        const userAlreadyIn = users[roomId].find(u => u.userId === userId);
        if (!userAlreadyIn) {
            users[roomId].push({ socketId: socket.id, userId, userName });
        } else {
            userAlreadyIn.socketId = socket.id;
        }

        const usersInRoom = users[roomId].filter(user => user.socketId !== socket.id);
        socket.emit('all-users', usersInRoom);

        socket.to(roomId).emit('user-joined', {
            socketId: socket.id,
            userId,
            userName
        });

        // Notify room about join
        if (!isHost) {
            const hostSocket = roomHosts[roomId];
            if (hostSocket) {
                // Could create persistent notification here too if desired
            }
        }
    });

    // Participant requests to join
    socket.on('request-to-join', ({ roomId, userId, userName }) => {
        const hostSocketId = roomHosts[roomId];
        if (hostSocketId) {
            io.to(hostSocketId).emit('participant-request', {
                socketId: socket.id,
                userId,
                userName
            });
        } else {
            socket.emit('error-msg', 'Host is not in the room. Please wait.');
        }
    });

    // Host accepts or rejects
    socket.on('accept-participant', ({ participantSocketId }) => {
        io.to(participantSocketId).emit('access-granted');
    });

    socket.on('reject-participant', ({ participantSocketId }) => {
        io.to(participantSocketId).emit('access-denied');
    });

    // Signaling
    socket.on('sending-offer', (payload) => {
        io.to(payload.userToSignal).emit('user-joined', {
            signal: payload.signal,
            callerId: payload.callerId,
            userName: payload.userName
        });
    });

    socket.on('returning-signal', (payload) => {
        io.to(payload.callerId).emit('receiving-returned-signal', {
            signal: payload.signal,
            id: socket.id
        });
    });

    // Meeting Chat functionality
    socket.on('send-message', async (data) => {
        const roomId = socketToRoom[socket.id];
        if (roomId) {
            // Save to DB
            const savedMsg = await saveMessage(roomId, data.senderId, data.text);

            io.to(roomId).emit('new-message', {
                sender: data.sender,
                senderId: data.senderId,
                text: data.text,
                timestamp: savedMsg ? savedMsg.timestamp : new Date().toISOString()
            });
        }
    });

    // Private Chat functionality
    socket.on('send-private-message', async (data) => {
        const { senderId, receiverId, message, senderName } = data;

        // Save to DB
        await savePrivateMessage(senderId, receiverId, message);

        const targetSocketId = userSockets[receiverId];
        if (targetSocketId) {
            io.to(targetSocketId).emit('new-private-message', {
                senderId,
                senderName,
                message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Admin commands: End Meeting
    socket.on('admin-end-meeting', ({ roomId }) => {
        io.to(roomId).emit('meeting-ended-by-admin');
    });

    // Admin commands: Remove Participant
    socket.on('remove-participant', ({ socketId }) => {
        io.to(socketId).emit('removed-from-meeting');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from userSockets and onlineUsers
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                onlineUsers.delete(userId);
                io.emit('online-users', Array.from(onlineUsers));
                break;
            }
        }

        const roomId = socketToRoom[socket.id];
        if (roomId && users[roomId]) {
            users[roomId] = users[roomId].filter(user => user.socketId !== socket.id);
            socket.to(roomId).emit('user-left', socket.id);

            if (users[roomId].length === 0) {
                delete users[roomId];
            }
        }
        delete socketToRoom[socket.id];
    });
});

// Database Connection
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        require('fs').appendFileSync('backend_start.log', `[${new Date().toISOString()}] Connected to MongoDB\n`);
        console.log('Connected to MongoDB');
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

