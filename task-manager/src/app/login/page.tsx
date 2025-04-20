"use client";

import { useState } from "react";
import { auth } from "../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/tasks"); 
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1a1f2b",
      color: "#fff",
      fontFamily: "'Poppins', sans-serif",
      padding: "20px"
    }}>
      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        backgroundColor: "#2c2f45",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h1 style={{ textAlign: "center" }}>Sign In</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            color: "#000",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            color: "#000",
          }}
        />
        <button type="submit" style={{
          backgroundColor: "#52796f",
          color: "#fff",
          border: "none",
          padding: "12px",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "16px"
        }}>
          Sign In
        </button>
        <p style={{ textAlign: "center", fontSize: "14px" }}>
          Don't have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            style={{ color: "#ffd6a5", cursor: "pointer", textDecoration: "underline" }}
          >
            Create one
          </span>
        </p>
      </form>
    </div>
  );
}
