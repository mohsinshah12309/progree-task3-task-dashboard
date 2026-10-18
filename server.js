const express = require('express');
const cors = require('cors');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Local SQLite Database
const dbPath = path.join(__dirname, 'tasks.db');
const db = new DatabaseSync(dbPath);

// Create Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category TEXT DEFAULT 'General',
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial tasks if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM tasks');
const { count } = countStmt.get();
if (count === 0) {
  const insertSeed = db.prepare(`
    INSERT INTO tasks (title, description, priority, category, completed)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertSeed.run('Implement Task 1 LinkedIn Announcement', 'Draft post and attach offer letter for Progree internship.', 'high', 'Career', 1);
  insertSeed.run('Build Semantic Portfolio Portal', 'Design responsive CSS Grid and Flexbox layout for Task 2.', 'medium', 'Frontend', 1);
  insertSeed.run('Develop Full Stack Dynamic Task Dashboard', 'Connect Express API and SQLite with async/await CRUD interface.', 'high', 'Full Stack', 0);
  insertSeed.run('Architect E-Commerce Sandbox Module', 'Implement JWT authentication and Stripe sandbox checkout engine.', 'high', 'Backend', 0);
}

// REST API Endpoints

// 1. GET /api/tasks - Retrieve all tasks (with optional status & search filter)
app.get('/api/tasks', (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status === 'completed') {
      query += ' AND completed = 1';
    } else if (status === 'pending') {
      query += ' AND completed = 0';
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY completed ASC, id DESC';

    const stmt = db.prepare(query);
    const tasks = stmt.all(...params);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET /api/stats - Dashboard metrics
app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    const completed = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 1').get().count;
    const pending = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 0').get().count;
    const high = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high' AND completed = 0").get().count;

    res.json({ success: true, stats: { total, completed, pending, high } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, priority, category } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Task title is required.' });
    }

    const taskPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
    const taskCategory = category && category.trim() !== '' ? category.trim() : 'General';
    const taskDesc = description ? description.trim() : '';

    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, priority, category, completed)
      VALUES (?, ?, ?, ?, 0)
    `);

    const result = stmt.run(title.trim(), taskDesc, taskPriority, taskCategory);
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, category, completed } = req.body;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedDesc = description !== undefined ? description.trim() : existing.description;
    const updatedPriority = ['low', 'medium', 'high'].includes(priority) ? priority : existing.priority;
    const updatedCategory = category !== undefined ? category.trim() : existing.category;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : existing.completed;

    const stmt = db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, priority = ?, category = ?, completed = ?
      WHERE id = ?
    `);
    stmt.run(updatedTitle, updatedDesc, updatedPriority, updatedCategory, updatedCompleted, id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. PATCH /api/tasks/:id/toggle - Toggle task completion status
app.patch('/api/tasks/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    const newStatus = existing.completed ? 0 : 1;
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(newStatus, id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true, message: `Task ${id} deleted successfully.`, id: Number(id) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Dynamic Task Dashboard server running on http://localhost:${PORT}`);
});
