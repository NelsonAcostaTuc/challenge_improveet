const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const { protect } = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error al conectar a MongoDB:', err));

app.use('/api/tasks', protect, (req, res, next) => {
  req.io = io;
  next();
}, taskRoutes);

app.use('/api/users', userRoutes);

let users = new Set();

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  users.add(socket.id);
  io.emit('users', Array.from(users));

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    users.delete(socket.id);
    io.emit('users', Array.from(users));
  });

  socket.on('getUsers', () => {
    io.emit('users', Array.from(users));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
