# Real-Time Video Conferencing Web Application

A full-stack video conferencing application built with Angular, Node.js, Express, MongoDB, and WebRTC.

## Features
- **Authentication**: JWT-based login and registration.
- **Meeting Rooms**: Create and join rooms with unique IDs.
- **Video Call**: Real-time peer-to-peer video/audio using WebRTC.
- **Messaging**: Real-time in-meeting chat.
- **Screen Sharing**: Share your screen with participants.
- **Dark Mode**: Toggle between light and dark themes.
- **Mesh Networking**: Supports group calls (3+ participants).

## Tech Stack
- **Frontend**: Angular 17+
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time**: Socket.io, WebRTC (Simple-Peer)

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally

### 1. Backend Setup
1. Open a terminal in the `backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (already created) with your MongoDB URI.
4. Start the server:
   ```bash
   node index.js
   ```

### 2. Frontend Setup
1. Open a terminal in the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install WebRTC and Socket.io clients:
   ```bash
   npm install socket.io-client simple-peer @types/simple-peer
   ```
4. Start the development server:
   ```bash
   npm start
   ```

### 3. Networking (Running on WiFi)
To test on two devices in the same WiFi network:
1. Find your computer's local IP address (e.g., `192.168.1.10`).
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
2. Update the API URL and Socket connection in the frontend to use this IP instead of `localhost`.
3. Open `http://<YOUR_IP>:4200` on both devices.

## Project Structure
- `backend/`: Node.js server, controllers, models, and routes.
- `frontend/`: Angular application with components and services.
