// API Base URL
const API_BASE = '/api';

// State
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const tasksList = document.getElementById('tasksList');
const createTaskForm = document.getElementById('createTaskForm');
const editModal = document.getElementById('editModal');
const editTaskForm = document.getElementById('editTaskForm');
const closeEditModal = document.getElementById('closeEditModal');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

// Metrics DOM
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statCompleted = document.getElementById('statCompleted');
const statHigh = document.getElementById('statHigh');

// Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Fetch and Render Stats
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    if (data.success) {
      statTotal.innerText = data.stats.total;
      statPending.innerText = data.stats.pending;
      statCompleted.innerText = data.stats.completed;
      statHigh.innerText = data.stats.high;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Fetch and Render Tasks
async function loadTasks() {
  try {
    tasksList.innerHTML = '<div class="loading-state">Loading tasks...</div>';
    let url = `${API_BASE}/tasks?`;
    if (currentFilter !== 'all') {
      url += `status=${currentFilter}&`;
    }
    if (searchQuery.trim() !== '') {
      url += `search=${encodeURIComponent(searchQuery.trim())}&`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success || data.data.length === 0) {
      tasksList.innerHTML = '<div class="empty-state">No tasks found. Create one to get started!</div>';
      return;
    }

    renderTasks(data.data);
  } catch (err) {
    tasksList.innerHTML = `<div class="empty-state" style="color: #ef4444;">Error loading tasks: ${err.message}</div>`;
  }
}

// Render Tasks to DOM
function renderTasks(tasks) {
  tasksList.innerHTML = '';
  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;
    item.dataset.id = task.id;

    const priorityBadge = `<span class="badge badge-${task.priority}">${task.priority}</span>`;
    const categoryBadge = `<span class="badge badge-category">${escapeHtml(task.category)}</span>`;

    item.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
      <div class="task-details">
        <div class="task-header">
          <span class="task-title">${escapeHtml(task.title)}</span>
          ${priorityBadge}
          ${categoryBadge}
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      </div>
      <div class="task-actions">
        <button class="btn-icon" title="Edit Task" onclick="openEditModal(${task.id}, '${escapeQuote(task.title)}', '${escapeQuote(task.description || '')}', '${task.priority}', '${escapeQuote(task.category)}')">
          ✏️
        </button>
        <button class="btn-icon delete" title="Delete Task" onclick="deleteTask(${task.id})">
          🗑️
        </button>
      </div>
    `;

    tasksList.appendChild(item);
  });
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

function escapeQuote(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Create Task Handler
createTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const category = document.getElementById('taskCategory').value.trim();
  const description = document.getElementById('taskDesc').value.trim();

  if (!title) return;

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, priority, category, description })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Task added successfully!');
      createTaskForm.reset();
      document.getElementById('taskCategory').value = 'Development';
      loadTasks();
      loadStats();
    } else {
      showToast(data.error || 'Failed to add task.', 'danger');
    }
  } catch (err) {
    showToast(`Network error: ${err.message}`, 'danger');
  }
});

// Toggle Task Complete State
window.toggleTask = async function(id) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      showToast(data.data.completed ? 'Task marked complete!' : 'Task reopened!');
      loadTasks();
      loadStats();
    }
  } catch (err) {
    showToast(`Error updating task: ${err.message}`, 'danger');
  }
};

// Delete Task Handler
window.deleteTask = async function(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Task deleted successfully!');
      loadTasks();
      loadStats();
    } else {
      showToast(data.error || 'Failed to delete task', 'danger');
    }
  } catch (err) {
    showToast(`Error deleting task: ${err.message}`, 'danger');
  }
};

// Edit Modal Open & Setup
window.openEditModal = function(id, title, description, priority, category) {
  document.getElementById('editTaskId').value = id;
  document.getElementById('editTitle').value = title;
  document.getElementById('editDesc').value = description;
  document.getElementById('editPriority').value = priority;
  document.getElementById('editCategory').value = category;
  editModal.classList.add('open');
};

function closeEdit() {
  editModal.classList.remove('open');
  editTaskForm.reset();
}

closeEditModal.addEventListener('click', closeEdit);
btnCancelEdit.addEventListener('click', closeEdit);

// Save Edited Task
editTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editTaskId').value;
  const title = document.getElementById('editTitle').value.trim();
  const description = document.getElementById('editDesc').value.trim();
  const priority = document.getElementById('editPriority').value;
  const category = document.getElementById('editCategory').value.trim();

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, category })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Task updated successfully!');
      closeEdit();
      loadTasks();
      loadStats();
    } else {
      showToast(data.error || 'Failed to update task', 'danger');
    }
  } catch (err) {
    showToast(`Error updating task: ${err.message}`, 'danger');
  }
});

// Search input debouncer
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = e.target.value;
    loadTasks();
  }, 250);
});

// Filter Tabs
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadTasks();
  });
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadTasks();
});
