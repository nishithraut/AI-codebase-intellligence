
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { env } from "./config/env.js";
import { User } from "./models/user.model.js";
import { Repository } from "./models/repository.model.js";
import { RepositoryFile } from "./models/repository-file.model.js";

const DEMO_PASSWORD = "DevPass123!";

const users = [
  { name: "Nishith", email: "nishith@example.com" },
  { name: "Aarav Sharma", email: "aarav@example.com" },
  { name: "Priya Patel", email: "priya@example.com" },
  { name: "Rohan Verma", email: "rohan@example.com" },
  { name: "Ananya Singh", email: "ananya@example.com" },
];

const repositories = [
  {
    ownerEmail: "nishith@example.com",
    name: "code-assistant",
    url: "https://github.com/example/code-assistant",
    language: "TypeScript",
    files: [
      {
        path: "src/App.tsx",
        content: `import React from "react";

export default function App() {
  return <main><h1>Code Assistant</h1></main>;
}`,
      },
      {
        path: "src/components/Navbar.tsx",
        content: `interface NavbarProps {
  username: string;
}

export default function Navbar({ username }: NavbarProps) {
  return <nav>Welcome, {username}</nav>;
}`,
      },
      {
        path: "README.md",
        content: `# Code Assistant

An AI-powered codebase intelligence platform.

## Features
- Repository browsing
- Code search
- AI conversations`,
      },
    ],
  },
  {
    ownerEmail: "nishith@example.com",
    name: "ml-pipeline",
    url: "https://github.com/example/ml-pipeline",
    language: "Python",
    files: [
      {
        path: "src/main.py",
        content: `from src.pipeline import run_pipeline

if __name__ == "__main__":
    run_pipeline()`,
      },
      {
        path: "src/pipeline.py",
        content: `def run_pipeline():
    print("Starting ML pipeline")
    load_data()
    train_model()

def load_data():
    print("Loading training data")

def train_model():
    print("Training model")`,
      },
      {
        path: "requirements.txt",
        content: `pandas
numpy
scikit-learn`,
      },
    ],
  },
  {
    ownerEmail: "aarav@example.com",
    name: "task-manager",
    url: "https://github.com/example/task-manager",
    language: "TypeScript",
    files: [
      {
        path: "src/App.tsx",
        content: `import TaskList from "./components/TaskList";

export default function App() {
  return <TaskList />;
}`,
      },
      {
        path: "src/components/TaskList.tsx",
        content: `interface Task {
  id: number;
  title: string;
  completed: boolean;
}

const tasks: Task[] = [
  { id: 1, title: "Learn React", completed: true },
  { id: 2, title: "Build project", completed: false },
];

export default function TaskList() {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}`,
      },
      {
        path: "README.md",
        content: `# Task Manager

Manage tasks, track progress, and organize daily work.`,
      },
    ],
  },
  {
    ownerEmail: "aarav@example.com",
    name: "payment-service",
    url: "https://github.com/example/payment-service",
    language: "Java",
    files: [
      {
        path: "src/main/java/com/example/Payment.java",
        content: `package com.example;

public class Payment {
    private final double amount;

    public Payment(double amount) {
        this.amount = amount;
    }

    public double getAmount() {
        return amount;
    }
}`,
      },
      {
        path: "src/main/java/com/example/PaymentService.java",
        content: `package com.example;

public class PaymentService {
    public boolean process(Payment payment) {
        return payment.getAmount() > 0;
    }
}`,
      },
      {
        path: "README.md",
        content: `# Payment Service

A sample Java service for payment processing.`,
      },
    ],
  },
  {
    ownerEmail: "priya@example.com",
    name: "analytics-engine",
    url: "https://github.com/example/analytics-engine",
    language: "Python",
    files: [
      {
        path: "src/main.py",
        content: `from analytics import calculate_average

values = [10, 20, 30]
print(calculate_average(values))`,
      },
      {
        path: "src/analytics.py",
        content: `def calculate_average(values: list[float]) -> float:
    if not values:
        return 0
    return sum(values) / len(values)`,
      },
      {
        path: "tests/test_analytics.py",
        content: `from src.analytics import calculate_average

def test_average():
    assert calculate_average([10, 20, 30]) == 20`,
      },
    ],
  },
  {
    ownerEmail: "priya@example.com",
    name: "frontend-dashboard",
    url: "https://github.com/example/frontend-dashboard",
    language: "React",
    files: [
      {
        path: "src/App.jsx",
        content: `import Dashboard from "./components/Dashboard";

export default function App() {
  return <Dashboard />;
}`,
      },
      {
        path: "src/components/Dashboard.jsx",
        content: `export default function Dashboard() {
  return (
    <main>
      <h1>Analytics Dashboard</h1>
      <p>Welcome to your workspace.</p>
    </main>
  );
}`,
      },
      {
        path: "package.json",
        content: `{
  "name": "frontend-dashboard",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}`,
      },
    ],
  },
  {
    ownerEmail: "rohan@example.com",
    name: "notification-service",
    url: "https://github.com/example/notification-service",
    language: "Go",
    files: [
      {
        path: "main.go",
        content: `package main

import "fmt"

func main() {
    fmt.Println("Notification service started")
}`,
      },
      {
        path: "internal/notification/sender.go",
        content: `package notification

type Sender struct{}

func (s Sender) Send(message string) string {
    return "Sent: " + message
}`,
      },
      {
        path: "README.md",
        content: `# Notification Service

A sample Go service for delivering notifications.`,
      },
    ],
  },
  {
    ownerEmail: "rohan@example.com",
    name: "inventory-api",
    url: "https://github.com/example/inventory-api",
    language: "JavaScript",
    files: [
      {
        path: "src/server.js",
        content: `import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;`,
      },
      {
        path: "src/routes/products.js",
        content: `import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json([{ id: 1, name: "Keyboard" }]);
});

export default router;`,
      },
      {
        path: "README.md",
        content: `# Inventory API

An API for managing products and inventory.`,
      },
    ],
  },
  {
    ownerEmail: "ananya@example.com",
    name: "mobile-app",
    url: "https://github.com/example/mobile-app",
    language: "React Native",
    files: [
      {
        path: "App.tsx",
        content: `import { View, Text } from "react-native";

export default function App() {
  return (
    <View>
      <Text>Mobile Workspace</Text>
    </View>
  );
}`,
      },
      {
        path: "src/screens/HomeScreen.tsx",
        content: `import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View>
      <Text>Welcome Home</Text>
    </View>
  );
}`,
      },
      {
        path: "README.md",
        content: `# Mobile App

A sample React Native application.`,
      },
    ],
  },
  {
    ownerEmail: "ananya@example.com",
    name: "data-warehouse",
    url: "https://github.com/example/data-warehouse",
    language: "SQL",
    files: [
      {
        path: "sql/schema.sql",
        content: `CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE
);`,
      },
      {
        path: "sql/queries/customer_report.sql",
        content: `SELECT
    COUNT(*) AS customer_count
FROM customers;`,
      },
      {
        path: "README.md",
        content: `# Data Warehouse

Sample database schemas and analytics queries.`,
      },
    ],
  },
];

