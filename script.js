(function () {
  "use strict";

  const STORAGE_KEY = "student-task-board.tasks";
  let tasks = loadTasks();
  let activeFilter = "all";

  // ---------- Storage ----------
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Could not read saved tasks:", err);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error("Could not save tasks:", err);
    }
  }

  // ---------- Elements ----------
  const grid = document.getElementById("task-grid");
  const emptyState = document.getElementById("empty-state");
  const form = document.getElementById("task-form");
  const newTaskBtn = document.getElementById("new-task-btn");
  const cancelBtn = document.getElementById("cancel-task-btn");
  const titleInput = document.getElementById("task-title");
  const notesInput = document.getElementById("task-notes");
  const dueInput = document.getElementById("task-due");
  const priorityInput = document.getElementById("task-priority");

  const filterButtons = document.querySelectorAll(".filter");
  const tabButtons = document.querySelectorAll(".tab");
  const views = document.querySelectorAll(".view");

  // ---------- View / tab switching ----------
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const target = btn.dataset.view;
      views.forEach((v) => v.classList.toggle("is-active", v.id === "view-" + target));
    });
  });

  // ---------- New task form ----------
  newTaskBtn.addEventListener("click", () => {
    form.hidden = false;
    titleInput.focus();
    newTaskBtn.hidden = true;
  });

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.hidden = true;
    newTaskBtn.hidden = false;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;

    tasks.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title,
      notes: notesInput.value.trim(),
      due: dueInput.value,
      priority: priorityInput.value,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    saveTasks();
    form.reset();
    form.hidden = true;
    newTaskBtn.hidden = false;
    render();
  });

  // ---------- Filters ----------
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // ---------- Helpers ----------
  function formatDue(dateStr) {
    if (!dateStr) return "No due date";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return "No due date";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function isOverdue(task) {
    if (!task.due || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due + "T00:00:00");
    return due < today;
  }

  // ---------- Render ----------
  function render() {
    const counts = {
      all: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    };
    document.getElementById("count-all").textContent = counts.all;
    document.getElementById("count-pending").textContent = counts.pending;
    document.getElementById("count-completed").textContent = counts.completed;

    let visible = tasks;
    if (activeFilter === "pending") visible = tasks.filter((t) => !t.completed);
    if (activeFilter === "completed") visible = tasks.filter((t) => t.completed);

    grid.innerHTML = "";
    emptyState.hidden = visible.length !== 0;

    visible.forEach((task) => {
      const card = document.createElement("article");
      card.className = "card task-card" + (task.completed ? " is-completed" : "");
      card.dataset.priority = task.priority;
      card.dataset.id = task.id;

      const overdue = isOverdue(task);

      card.innerHTML = `
        <div class="pin" aria-hidden="true"></div>
        <span class="stamp">Done</span>
        <button class="delete-btn" title="Remove card" aria-label="Remove task">&times;</button>
        <h3 class="task-title"></h3>
        ${task.notes ? '<p class="task-notes"></p>' : ""}
        <div class="task-meta">
          <span class="due-chip${overdue ? " is-overdue" : ""}">${overdue ? "Overdue · " : ""}${formatDue(task.due)}</span>
          <button class="complete-toggle" type="button">
            <span class="box"></span>${task.completed ? "Completed" : "Mark done"}
          </button>
        </div>
      `;

      card.querySelector(".task-title").textContent = task.title;
      if (task.notes) card.querySelector(".task-notes").textContent = task.notes;

      card.querySelector(".complete-toggle").addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasks();
        render();
      });

      card.querySelector(".delete-btn").addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        render();
      });

      grid.appendChild(card);
    });
  }

  render();
})();
