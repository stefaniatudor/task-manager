"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Select from 'react-select';

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const categoryOptions = [
  { value: 'Work', label: 'Work' },
  { value: 'Personal', label: 'Personal' },
  { value: 'School', label: 'School' },
  { value: 'Other', label: 'Other' },
];


export default function Tasks() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("Other");

  const [tasks, setTasks] = useState<{ id: string; createdAt: string; [key: string]: string }[]>([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);

  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastAdded");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fadingTasks, setFadingTasks] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else {
        const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const tasksData = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              createdAt: doc.data().createdAt,
              ...doc.data(),
            }))
            .filter(task => task.createdAt) // ignore incomplete tasks
            .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds); // sort after date
  
          setTasks(tasksData);
          setLoading(false);
        });
        return () => unsubscribeFirestore();
      }
    });
  
    return () => unsubscribeAuth();
  }, [router]);
  
  const handleAddOrUpdateTask = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Add title and description!");
      return;
    }
    try {
      if (editingTaskId) {
        const taskDoc = doc(db, "tasks", editingTaskId);
        await updateDoc(taskDoc, {
          title,
          description,
          dueDate,
          priority,
          category,
        });
        setEditingTaskId(null);
      } else {
        await addDoc(collection(db, "tasks"), {
          title,
          description,
          dueDate,
          priority,
          category,
          userId: auth.currentUser ? auth.currentUser.uid : "",
          completed: false,
          createdAt: serverTimestamp(),
        });
      }
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("Low");
      setCategory("Other");
      setShowAddTaskForm(false); // Close form
    } catch (error) {
      alert((error as Error).message);
    }
  };
  

  // const startEditingTask = (task: { id: SetStateAction<null>; title: SetStateAction<string>; description: SetStateAction<string>; dueDate: string; priority: string; }) => {
  //   setEditingTaskId(task.id);
  //   setTitle(task.title);
  //   setDescription(task.description);
  //   setDueDate(task.dueDate || "");
  //   setPriority(task.priority || "Low");
  // };

  const toggleCompleteTask = async (task: { [x: string]: string; id: string; createdAt: string; completed: string; }) => {
    setFadingTasks((prev) => [...prev, task.id]);
    setTimeout(async () => {
      const taskDoc = doc(db, "tasks", task.id);
      await updateDoc(taskDoc, {
        completed: !task.completed,
      });
      setFadingTasks((prev) => prev.filter((id) => id !== task.id));
    }, 400);
  };

  // const handleDeleteTask = async (id: string) => {
  //   try {
  //     await deleteDoc(doc(db, "tasks", id));
  //   } catch (error) {
  //     alert((error as Error).message);
  //   }
  // };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const pageStyles = {
    backgroundColor: darkMode ? "#1a1f2b" : "#f8f4ec",
    color: darkMode ? "#FFFFFF" : "#333333",
    minHeight: "100vh",
    padding: "20px",
    transition: "all 0.3s ease",
    fontFamily: "'Poppins', sans-serif",
  };

  const getCardColor = (priority: string, completed: string) => {
    if (completed) return darkMode ? "#555555" : "#d3d3d3";
    if (priority === "High") return darkMode ? "#ff6b6b" : "#ffb3b3";
    if (priority === "Medium") return darkMode ? "#ffd93d" : "#fff3b0";
    if (priority === "Low") return darkMode ? "#6bcf63" : "#cdeac0";
    return darkMode ? "#3d5a80" : "#fff7d6";
  };

  const cardStyles = (priority: string, completed: string, isFading: boolean) => ({
    marginBottom: "20px",
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: getCardColor(priority, completed),
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    transition: "all 0.4s ease",
    opacity: isFading ? 0 : 1,
    transform: isFading ? "scale(0.95)" : "scale(1)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });

  const pastelButtonColor = (lightColor: string, darkColor: string) => ({
    backgroundColor: darkMode ? darkColor : lightColor,
    color: darkMode ? "#fff" : "#333",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  });

  const calculateDaysLeft = (dueDate: string | number | Date) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const sortTasks = (taskList: { [key: string]: string; id: string; createdAt: string; }[]) => {
    const sortedTasks = [...taskList];
    switch (sortBy) {
      case "priority":
        const priorityOrder = { High: 1, Medium: 2, Low: 3 };
        return sortedTasks.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 4));
      case "dueDate":
        return sortedTasks.sort((a, b) => new Date(a.dueDate || Infinity).getTime() - new Date(b.dueDate || Infinity).getTime());
      case "lastAdded":
        return sortedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "alphabetical":
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sortedTasks;
    }
  };

  return (
    <div style={pageStyles}>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <button onClick={handleLogout} style={pastelButtonColor("#a8dadc", "#e5989b")}>
          Logout
        </button>
        <button onClick={() => setDarkMode(!darkMode)} style={pastelButtonColor("#ffd6a5", "#52796f")}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: "32px", textAlign: "center", marginBottom: "20px" }}>Task Manager</h1>

      {/* Button + Add Task Form */}