async function seedDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("MongoDB connected");

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const userIds = new Map<string, mongoose.Types.ObjectId>();

    // Create or update the five known demo users.
    for (const userData of users) {
      const user = await User.findOneAndUpdate(
        { email: userData.email },
        {
          $set: {
            name: userData.name,
            password: passwordHash,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      userIds.set(userData.email, user._id);
    }

    let repositoryCount = 0;
    let fileCount = 0;

    for (const repoData of repositories) {
      const userId = userIds.get(repoData.ownerEmail);

      if (!userId) {
        throw new Error(`Demo user not found: ${repoData.ownerEmail}`);
      }

      const repository = await Repository.findOneAndUpdate(
        { userId, url: repoData.url },
        {
          $set: {
            userId,
            name: repoData.name,
            url: repoData.url,
            language: repoData.language,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      repositoryCount++;

      // Upsert files individually to avoid duplicates on reruns.
      for (const file of repoData.files) {
        await RepositoryFile.findOneAndUpdate(
          { repositoryId: repository._id, path: file.path },
          {
            $set: {
              repositoryId: repository._id,
              path: file.path,
              content: file.content,
            },
          },
          { upsert: true, runValidators: true }
        );

        fileCount++;
      }
    }

    console.log("Seed completed successfully.");
    console.log(`Demo users: ${users.length}`);
    console.log(`Repositories processed: ${repositoryCount}`);
    console.log(`Files processed: ${fileCount}`);
    console.log(`Demo password: ${DEMO_PASSWORD}`);
    console.log("Demo emails:");

    for (const user of users) {
      console.log(`- ${user.email}`);
    }
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

seedDatabase();
