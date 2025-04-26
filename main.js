const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database');

let mainWindow;
let currentUser = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
  db.initializeDatabase();
});

// Login
ipcMain.handle('login-user', async (event, { username, password }) => {
  const user = await db.getUser(username, password);
  if (user) {
    currentUser = user;
    return { success: true };
  }
  return { success: false, message: 'Tên tài khoản hoặc mật khẩu không đúng!' };
});

// Logout
ipcMain.handle('logout-user', () => {
  currentUser = null;
});

// Check login status
ipcMain.handle('check-login-status', () => {
  return !!currentUser;
});

// Get tasks
ipcMain.handle('get-tasks', async (event, query) => {
  return await db.searchTasks(query);
});

// Add task
ipcMain.handle('add-task', async (event, task) => {
  return await db.addTask(task);
});

// Delete task
ipcMain.handle('delete-task', async (event, id) => {
  return await db.deleteTask(id);
});

// Update task status
ipcMain.handle('update-task-status', async (event, { id, completed }) => {
  return await db.updateTaskStatus(id, completed);
  // IPC Handler: Export completed and overdue tasks to Excel
ipcMain.handle("export-tasks-to-excel", async () => {
  try {
    const tasks = await db.getAllTasks();

    // Separate completed and overdue tasks
    const completedTasks = tasks.filter((task) => task.completed);
    const overdueTasks = tasks.filter(
      (task) => !task.completed && new Date(task.deadline) < new Date()
    );

    // Create Excel workbook and sheets
    const workbook = xlsx.utils.book_new();
    const completedSheet = xlsx.utils.json_to_sheet(completedTasks);
    const overdueSheet = xlsx.utils.json_to_sheet(overdueTasks);

    xlsx.utils.book_append_sheet(workbook, completedSheet, "Completed Tasks");
    xlsx.utils.book_append_sheet(workbook, overdueSheet, "Overdue Tasks");

    // Save Excel file
    const filePath = path.join(app.getPath("desktop"), "Tasks_Report.xlsx");
    xlsx.writeFile(workbook, filePath);

    return { success: true, filePath };
  } catch (error) {
    console.error("Error exporting tasks to Excel:", error);
    return { success: false, error: error.message };
  }
});
});