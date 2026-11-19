import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

/**
 * Optional backend (server.js: Express + MongoDB).
 * Set VITE_API_URL at build time to sync with it. Without it the board
 * keeps tasks in the browser, so the Vercel deployment works on its own.
 */
const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const STORAGE_KEY = "taskmanager-tasks-v1";

const COLUMNS = [
  { status: "Pending", icon: "🕒", hint: "Not started yet" },
  { status: "Ongoing", icon: "🚀", hint: "Work in progress" },
  { status: "Completed", icon: "✅", hint: "Finished" },
];

const MOVES = {
  Pending: [
    { label: "Start", to: "Ongoing" },
    { label: "Complete", to: "Completed" },
  ],
  Ongoing: [
    { label: "Back", to: "Pending" },
    { label: "Complete", to: "Completed" },
  ],
  Completed: [{ label: "Reopen", to: "Pending" }],
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function readLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.map(normalise) : [];
  } catch {
    return [];
  }
}

function writeLocal(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* storage blocked - the board still works for this visit */
  }
}

function normalise(raw) {
  return {
    id: String(raw._id || raw.id || newId()),
    title: String(raw.title || "Untitled task"),
    status: COLUMNS.some((col) => col.status === raw.status)
      ? raw.status
      : "Pending",
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [tasks, setTasks] = useState(() => readLocal());
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Pending");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Pull the shared list when a backend is configured for this build.
  useEffect(() => {
    if (!API) return;
    let cancelled = false;

    axios
      .get(`${API}/tasks`)
      .then((response) => {
        if (cancelled) return;
        const list = Array.isArray(response.data)
          ? response.data.map(normalise)
          : [];
        setTasks(list);
        writeLocal(list);
      })
      .catch(() => {
        /* offline or backend down - keep the local board */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (text, type = "ok") => setToast({ text, type });

  const commit = (next) => {
    setTasks(next);
    writeLocal(next);
  };

  const addTask = (event) => {
    event.preventDefault();
    const clean = title.trim();

    if (!clean) {
      notify("Type a task title first", "error");
      return;
    }

    const task = {
      id: newId(),
      title: clean,
      status,
      createdAt: new Date().toISOString(),
    };

    commit([task, ...tasks]);
    setTitle("");
    notify(`Added to ${status.toLowerCase()}`);

    if (API) {
      axios.post(`${API}/tasks`, { title: clean, status }).catch(() => {});
    }
  };

  const moveTask = (task, nextStatus) => {
    commit(
      tasks.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item
      )
    );
    notify(`Moved to ${nextStatus.toLowerCase()}`);

    if (API) {
      axios.patch(`${API}/tasks/${task.id}`, { status: nextStatus }).catch(() => {});
    }
  };

  const removeTask = (task) => {
    commit(tasks.filter((item) => item.id !== task.id));
    notify("Task deleted");

    if (API) {
      axios.delete(`${API}/tasks/${task.id}`).catch(() => {});
    }
  };

  const clearCompleted = () => {
    const completed = tasks.filter((item) => item.status === "Completed");
    commit(tasks.filter((item) => item.status !== "Completed"));
    notify(
      `Cleared ${completed.length} completed task${completed.length === 1 ? "" : "s"}`
    );

    if (API) {
      completed.forEach((item) =>
        axios.delete(`${API}/tasks/${item.id}`).catch(() => {})
      );
    }
  };

  const query = search.trim().toLowerCase();
  const visible = query
    ? tasks.filter((task) => task.title.toLowerCase().includes(query))
    : tasks;

  const countFor = (columnStatus) =>
    tasks.filter((task) => task.status === columnStatus).length;

  const total = tasks.length;
  const completed = countFor("Completed");
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">FSWD · Exercise 4</p>
          <h1>Task Manager</h1>
          <p className="lede">
            Plan, track and finish work across three simple columns.
          </p>
        </div>

        <div className="progress-wrap">
          <span className="progress-label">
            {completed} / {total} completed
          </span>
          <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <section className="toolbar">
        <form className="add-form" onSubmit={addTask}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            aria-label="Task title"
            maxLength={120}
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Initial status"
          >
            {COLUMNS.map((col) => (
              <option key={col.status} value={col.status}>
                {col.status}
              </option>
            ))}
          </select>

          <button className="btn primary" type="submit">
            Add task
          </button>
        </form>

        <div className="toolbar-row">
          <input
            type="search"
            className="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
          />

          <button
            type="button"
            className="btn ghost"
            onClick={clearCompleted}
            disabled={completed === 0}
          >
            Clear completed
          </button>
        </div>
      </section>

      <div className="board">
        {COLUMNS.map((col) => {
          const columnTasks = visible.filter((task) => task.status === col.status);

          return (
            <section
              key={col.status}
              className={`column col-${col.status.toLowerCase()}`}
            >
              <header className="col-head">
                <span className="col-title">
                  <span aria-hidden="true">{col.icon}</span>
                  {col.status}
                </span>
                <span className="count">{columnTasks.length}</span>
              </header>

              <p className="col-hint">{col.hint}</p>

              <div className="col-body">
                {columnTasks.map((task) => (
                  <article className="task" key={task.id}>
                    <div className="task-top">
                      <h3>{task.title}</h3>
                      <button
                        type="button"
                        className="icon-delete"
                        aria-label={`Delete ${task.title}`}
                        onClick={() => removeTask(task)}
                      >
                        ✕
                      </button>
                    </div>

                    <p className="task-meta">{formatWhen(task.createdAt)}</p>

                    <div className="task-actions">
                      {MOVES[task.status].map((move) => (
                        <button
                          key={move.to}
                          type="button"
                          className="btn small"
                          onClick={() => moveTask(task, move.to)}
                        >
                          {move.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}

                {columnTasks.length === 0 && (
                  <p className="empty">
                    {query ? "No matching tasks" : "Nothing here yet"}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="foot">
        <span>
          {API
            ? "Synced with the Task Manager API"
            : "Tasks are saved in this browser · set VITE_API_URL to sync with the Express + MongoDB API"}
        </span>
      </footer>

      {toast && (
        <div className={`toast ${toast.type}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}
    </div>
  );
}
