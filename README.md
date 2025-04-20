# Task Manager

A task management application built with **Next.js 15**, **TypeScript**, **Firebase Authentication**, and **Firestore**.  
Deployed on **Firebase Hosting**.

## Setup Instructions

### Clone Repository

```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

### Install Dependencies

```bash
npm install
```

### Firebase Configuration

```
// src/firebase/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Next.js Configuration

```
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
};

module.exports = nextConfig;
```

### Build Project

```bash
npm run build
```

### Firebase Initialization

```bash
firebase login
firebase init hosting
```

## Tech Stack

- Next.js 15

- TypeScript

- Firebase Authentication

- Firestore Database

- Firebase Hosting
  

## Features

- User Registration and Login (Email/Password)

- Create, Read, Update, Delete Tasks

- Set Priority and Category for Tasks

- Mark Tasks as Completed

- Dark Mode Toggle

- Search and Filter Tasks

- Sorting by Priority, Due Date, or Alphabetically


## Project Structure

task-manager/
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── tasks/
│   ├── firebase/
│   │   └── firebase.ts
├── public/
├── .firebaserc
├── firebase.json
├── next.config.js
├── package.json
└── README.md