<div style={{ marginBottom: "20px", textAlign: "center" }}>
  <button
    onClick={() => setShowAddTaskForm(prev => !prev)}
    style={{
      backgroundColor: darkMode ? "#6bcf63" : "#cdeac0",
      color: darkMode ? "#fff" : "#333",
      border: "none",
      padding: "12px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "18px",
      fontWeight: "bold",
      transition: "background-color 0.3s"
    }}
  >
    {showAddTaskForm ? "Cancel" : "+ Add Task"}
  </button>
</div>

{showAddTaskForm && (
  <form onSubmit={handleAddOrUpdateTask} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px", maxWidth: "600px", margin: "auto" }}>
    <input
      type="text"
      placeholder="Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />
    <textarea
      placeholder="Description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      required
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />
    <input
      type="text"
      placeholder="Due Date (yyyy-mm-dd)"
      value={dueDate}
      onFocus={(e) => e.target.type = "date"}
      onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
      onChange={(e) => setDueDate(e.target.value)}
      style={{ padding: "10px", borderRadius: "8px", 
        color: darkMode ? "#fff" : "#000", border: "1px solid #ccc" }}
    />
 <Select
  options={priorityOptions}
  value={priorityOptions.find(opt => opt.value === priority)}
  onChange={(e) => e && setPriority(e.value)}
  styles={{
    control: (base) => ({
      ...base,
      backgroundColor: darkMode ? "#333" : "#fff",
      color: darkMode ? "#fff" : "#000",
      borderRadius: "8px",
      border: "1px solid #ccc",
      padding: "2px",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: darkMode ? "#333" : "#fff",
    }),
    singleValue: (base) => ({
      ...base,
      color: darkMode ? "#fff" : "#000",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused
        ? darkMode
          ? "#555"
          : "#eee"
        : darkMode
        ? "#333"
        : "#fff",
      color: darkMode ? "#fff" : "#000",
      cursor: "pointer",
    }),
  }}
/>

<Select
  options={categoryOptions}
  value={categoryOptions.find(opt => opt.value === category)}
  onChange={(e) => e && setCategory(e.value)}
  styles={{
    control: (base) => ({
      ...base,
      backgroundColor: darkMode ? "#333" : "#fff",
      color: darkMode ? "#fff" : "#000",
      borderRadius: "8px",
      border: "1px solid #ccc",
      padding: "2px",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: darkMode ? "#333" : "#fff",
    }),
    singleValue: (base) => ({
      ...base,
      color: darkMode ? "#fff" : "#000",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused
        ? darkMode
          ? "#555"
          : "#eee"
        : darkMode
        ? "#333"
        : "#fff",
      color: darkMode ? "#fff" : "#000",
      cursor: "pointer",
    }),
  }}
/>

    <button
      type="submit"
      style={{
        backgroundColor: darkMode ? "#52796f" : "#a8dadc",
        color: darkMode ? "#fff" : "#333",
        border: "none",
        padding: "12px 20px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "18px",
        fontWeight: "bold",
        transition: "background-color 0.3s"
      }}
    >
      Save Task
    </button>
  </form>
)}


      {/* Search */}
      <input
        type="text"
        placeholder="Caută taskuri..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "20px", width: "100%" }}
      />

      {/* Sorting + Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <label>Filter: </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: darkMode ? "#333" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: "1px solid #ccc",
            }}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>
        <div>
          <label>Sort: </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: darkMode ? "#333" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: "1px solid #ccc",
            }}
          >
            <option value="lastAdded">Last Added</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="alphabetical">Alphabetically</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <svg width="80" height="80" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke={darkMode ? "#a8dadc" : "#52796f"}>
            <g fill="none" fillRule="evenodd" strokeWidth="4">
              <circle cx="22" cy="22" r="20" strokeOpacity="0.3" />
              <path d="M42 22c0-11.046-8.954-20-20-20">
                <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="1s" repeatCount="indefinite" />
              </path>
            </g>
          </svg>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {sortTasks(tasks)
            .filter((task) => {
              if (filter === "completed") return task.completed;
              if (filter === "incomplete") return !task.completed;
              return true;
            })
            .filter((task) =>
              task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((task) => {
              const daysLeft = calculateDaysLeft(task.dueDate);
              const isOverdue = daysLeft !== null && daysLeft < 0;

              return (
                <li
                  key={task.id}
                  style={cardStyles(task.priority, task.completed, fadingTasks.includes(task.id)) as React.CSSProperties}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <input
                      type="checkbox"
                      checked={task.completed as unknown as boolean}
                      onChange={() => toggleCompleteTask(task as ({ [x: string]: string; id: string; createdAt: string; completed: string; }))}
                    />
                    <span style={{
                      textDecoration: task.completed ? "line-through" : "none",
                      fontSize: "20px",
                      fontWeight: "bold",
                      wordBreak: "break-word"
                    }}>
                      {task.title}
                    </span>
                  </div>
                  <div style={{ color: "#555", wordBreak: "break-word" }}>
                    {task.description}
                  </div>
                  {task.dueDate && (
                    <div style={{ fontSize: "14px", color: isOverdue ? "#e63946" : (darkMode ? "#a8dadc" : "#52796f") }}>
                      {isOverdue
                        ? "Overdue"
                        : `In ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
                    </div>
                  )}
                  {task.priority && (
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: darkMode ? "#ffd6a5" : "#52796f" }}>
                      Priority: {task.priority}
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}