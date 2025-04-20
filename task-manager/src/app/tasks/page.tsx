"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Select from "react-select";

type TaskType = {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: string;
  category?: string;
  completed: boolean;
  createdAt?: { seconds: number };
};

const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const categoryOptions = [
  { value: "Work", label: "Work" },
  { value: "Personal", label: "Personal" },
  { value: "School", label: "School" },
  { value: "Other", label: "Other" },
];

const pageStyles: React.CSSProperties = {
  padding: "20px",
  backgroundColor: "#f8f9fa",
  color: "#212529",
  minHeight: "100vh",
  transition: "background-color 0.3s, color 0.3s",
};

const pastelButtonColor = (color1: string, color2: string): React.CSSProperties => ({
  background: `linear-gradient(45deg, ${color1}, ${color2})`,
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: "bold",
  transition: "background-color 0.3s",
});

const cardStyles = (priority: string, completed: boolean, isFading: boolean): React.CSSProperties => {
  const baseColor = completed ? "#d3d3d3" : priority === "High" ? "#ffadad" : priority === "Medium" ? "#ffd6a5" : "#caffbf";
  return {
    backgroundColor: baseColor,
    opacity: isFading ? 0.5 : 1,
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "15px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "opacity 0.4s",
  };
};

export default function Tasks() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<string>("Low");
  const [category, setCategory] = useState<string>("Other");

  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState<boolean>(false);

  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("lastAdded");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [fadingTasks, setFadingTasks] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else {
        const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const tasksData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<TaskType, "id">),
          }))
          .filter((task) => task.createdAt)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

          setTasks(tasksData);
          setLoading(false);
        });
        return () => unsubscribeFirestore();
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  const handleAddOrUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Please add title and description!");
      return;
    }
    try {
      if (editingTaskId) {
        const taskDoc = doc(db, "tasks", editingTaskId);
        await updateDoc(taskDoc, { title, description, dueDate, priority, category });
        setEditingTaskId(null);
      } else {
        await addDoc(collection(db, "tasks"), {
          title,
          description,
          dueDate,
          priority,
          category,
          userId: auth.currentUser?.uid ?? "",
          completed: false,
          createdAt: serverTimestamp(),
        });
      }
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("Low");
      setCategory("Other");
      setShowAddTaskForm(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const toggleCompleteTask = async (task: TaskType) => {
    setFadingTasks((prev) => [...prev, task.id]);
    setTimeout(async () => {
      await updateDoc(doc(db, "tasks", task.id), { completed: !task.completed });
      setFadingTasks((prev) => prev.filter((id) => id !== task.id));
    }, 400);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const calculateDaysLeft = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sortTasks = (taskList: TaskType[]) => {
    const sorted = [...taskList];
    switch (sortBy) {
      case "priority":
        const order = { High: 1, Medium: 2, Low: 3 };
        return sorted.sort((a, b) => (order[a.priority as keyof typeof order] || 4) - (order[b.priority as keyof typeof order] || 4));
      case "dueDate":
        return sorted.sort((a, b) => new Date(a.dueDate || "").getTime() - new Date(b.dueDate || "").getTime());
      case "alphabetical":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "lastAdded":
      default:
        return sorted;
    }
  };

  return (
    <div style={{ ...pageStyles, backgroundColor: darkMode ? "#333" : "#f8f9fa", color: darkMode ? "#fff" : "#212529" }}>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={handleLogout} style={pastelButtonColor("#a8dadc", "#e5989b")}>Logout</button>
        <button onClick={() => setDarkMode(!darkMode)} style={pastelButtonColor("#ffd6a5", "#52796f")}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Title */}
      <h1 style={{ textAlign: "center" }}>Task Manager</h1>

      {/* Add Task */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={() => setShowAddTaskForm((prev) => !prev)}
          style={{
            backgroundColor: darkMode ? "#6bcf63" : "#cdeac0",
            color: darkMode ? "#fff" : "#333",
            border: "none",
            padding: "12px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {showAddTaskForm ? "Cancel" : "+ Add Task"}
        </button>
      </div>

      {showAddTaskForm && (
        <form onSubmit={handleAddOrUpdateTask} style={{ maxWidth: "600px", margin: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Select options={priorityOptions} value={priorityOptions.find(opt => opt.value === priority)} onChange={(e) => e && setPriority(e.value)} />
          <Select options={categoryOptions} value={categoryOptions.find(opt => opt.value === category)} onChange={(e) => e && setCategory(e.value)} />
          <button type="submit" style={{ marginTop: "10px", backgroundColor: "#52796f", color: "#fff" }}>Save Task</button>
        </form>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginTop: "20px", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
      />

      {/* Tasks */}
      {loading ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <svg width="80" height="80" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke="#52796f">
            <g fill="none" strokeWidth="4">
              <circle cx="22" cy="22" r="20" strokeOpacity="0.3" />
              <path d="M42 22c0-11-9-20-20-20">
                <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="1s" repeatCount="indefinite" />
              </path>
            </g>
          </svg>
        </div>
      ) : (
        <ul style={{ padding: 0, listStyle: "none", marginTop: "30px" }}>
          {sortTasks(tasks)
            .filter(task => {
              if (filter === "completed") return task.completed;
              if (filter === "incomplete") return !task.completed;
              return true;
            })
            .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.description.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(task => {
              const daysLeft = calculateDaysLeft(task.dueDate);
              const isOverdue = daysLeft !== null && daysLeft < 0;
              return (
                <li key={task.id} style={cardStyles(task.priority, task.completed, fadingTasks.includes(task.id))}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <input type="checkbox" checked={task.completed} onChange={() => toggleCompleteTask(task)} />
                    <div>
                      <strong>{task.title}</strong> - {task.description}
                      {task.dueDate && <div style={{ fontSize: "12px", color: isOverdue ? "#e63946" : undefined }}>{isOverdue ? "Overdue" : `Due in ${daysLeft} days`}</div>}
                      <div style={{ fontSize: "12px" }}>Priority: {task.priority}</div>
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
