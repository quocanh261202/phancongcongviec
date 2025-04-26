const { ipcRenderer } = require('electron');

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const logoutButton = document.getElementById('logoutButton');
const taskTableBody = document.getElementById('taskTableBody');
const taskForm = document.getElementById('taskForm');
const searchInput = document.getElementById('searchInput');
const taskCount = document.getElementById('taskCount');
const completedTaskCount = document.getElementById('completedTaskCount');

// Show specific section
const showSection = (section) => {
  loginSection.classList.add('hidden');
  dashboardSection.classList.add('hidden');
  section.classList.remove('hidden');
};

// Render task list
const renderTasks = async (searchQuery = '') => {
  const tasks = await ipcRenderer.invoke('get-tasks', searchQuery);
  let totalTasks = 0;
  let completedTasks = 0;

  taskTableBody.innerHTML = '';
  tasks.forEach((task, index) => {
    totalTasks++;
    if (task.completed) completedTasks++;

    const row = document.createElement('tr');
    row.classList.add('border-b', 'border-gray-600');
    row.innerHTML = `
      <td class="p-2 border text-center">${index + 1}</td>
      <td class="p-2 border">${task.name}</td>
      <td class="p-2 border">${task.assignee}</td>
      <td class="p-2 border text-center">${task.deadline}</td>
      <td class="p-2 border text-center">
        <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" class="complete-checkbox">
      </td>
      <td class="p-2 border text-center">
        <button class="btn-danger text-white px-2 py-1 rounded hover:shadow-md" data-id="${task.id}">Xóa</button>
      </td>
    `;
    taskTableBody.appendChild(row);
  });

  taskCount.textContent = totalTasks;
  completedTaskCount.textContent = completedTasks;
};

// Handle login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const result = await ipcRenderer.invoke('login-user', { username, password });
  if (result.success) {
    showSection(dashboardSection);
    renderTasks();
  } else {
    alert(result.message || 'Đăng nhập thất bại!');
  }
});

// Handle logout
logoutButton.addEventListener('click', () => {
  ipcRenderer.invoke('logout-user');
  showSection(loginSection);
});

// Add task
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('taskName').value.trim();
  const assignee = document.getElementById('taskAssignee').value.trim();
  const deadline = document.getElementById('taskDeadline').value;

  await ipcRenderer.invoke('add-task', { name, assignee, deadline });
  taskForm.reset();
  renderTasks();
});

// Handle search
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  renderTasks(query);
});

// Handle task actions (delete, complete)
taskTableBody.addEventListener('click', async (e) => {
  const target = e.target;
  const taskId = target.getAttribute('data-id');

  if (target.classList.contains('btn-danger')) {
    await ipcRenderer.invoke('delete-task', taskId);
    renderTasks();
  }

  if (target.classList.contains('complete-checkbox')) {
    const completed = target.checked;
    await ipcRenderer.invoke('update-task-status', { id: taskId, completed });
    renderTasks();
  }
});

// Check login status on load
document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = await ipcRenderer.invoke('check-login-status');
  if (isLoggedIn) {
    showSection(dashboardSection);
    renderTasks();
  } else {
    showSection(loginSection);
  }
});