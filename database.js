const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'db.sqlite');

let db;

const initializeDatabase = () => {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          assignee TEXT,
          deadline TEXT,
          completed INTEGER DEFAULT 0
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )
      `);

      db.run(`
        INSERT OR IGNORE INTO users (username, password) VALUES ('admin', '123456')
      `);
    }
  });
};

const addTask = (task) => {
  const { name, assignee, deadline } = task;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tasks (name, assignee, deadline) VALUES (?, ?, ?)`,
      [name, assignee, deadline],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const deleteTask = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM tasks WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

const updateTaskStatus = (id, completed) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tasks SET completed = ? WHERE id = ?`,
      [completed ? 1 : 0, id],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const searchTasks = (query) => {
  return new Promise((resolve, reject) => {
    const searchQuery = `%${query}%`;
    db.all(
      `SELECT * FROM tasks WHERE name LIKE ? OR assignee LIKE ?`,
      [searchQuery, searchQuery],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

module.exports = {
  initializeDatabase,
  addTask,
  deleteTask,
  updateTaskStatus,
  searchTasks,
  getUser,
};