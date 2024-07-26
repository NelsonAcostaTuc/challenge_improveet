const Task = require('../models/taskModel');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo:', error);
    } else {
      console.log('Correo enviado:', info.response);
    }
  });
};

// Crear una nueva lista de tareas
const createTask = async (req, res) => {
  const { name, description, email } = req.body;
  const newTask = new Task({ name, description });
  try {
    const savedTask = await newTask.save();
    req.io.emit('taskCreated', savedTask); // Emitir evento de creación de tarea
    if (email) {
      sendMail(email, 'Nueva Tarea Creada', `Se ha creado una nueva tarea: ${name}`);
      req.io.emit('notification', { message: `Se ha creado una nueva tarea: ${name}` });
    }
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener todas las listas de tareas
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar una lista de tareas
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(id, { name, description }, { new: true });
    req.io.emit('taskUpdated', updatedTask); // Emitir evento de actualización de tarea
    req.io.emit('notification', { message: `Se ha actualizado la tarea: ${name}` });
    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar una lista de tareas
const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await Task.findByIdAndDelete(id);
    req.io.emit('taskDeleted', id); // Emitir evento de eliminación de tarea
    req.io.emit('notification', { message: `Se ha eliminado una tarea` });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Compartir una lista de tareas
const shareTaskList = async (req, res) => {
  const { id, email } = req.body;
  try {
    const task = await Task.findById(id);
    if (task && email) {
      sendMail(email, 'Lista de Tareas Compartida', `Se ha compartido la lista de tareas: ${task.name}`);
      req.io.emit('notification', { message: `Se ha compartido una lista de tareas: ${task.name} con ${email}` });
      res.status(200).json({ message: 'Lista de tareas compartida' });
    } else {
      res.status(404).json({ message: 'Tarea no encontrada o correo no proporcionado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  shareTaskList,
};
