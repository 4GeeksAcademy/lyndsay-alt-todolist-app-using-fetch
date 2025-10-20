import React, { useState, useEffect, useCallback } from "react";

const BASE_URL = "https://playground.4geeks.com/todo";
const username = "lyndsay44";

const Home = () => {
  const [inputValue, setInputValue] = useState("");
  const [toDoList, setToDoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const getToDoList = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/todos/user/${username}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json(); // usually an array of {label, done}
  }, []);

  // POST create empty user list
  const createUser = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/todos/user/${username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    });
    if (!res.ok) throw new Error(`Create user failed: ${res.status}`);
    return res.json();
  }, []);

  // PUT replace the entire list
  const saveToDoList = useCallback(async (list) => {
    const res = await fetch(`${BASE_URL}/todos/user/${username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list), // list is an array of { label, done }
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    return res.json();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        let data = await getToDoList();
        if (data === null) {
          await createUser();
          data = [];
        }

        // handle either [] or { result: [...] }
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.result)
          ? data.result
          : [];
        setToDoList(list);
      } catch (e) {
        console.error(e);
        setErr("Could not load tasks.");
      } finally {
        setLoading(false);
      }
    })();
  }, [getToDoList, createUser, setLoading, setToDoList]);

  const addTask = async (e) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    const updated = [...toDoList, { label: value, done: false }];
    setToDoList(updated);
    setInputValue("");
    try {
      await saveToDoList(updated);
    } catch {
      setErr("Could not save the new task.");
    }
  };
  const removeTask = async (index) => {
    const updated = toDoList.filter((_, i) => i !== index);
    setToDoList(updated);
    try {
      await saveToDoList(updated);
    } catch {
      setErr("Could not delete the task.");
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch(`${BASE_URL}/todo${toDoList}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setToDoList([]);
    } catch (e) {
      console.error(e);
      setErr("Could not clear tasks.");
    }
  };

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
        {toDoList.map((item, index) => (
          <li
            className="list-group-item d-flex justify-content-between align-items-center"
            key={index}
          >
            <span>{item.label ?? String(item)}</span>
            <i
              className="fa-solid fa-trash-can"
              role="button"
              onClick={() => removeTask(index)}
              title="Remove task"
            />
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
