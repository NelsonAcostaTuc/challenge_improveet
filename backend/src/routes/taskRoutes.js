const express = require('express');
const { createTask, getTasks, updateTask, deleteTask, shareTaskList } = require('../controllers/taskController');

const router = express.Router();

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/share', shareTaskList);  // Nueva ruta para compartir listas de tareas

module.exports = router;
