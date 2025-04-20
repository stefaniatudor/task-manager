"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#1a1f2b",
      color: "#ffffff",
      fontFamily: "'Poppins', sans-serif",
      textAlign: "center",
      gap: "20px",
      padding: "20px"
    }}>
      <h1>Welcome to the Task Manager App</h1>
      <p>Manage your tasks easily and stay organized.</p>
      <div style={{ display: "flex", gap: "20px" }}>
        <button 
          onClick={() => router.push("/login")}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            backgroundColor: "#52796f",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Sign In
        </button>
        <button 
          onClick={() => router.push("/signup")}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            backgroundColor: "#6bcf63",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
