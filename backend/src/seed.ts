import "dotenv/config";
import mongoose from "mongoose";

import { env } from "./config/env.js";
import { User } from "./models/user.model.js";
import { Repository } from "./models/repository.model.js";
import { RepositoryFile } from "./models/repository-file.model.js";

const seedDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    console.log("MongoDB connected");

    // Clear existing development data
    await User.deleteMany({});
    await Repository.deleteMany({});
    await RepositoryFile.deleteMany({});

    console.log("Existing data cleared");

    // --------------------------------------------------
    // USER
    // --------------------------------------------------

    const user = await User.create({
      name: "Nishith",
      email: "nishith@example.com",
      password: "test-password"
    });

    console.log(`Created user: ${user.name}`);

    // --------------------------------------------------
    // REPOSITORY 1
    // --------------------------------------------------

    const codeAssistant = await Repository.create({
      userId: user._id,
      name: "code-assistant",
      url: "https://github.com/example/code-assistant"
    });

    // --------------------------------------------------
    // REPOSITORY 1 FILES
    // --------------------------------------------------

    await RepositoryFile.insertMany([
      {
        repositoryId: codeAssistant._id,
        path: "src/App.tsx",
        content: `import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "src/main.tsx",
        content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "src/components/Navbar.tsx",
        content: `interface NavbarProps {
  username: string;
}

function Navbar({ username }: NavbarProps) {
  return (
    <nav>
      <h1>Code Assistant</h1>
      <span>{username}</span>
    </nav>
  );
}

export default Navbar;
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "src/components/Sidebar.tsx",
        content: `interface SidebarProps {
  repositories: string[];
}

function Sidebar({ repositories }: SidebarProps) {
  return (
    <aside>
      <h2>Repositories</h2>

      {repositories.map((repository) => (
        <div key={repository}>
          {repository}
        </div>
      ))}
    </aside>
  );
}

export default Sidebar;
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "src/pages/Dashboard.tsx",
        content: `function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome to Code Assistant.</p>
    </main>
  );
}

export default Dashboard;
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "src/pages/Repository.tsx",
        content: `interface RepositoryProps {
  name: string;
}

function Repository({ name }: RepositoryProps) {
  return (
    <main>
      <h1>{name}</h1>
      <p>Select a file to view its source code.</p>
    </main>
  );
}

export default Repository;
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "src/routes/AppRoutes.tsx",
        content: `import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Repository from "../pages/Repository";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route
        path="/repositories/:id"
        element={<Repository name="Repository" />}
      />
    </Routes>
  );
}

export default AppRoutes;
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "package.json",
        content: `{
  "name": "code-assistant",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-router-dom": "^7.0.0"
  }
}
`
      },

      {
        repositoryId: codeAssistant._id,
        path: "README.md",
        content: `# Code Assistant

An AI-powered code intelligence platform.

## Features

- Repository browsing
- Code search
- AI conversations
- Repository analysis
`
      }
    ]);

    // --------------------------------------------------
    // REPOSITORY 2
    // --------------------------------------------------

    const taskManager = await Repository.create({
      userId: user._id,
      name: "task-manager",
      url: "https://github.com/example/task-manager"
    });

    // --------------------------------------------------
    // REPOSITORY 2 FILES
    // --------------------------------------------------

    await RepositoryFile.insertMany([
      {
        repositoryId: taskManager._id,
        path: "src/App.tsx",
        content: `import TaskList from "./components/TaskList";

function App() {
  return (
    <main>
      <h1>Task Manager</h1>
      <TaskList />
    </main>
  );
}

export default App;
`
      },

      {
        repositoryId: taskManager._id,
        path: "src/api.ts",
        content: `export async function getTasks() {
  const response = await fetch("/api/tasks");

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}
`
      },

      {
        repositoryId: taskManager._id,
        path: "src/components/TaskList.tsx",
        content: `interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Learn React",
    completed: true
  },
  {
    id: "2",
    title: "Build project",
    completed: false
  }
];

function TaskList() {
  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>
          <span>{task.title}</span>
        </div>
      ))}
    </div>
  );
}

export default TaskList;
`
      },

      {
        repositoryId: taskManager._id,
        path: "src/components/TaskForm.tsx",
        content: `function TaskForm() {
  return (
    <form>
      <input
        type="text"
        placeholder="Enter task"
      />

      <button type="submit">
        Add Task
      </button>
    </form>
  );
}

export default TaskForm;
`
      },

      {
        repositoryId: taskManager._id,
        path: "package.json",
        content: `{
  "name": "task-manager",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^19.0.0"
  }
}
`
      },

      {
        repositoryId: taskManager._id,
        path: "README.md",
        content: `# Task Manager

A simple task management application.

## Features

- Create tasks
- View tasks
- Complete tasks
`
      }
    ]);

    console.log("Repositories and files created");

    console.log("\nSeed completed successfully.");
    console.log("--------------------------------");
    console.log(`User: ${user._id}`);
    console.log(`Repository 1: ${codeAssistant._id}`);
    console.log(`Repository 2: ${taskManager._id}`);
    console.log("--------------------------------");

  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedDatabase();