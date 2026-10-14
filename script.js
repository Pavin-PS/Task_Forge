(() => {
  'use strict';

  const STORAGE_KEY = 'taskforge.personalTasks.v1';
  const CATEGORIES = ['Electrical Design', 'BOM & Documentation', 'PLC / HMI / VFD', 'Testing & Troubleshooting', 'Meetings & Follow-ups', 'Personal', 'Other'];
  const CATEGORY_COLORS = {
    'Electrical Design': 'blue', 'BOM & Documentation': 'violet',
    'PLC / HMI / VFD': 'green', 'Testing & Troubleshooting': 'orange',
    'Meetings & Follow-ups': 'pink', 'Personal': 'gray', 'Other': 'gray'
  };
  const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
  let tasks = loadTasks();
  let activeFilter = 'all';
  let activeCategory = '';
  let toastTimer;

  const $ = id => document.getElementById(id);
  const els = {
    taskList: $('taskList'), emptyState: $('emptyState'), modal: $('modalBackdrop'),
    form: $('taskForm'), search: $('searchInput'), priority: $('priorityFilter'),
    sort: $('sortSelect'), toast: $('toast')
  };

  function localDateString(date = new Date()) {
    const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string').map(t => ({
        id: t.id, title: t.title.slice(0, 140), description: String(t.description || '').slice(0, 1200),
        category: CATEGORIES.includes(t.category) ? t.category : 'Other',
        priority: ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
        dueDate: /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate || '') ? t.dueDate : '',
        status: ['Pending', 'In Progress', 'Completed'].includes(t.status) ? t.status : 'Pending',
        createdAt: Number(t.createdAt) || Date.now(), updatedAt: Number(t.updatedAt) || Date.now()
      }));
    } catch (error) {
      console.warn('Could not load saved tasks:', error);
      return [];
    }
  }
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      showToast('Could not save tasks. Check browser storage settings.');
      return false;
    }
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function formatDate(value) {
    if (!value) return 'No due date';
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function isOverdue(task) {
    return task.status !== 'Completed' && !!task.dueDate && task.dueDate < localDateString();
  }
  function isToday(task) {
    return task.status !== 'Completed' && task.dueDate === localDateString();
  }
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }
  function getVisibleTasks() {
    let list = tasks.filter(task => {
      if (activeCategory && task.category !== activeCategory) return false;
      if (activeFilter === 'today' && !isToday(task)) return false;
      if (activeFilter === 'upcoming' && !(task.status !== 'Completed' && task.dueDate && task.dueDate > localDateString())) return false;
      if (activeFilter === 'overdue' && !isOverdue(task)) return false;
      if (activeFilter === 'completed' && task.status !== 'Completed') return false;
      if (activeFilter === 'all' && false) return false;
      const query = els.search.value.trim().toLowerCase();
      if (query && ![task.title, task.description, task.category, task.priority, task.status].some(s => s.toLowerCase().includes(query))) return false;
      if (els.priority.value !== 'all' && task.priority !== els.priority.value) return false;
      return true;
    });
    const sort = els.sort.value;
    list.sort((a, b) => {
      if (sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      if (sort === 'created') return b.createdAt - a.createdAt;
      if (sort === 'title') return a.title.localeCompare(b.title);
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || b.createdAt - a.createdAt;
    });
    return list;
  }
  function updateSummary() {
    const today = tasks.filter(isToday).length;
    const overdue = tasks.filter(isOverdue).length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const total = tasks.length;
    $('totalStat').textContent = total;
    $('todayStat').textContent = today;
    $('overdueStat').textContent = overdue;
    $('completedStat').textContent = completed;
    $('completionFoot').textContent = `${total ? Math.round(completed / total * 100) : 0}% completion rate`;
    $('progressFill').style.width = `${total ? completed / total * 100 : 0}%`;
    $('navAll').textContent = total;
    $('navToday').textContent = today;
    $('navOverdue').textContent = overdue;
  }
  function updateHeading() {
    const titleMap = { all: 'All tasks', today: 'Today', upcoming: 'Upcoming', overdue: 'Overdue', completed: 'Completed' };
    const title = activeCategory || titleMap[activeFilter] || 'All tasks';
    $('pageTitle').textContent = title;
    $('breadcrumbCurrent').textContent = title;
    $('pageSubtitle').textContent = activeCategory
      ? `Tasks filed under ${activeCategory}.`
      : ({all:'Plan your work. Track your progress. Deliver on time.',today:'Focus on what needs to get done today.',upcoming:'Get ahead of upcoming deadlines.',overdue:'Review overdue work and decide your next action.',completed:'A record of the work you have finished.'}[activeFilter]);
    $('currentDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.toggle('active', !activeCategory && btn.dataset.filter === activeFilter));
    document.querySelectorAll('[data-category]').forEach(btn => btn.classList.toggle('active', btn.dataset.category === activeCategory));
  }
  function taskRow(task) {
    const completed = task.status === 'Completed';
    const dueClass = isOverdue(task) ? 'overdue' : (isToday(task) ? 'today' : '');
    const dueLabel = isOverdue(task) ? 'Overdue · ' + formatDate(task.dueDate) : (isToday(task) ? 'Today · ' + formatDate(task.dueDate) : formatDate(task.dueDate));
    const statusClass = task.status.toLowerCase().replace(' ', '-');
    const catColor = CATEGORY_COLORS[task.category] || 'gray';
    return `<article class="task-row ${completed ? 'is-completed' : ''}" data-id="${escapeHTML(task.id)}">
      <div class="task-primary"><input class="complete-toggle" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} completed" data-action="toggle" ${completed ? 'checked' : ''}><div><div class="task-title">${escapeHTML(task.title)}</div>${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ''}</div></div>
      <div><span class="category-pill"><i class="dot ${catColor}"></i>${escapeHTML(task.category)}</span></div>
      <div><span class="priority-pill ${task.priority.toLowerCase()}">${escapeHTML(task.priority)}</span></div>
      <div class="due-date ${dueClass}">${escapeHTML(dueLabel)}</div>
      <div><span class="status-pill ${statusClass}">${escapeHTML(task.status === 'In Progress' ? 'In progress' : task.status)}</span></div>
      <div class="row-actions"><button class="icon-btn" data-action="edit" aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">✎</button><button class="icon-btn delete" data-action="delete" aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">⌫</button></div>
    </article>`;
  }
  function render() {
    updateSummary();
    updateHeading();
    const list = getVisibleTasks();
    els.taskList.innerHTML = list.map(taskRow).join('');
    const hasTasks = list.length > 0;
    els.emptyState.classList.toggle('visible', !hasTasks);
    els.taskList.style.display = hasTasks ? 'block' : 'none';
    $('resultCount').textContent = `${list.length} ${list.length === 1 ? 'task' : 'tasks'}`;
    $('footerCount').textContent = `Showing ${list.length} of ${tasks.length} tasks`;
    $('clearCompletedBtn').style.visibility = tasks.some(t => t.status === 'Completed') ? 'visible' : 'hidden';
    if (tasks.length === 0) {
      $('emptyTitle').textContent = 'Ready when you are';
      $('emptyText').textContent = 'Add your first task to start organizing your work.';
    } else if (!hasTasks) {
      $('emptyTitle').textContent = 'No tasks found';
      $('emptyText').textContent = 'Try another filter or search term, or create a new task.';
    }
  }
  function openModal(task = null) {
    els.form.reset();
    $('taskId').value = task ? task.id : '';
    $('modalTitle').textContent = task ? 'Edit task' : 'Create a task';
    $('saveTaskBtn').textContent = task ? 'Save changes' : 'Save task';
    $('taskTitle').value = task ? task.title : '';
    $('taskDescription').value = task ? task.description : '';
    $('taskCategory').value = task ? task.category : (activeCategory || 'Electrical Design');
    $('taskPriority').value = task ? task.priority : 'Medium';
    $('taskDueDate').value = task ? task.dueDate : localDateString();
    $('taskStatus').value = task ? task.status : 'Pending';
    els.modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('taskTitle').focus(), 30);
  }
  function closeModal() {
    els.modal.hidden = true;
    document.body.style.overflow = '';
  }
  function addOrUpdateTask(event) {
    event.preventDefault();
    const title = $('taskTitle').value.trim();
    if (!title) { $('taskTitle').focus(); return; }
    const id = $('taskId').value;
    const now = Date.now();
    const record = {
      id: id || (crypto.randomUUID ? crypto.randomUUID() : `${now}-${Math.random().toString(16).slice(2)}`),
      title, description: $('taskDescription').value.trim(),
      category: $('taskCategory').value, priority: $('taskPriority').value,
      dueDate: $('taskDueDate').value, status: $('taskStatus').value,
      createdAt: id ? (tasks.find(t => t.id === id)?.createdAt || now) : now, updatedAt: now
    };
    if (id) {
      tasks = tasks.map(t => t.id === id ? record : t);
      showToast('Task updated successfully.');
    } else {
      tasks.unshift(record);
      showToast('Task created successfully.');
    }
    saveTasks();
    closeModal();
    render();
  }
  function toggleTask(id, checked) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.status = checked ? 'Completed' : 'Pending';
    task.updatedAt = Date.now();
    saveTasks();
    render();
    showToast(checked ? 'Task marked as completed.' : 'Task moved to pending.');
  }
  function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone unless you exported a backup.`)) return;
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
    showToast('Task deleted.');
  }
  function exportBackup() {
    const data = { app: 'TaskForge', version: 1, exportedAt: new Date().toISOString(), tasks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `taskforge-backup-${localDateString()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast('Backup exported.');
  }
  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const imported = Array.isArray(data) ? data : data.tasks;
        if (!Array.isArray(imported)) throw new Error('This file does not contain a task list.');
        const normalized = imported.filter(t => t && typeof t.title === 'string').map((t, i) => ({
          id: typeof t.id === 'string' ? t.id : `import-${Date.now()}-${i}`,
          title: t.title.slice(0, 140), description: String(t.description || '').slice(0, 1200),
          category: CATEGORIES.includes(t.category) ? t.category : 'Other',
          priority: ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
          dueDate: /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate || '') ? t.dueDate : '',
          status: ['Pending', 'In Progress', 'Completed'].includes(t.status) ? t.status : 'Pending',
          createdAt: Number(t.createdAt) || Date.now(), updatedAt: Number(t.updatedAt) || Date.now()
        }));
        if (!window.confirm(`Import ${normalized.length} tasks? This replaces the tasks currently saved in this browser.`)) return;
        tasks = normalized;
        saveTasks();
        activeFilter = 'all'; activeCategory = '';
        render();
        showToast(`${tasks.length} tasks imported.`);
      } catch (error) {
        showToast(error.message || 'Could not read this backup file.');
      } finally {
        $('importFile').value = '';
      }
    };
    reader.onerror = () => showToast('Could not read the selected file.');
    reader.readAsText(file);
  }

  document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter; activeCategory = '';
    $('sidebar').classList.remove('open');
    render();
  }));
  document.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => {
    activeCategory = btn.dataset.category; activeFilter = 'all';
    $('sidebar').classList.remove('open');
    render();
  }));
  $('addTaskBtn').addEventListener('click', () => openModal());
  $('emptyAddBtn').addEventListener('click', () => openModal());
  $('closeModalBtn').addEventListener('click', closeModal);
  $('cancelModalBtn').addEventListener('click', closeModal);
  els.modal.addEventListener('click', event => { if (event.target === els.modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !els.modal.hidden) closeModal(); });
  els.form.addEventListener('submit', addOrUpdateTask);
  els.search.addEventListener('input', render);
  els.priority.addEventListener('change', render);
  els.sort.addEventListener('change', render);
  els.taskList.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const row = button.closest('[data-id]');
    if (!row) return;
    const task = tasks.find(t => t.id === row.dataset.id);
    if (button.dataset.action === 'edit' && task) openModal(task);
    if (button.dataset.action === 'delete') deleteTask(row.dataset.id);
  });
  els.taskList.addEventListener('change', event => {
    if (!event.target.matches('[data-action="toggle"]')) return;
    const row = event.target.closest('[data-id]');
    if (row) toggleTask(row.dataset.id, event.target.checked);
  });
  $('clearCompletedBtn').addEventListener('click', () => {
    const count = tasks.filter(t => t.status === 'Completed').length;
    if (!count) return;
    if (!window.confirm(`Permanently remove ${count} completed ${count === 1 ? 'task' : 'tasks'}?`)) return;
    tasks = tasks.filter(t => t.status !== 'Completed');
    saveTasks(); render(); showToast('Completed tasks cleared.');
  });
  $('exportBtn').addEventListener('click', exportBackup);
  $('importFile').addEventListener('change', event => importBackup(event.target.files[0]));
  $('mobileMenu').addEventListener('click', () => $('sidebar').classList.toggle('open'));
  document.addEventListener('click', event => {
    if (window.innerWidth <= 980 && $('sidebar').classList.contains('open') &&
        !$('sidebar').contains(event.target) && !$('mobileMenu').contains(event.target)) {
      $('sidebar').classList.remove('open');
    }
  });

  render();
})();
