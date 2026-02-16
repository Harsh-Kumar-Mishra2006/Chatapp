# Tarang – Real-Time Conversational Engine

[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.dot.io&logoColor=white)](https://socket.io/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

Tarang is a high-performance real-time chat application designed for seamless communication, featuring instant messaging, secure sessions, and optimized data retrieval.

## 🚀 Key Features
* [cite_start]**Real-Time Communication**: Architected using **Socket.io** to support concurrent user sessions with a **99.9% message delivery rate**[cite: 39].
* [cite_start]**Optimized History**: Implemented a structured **50-message pagination strategy** using Mongoose lean queries, reducing initial load times by **35%**[cite: 40].
* [cite_start]**Resource Management**: Strict server-side validation for message limits (2,000 chars), ensuring a **25% reduction in server heap usage** during peak traffic[cite: 41].
* [cite_start]**Security**: Integrated **Helmet.js** to protect against common web vulnerabilities by setting various HTTP headers[cite: 7].

## 🛠️ Tech Stack
* **Frontend**: React.js, Tailwind CSS.
* **Backend**: Node.js, Express.js, Socket.io.
* **Database**: MongoDB & Mongoose.
* **Security**: Helmet.js, JWT, Bcrypt.

## ⚙️ Installation
1. `git clone https://github.com/Harsh-Kumar-Mishra2006/Chatapp-Frontend.git`
2. `npm install`
3. `npm start`
