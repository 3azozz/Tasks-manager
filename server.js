const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://db:27017/taskdb';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'in-progress', 'done'], default: 'pending' },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

async function connectDB() {
  let retries = 0;
  while (retries < 20) {
    try {
      await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      retries++;
      console.log(`MongoDB not ready, retry ${retries}/20...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error('Could not connect to MongoDB after 20 retries. Exiting.');
  process.exit(1);
}

app.get('/health', (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({ status: 'ok', db: state === 1 ? 'connected' : 'disconnected' });
});

app.get('/tasks', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch task' });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    const task = await Task.create({ title, description, status, priority });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, message: 'Task deleted', data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`App running at http://localhost:${PORT}`);
  });
}

start();
