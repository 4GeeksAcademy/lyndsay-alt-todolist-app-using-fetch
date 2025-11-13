import React, { useState, useEffect, useCallback } from "react";

const BASE_URL = "https://playground.4geeks.com/todo";
const username = "lyndsay44";

const Home = () => {
  const [inputValue, setInputValue] = useState("");
  const [toDoList, setToDoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ===== API HELPERS =====

  // Read user + todos
  const getUser = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/users/${username}`);

    // user doesn't exist yet
    if (res.status === 404) return null;

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }, []);

  // Create user (empty)
  const createUser = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/users/${username}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`Create user failed: ${res.status}`);
    return res.json();
  }, []);

  const normalizeList = (data) =>
    Array.isArray(data?.todos) ? data.todos : Array.isArray(data) ? data : [];

  const reloadFromServer = useCallback(async () => {
    try {
      const data = await getUser();
      const list = normalizeList(data || {});
      setToDoList(list);
    } catch (e) {
      console.error(e);
      setErr("Could not reload tasks from server.");
    }
  }, [getUser]);

  // ===== LOAD ON START =====

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        let data = await getUser();

        // If the user doesn't exist, create them and fetch again
        if (data === null) {
          await createUser();
          data = await getUser();
        }

        const list = normalizeList(data);
        setToDoList(list);
      } catch (e) {
        console.error(e);
        setErr("Could not load tasks.");
      } finally {
        setLoading(false);
      }
    })();
  }, [getUser, createUser]);

  // ===== ADD TASK (POST /todos/{username}, then GET /users/{username}) =====

  const addTask = async (e) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    setErr("");

    // Optional optimistic UI
    const tempTask = {
      id: crypto.randomUUID(),
      label: value,
      done: false,
    };
    setToDoList((prev) => [...prev, tempTask]);
    setInputValue("");

    try {
      const taskToSend = { label: value, done: false };

      const res = await fetch(`${BASE_URL}/todos/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskToSend),
      });

      if (!res.ok) throw new Error(`Add task failed: ${res.status}`);

      await reloadFromServer(); // sync with backend
    } catch (e) {
      console.error(e);
      setErr("Could not save the new task.");
    }
  };

  // ===== DELETE SINGLE TASK (DELETE /todos/{todo_id}, then GET) =====

  const removeTask = async (todoId) => {
    setErr("");

    // optimistic UI
    setToDoList((prev) => prev.filter((t) => t.id !== todoId));

    try {
      const res = await fetch(`${BASE_URL}/todos/${todoId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      await reloadFromServer();
    } catch (e) {
      console.error(e);
      setErr("Could not delete the task.");
    }
  };

  // ===== CLEAR ALL TASKS (DELETE each /todos/{id}) =====

  const clearAll = async () => {
    setErr("");

    try {
      await Promise.all(
        toDoList.map((item) =>
          fetch(`${BASE_URL}/todos/${item.id}`, { method: "DELETE" })
        )
      );

      setToDoList([]);
    } catch (e) {
      console.error(e);
      setErr("Could not clear tasks.");
    }
  };

  // ===== UI =====

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1>My To-Do List</h1>

      <form onSubmit={addTask} className="mb-3">
        <input
          type="text"
          placeholder="Add a new task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="form-control"
        />
      </form>

      {loading && <div>Loading…</div>}
      {err && <div className="text-danger mb-2">{err}</div>}

      <ul className="list-group">
        {toDoList.map((item) => (
          <li
            className="list-group-item d-flex justify-content-between align-items-center"
            key={item.id ?? item.label}
          >
            <span>{item.label ?? String(item)}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => removeTask(item.id)}
            >
              Delete
            </button>
          </li>
        ))}
        {toDoList.length === 0 && !loading && (
          <li className="list-group-item text-muted">
            No tasks. Add your first one!
          </li>
        )}
      </ul>

      <div className="d-flex justify-content-between mt-3">
        <div>
          {toDoList.length} task{toDoList.length !== 1 ? "s" : ""}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={clearAll}>
          Clear all
        </button>
      </div>
    </div>
  );
};

export default Home;
