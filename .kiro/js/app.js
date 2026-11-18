/* =============================================
   MY START PAGE — app.js
   Features:
     • Greeting with time & date
     • Custom name (Challenge)
     • Light / Dark mode (Challenge)
     • Focus timer with custom duration (Challenge)
     • To-Do List with Local Storage
     • Prevent duplicate tasks (Challenge)
     • Sort tasks (Challenge)
     • Quick Links with Local Storage
   ============================================= */

"use strict";

/* ─── UTILITY ─────────────────────────────────── */

function $(id) { return document.getElementById(id); }

function showToast(msg) {
  let toast = $("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* ─── THEME ────────────────────────────────────── */

(function initTheme() {
  const saved = loadLS("theme", "light");
  applyTheme(saved);
  $("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
})();

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("theme-toggle").textContent = theme === "dark" ? "☀️" : "🌙";
  saveLS("theme", theme);
}

/* ─── CLOCK & GREETING ─────────────────────────── */

(function initGreeting() {
  const nameInput = $("name-input");
  const saveBtn   = $("name-save-btn");

  // Load saved name
  nameInput.value = loadLS("userName", "");

  saveBtn.addEventListener("click", saveName);
  nameInput.addEventListener("keydown", e => { if (e.key === "Enter") saveName(); });

  function saveName() {
    const name = nameInput.value.trim();
    saveLS("userName", name);
    updateGreeting();
    showToast(name ? `Name saved as "${name}"` : "Name cleared");
  }

  updateGreeting();
  setInterval(updateGreeting, 1000);
})();

function updateGreeting() {
  const now  = new Date();
  const hour = now.getHours();
  const name = loadLS("userName", "").trim();

  // Greeting text
  let salutation;
  if (hour < 12)       salutation = "Good Morning";
  else if (hour < 17)  salutation = "Good Afternoon";
  else if (hour < 20)  salutation = "Good Evening";
  else                 salutation = "Good Night";

  $("greeting").textContent = name ? `${salutation}, ${name}!` : `${salutation}!`;

  // Clock
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  $("clock").textContent = timeStr;

  // Date
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  $("date-display").textContent = dateStr;
}

/* ─── FOCUS TIMER ──────────────────────────────── */

(function initTimer() {
  const display    = $("timer-display");
  const minInput   = $("timer-minutes");
  const startBtn   = $("timer-start");
  const stopBtn    = $("timer-stop");
  const resetBtn   = $("timer-reset");

  let totalSeconds  = 25 * 60;
  let remaining     = totalSeconds;
  let intervalId    = null;
  let running       = false;

  renderTimer();

  minInput.addEventListener("change", () => {
    if (running) return;
    const val = Math.max(1, Math.min(120, parseInt(minInput.value) || 25));
    minInput.value  = val;
    totalSeconds    = val * 60;
    remaining       = totalSeconds;
    renderTimer();
    display.classList.remove("running", "finished");
  });

  startBtn.addEventListener("click", () => {
    if (running) return;
    if (remaining === 0) return;
    running = true;
    display.classList.add("running");
    display.classList.remove("finished");
    intervalId = setInterval(() => {
      remaining--;
      renderTimer();
      if (remaining === 0) {
        clearInterval(intervalId);
        running = false;
        display.classList.remove("running");
        display.classList.add("finished");
        showToast("⏰ Time's up! Great focus session.");
      }
    }, 1000);
  });

  stopBtn.addEventListener("click", () => {
    if (!running) return;
    clearInterval(intervalId);
    running = false;
    display.classList.remove("running");
  });

  resetBtn.addEventListener("click", () => {
    clearInterval(intervalId);
    running   = false;
    remaining = totalSeconds;
    renderTimer();
    display.classList.remove("running", "finished");
  });

  function renderTimer() {
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    display.textContent = `${m}:${s}`;
  }
})();

/* ─── TO-DO LIST ───────────────────────────────── */

(function initTodo() {
  const input    = $("todo-input");
  const addBtn   = $("todo-add-btn");
  const listEl   = $("todo-list");
  const countEl  = $("todo-count");
  const sortSel  = $("todo-sort");

  let tasks = loadLS("tasks", []);

  renderTasks();

  addBtn.addEventListener("click", addTask);
  input.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
  sortSel.addEventListener("change", renderTasks);

  function addTask() {
    const text = input.value.trim();
    if (!text) { showToast("Please type a task first."); return; }

    // Challenge: prevent duplicates (case-insensitive)
    const duplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
    if (duplicate) {
      showToast(`"${text}" is already in your list.`);
      return;
    }

    tasks.push({ id: Date.now(), text, done: false });
    input.value = "";
    saveTasks();
    renderTasks();
  }

  function saveTasks() { saveLS("tasks", tasks); }

  function renderTasks() {
    listEl.innerHTML = "";

    // Challenge: sort
    let sorted = [...tasks];
    const mode = sortSel.value;
    if (mode === "az")   sorted.sort((a, b) => a.text.localeCompare(b.text));
    if (mode === "za")   sorted.sort((a, b) => b.text.localeCompare(a.text));
    if (mode === "done") sorted.sort((a, b) => Number(a.done) - Number(b.done));

    sorted.forEach(task => {
      const li = document.createElement("li");
      li.className = "todo-item" + (task.done ? " done" : "");
      li.dataset.id = task.id;

      // Checkbox
      const cb = document.createElement("input");
      cb.type    = "checkbox";
      cb.checked = task.done;
      cb.addEventListener("change", () => toggleDone(task.id));

      // Label
      const label = document.createElement("span");
      label.className   = "todo-label";
      label.textContent = task.text;

      // Edit input (hidden by default)
      const editInput = document.createElement("input");
      editInput.type      = "text";
      editInput.className = "todo-edit-input";
      editInput.value     = task.text;
      editInput.style.display = "none";

      // Actions
      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const editBtn   = makeBtn("✏️", "btn btn-sm btn-secondary", () => startEdit(li, label, editInput, editBtn, saveBtn, task.id));
      const saveBtn   = makeBtn("💾", "btn btn-sm btn-primary",   () => commitEdit(li, label, editInput, editBtn, saveBtn, task.id));
      const deleteBtn = makeBtn("🗑️", "btn btn-sm btn-danger",    () => deleteTask(task.id));
      saveBtn.style.display = "none";

      actions.append(editBtn, saveBtn, deleteBtn);
      li.append(cb, label, editInput, actions);
      listEl.appendChild(li);

      editInput.addEventListener("keydown", e => {
        if (e.key === "Enter")  commitEdit(li, label, editInput, editBtn, saveBtn, task.id);
        if (e.key === "Escape") cancelEdit(li, label, editInput, editBtn, saveBtn, task);
      });
    });

    const done  = tasks.filter(t => t.done).length;
    countEl.textContent = `${done}/${tasks.length} done`;
  }

  function makeBtn(text, cls, onClick) {
    const b = document.createElement("button");
    b.textContent = text;
    b.className   = cls;
    b.addEventListener("click", onClick);
    return b;
  }

  function toggleDone(id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.done = !task.done; saveTasks(); renderTasks(); }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function startEdit(li, label, editInput, editBtn, saveBtn) {
    label.style.display     = "none";
    editInput.style.display = "block";
    editBtn.style.display   = "none";
    saveBtn.style.display   = "inline-flex";
    editInput.focus();
    editInput.select();
  }

  function commitEdit(li, label, editInput, editBtn, saveBtn, id) {
    const newText = editInput.value.trim();
    if (!newText) { showToast("Task text cannot be empty."); return; }

    // Prevent duplicate on edit
    const dup = tasks.some(t => t.id !== id && t.text.toLowerCase() === newText.toLowerCase());
    if (dup) { showToast(`"${newText}" already exists.`); return; }

    const task = tasks.find(t => t.id === id);
    if (task) { task.text = newText; saveTasks(); renderTasks(); }
  }

  function cancelEdit(li, label, editInput, editBtn, saveBtn, task) {
    label.style.display     = "block";
    editInput.style.display = "none";
    editBtn.style.display   = "inline-flex";
    saveBtn.style.display   = "none";
    editInput.value         = task.text;
  }
})();

/* ─── QUICK LINKS ──────────────────────────────── */

(function initLinks() {
  const nameInput = $("link-name-input");
  const urlInput  = $("link-url-input");
  const addBtn    = $("link-add-btn");
  const grid      = $("links-grid");

  let links = loadLS("quickLinks", []);

  renderLinks();

  addBtn.addEventListener("click", addLink);
  urlInput.addEventListener("keydown", e => { if (e.key === "Enter") addLink(); });

  function addLink() {
    const label = nameInput.value.trim();
    let   url   = urlInput.value.trim();

    if (!label || !url) { showToast("Please fill in both label and URL."); return; }

    // Auto-add https:// if missing
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    links.push({ id: Date.now(), label, url });
    nameInput.value = "";
    urlInput.value  = "";
    saveLS("quickLinks", links);
    renderLinks();
  }

  function renderLinks() {
    grid.innerHTML = "";
    links.forEach(link => {
      const chip = document.createElement("div");
      chip.className = "link-chip";

      const a = document.createElement("a");
      a.href   = link.url;
      a.target = "_blank";
      a.rel    = "noopener noreferrer";
      a.textContent = link.label;

      const del = document.createElement("button");
      del.textContent = "✕";
      del.title       = "Remove";
      del.addEventListener("click", () => {
        links = links.filter(l => l.id !== link.id);
        saveLS("quickLinks", links);
        renderLinks();
      });

      chip.append(a, del);
      grid.appendChild(chip);
    });
  }
})();
