# Meetly — Real-Time Video Conferencing Platform

Meetly is a full‑stack real‑time video conferencing web application that enables users to create and join virtual meeting rooms with live video, audio, chat, and screen sharing.

The project focuses on **real‑time communication, system design basics, and WebRTC signaling**, rather than UI-heavy features.

---


## ✨ Features

* User authentication (signup / login)
* Create and join meeting rooms using unique room IDs
* Real-time video & audio communication (WebRTC)
* Live text chat during meetings
* Screen sharing support
* Chat History Persistence
* Multi-user rooms
* Secure backend APIs

---

## 🛠 Tech Stack

### Frontend

* React
* WebRTC (peer-to-peer media streaming)
* Socket.IO Client
* HTML, CSS, JavaScript

### Backend

* Node.js
* Express.js
* Socket.IO (signaling server)
* MongoDB (users & rooms)

---

## 🧠 Architecture Overview

Meetly uses **WebRTC for media transfer** and **Socket.IO for signaling**.

**Important:**

* Video and audio streams **do NOT pass through the server**
* The server is only responsible for signaling and coordination

### Flow

1. User logs in / registers
2. User creates or joins a room
3. Client connects to Socket.IO signaling server
4. Exchange of SDP offers/answers and ICE candidates
5. Direct peer-to-peer connection established via WebRTC
6. Media streams flow directly between clients

---

## 🔄 Why Socket.IO is Needed

WebRTC cannot establish connections by itself.

Socket.IO is used to:

* Notify users when someone joins/leaves a room
* Exchange SDP offers and answers
* Exchange ICE candidates

Once signaling is complete, Socket.IO is **not involved in media transfer**.

---

## 📁 Project Structure

```
Meetly/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── socket/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── components/
│   └── pages/
│
├── screenshots/
├── README.md
└── .gitignore
```

---
## 📸 Screenshots

<p align="center">
  <img src="screenshots/auth.png" width="80%" alt="Authentication Page" />
  <br/><br/>
  <img src="screenshots/meeting.png" width="80%" alt="Meeting Room" />
  <br/><br/>
  <img src="screenshots/room.png" width="80%" alt="Room Selection" />
  <br/><br/>
  <img src="screenshots/screen.png" width="80%" alt="Screen Sharing" />
</p>

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

* Node.js
* MongoDB
* npm

### Clone the Repository

```bash
git clone https://github.com/girishthedecent/Meetly.git
cd Meetly
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Security Notes

* Passwords are hashed before storing
* Backend routes are protected
* Media streams are peer-to-peer and not stored

---

## 📌 Limitations & Future Improvements

* No TURN server (may fail behind strict NATs)
* Limited testing for large number of participants
* UI can be improved
* Recording meetings (future scope)

---

## 🎯 What This Project Demonstrates

* Understanding of real-time systems
* Practical use of WebRTC
* Client–server communication
* Socket-based signaling design
* Full-stack development skills

---

## 📄 License

MIT
