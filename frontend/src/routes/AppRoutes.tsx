import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth pages
import Login from "../components/login/Login";
import Register from "../components/signup/Signup";

// Main pages
import Dashboard from "../pages/dashboard/Dashboard";
import Repositories from "../pages/repositories/Repositories";
import RepositoryDetails from "../pages/repositories/RepositoryDetails";
// import CodeSearch from "../pages/repositories/CodeSearch";
// import Chat from "../pages/repositories/Chat";
// import AgentActivity from "../pages/repositories/AgentActivity";
// import Conversations from "../pages/conversations/Conversations";
// import Usage from "../pages/usage/Usage";
// import Settings from "../pages/settings/Settings";

// Layout
import AppLayout from "../components/layout/AppLayout";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        {/* <Route path="/" element={<AppLayout />}/>

        {/* Authenticated application */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/repositories" element={<Repositories />} />

          <Route
            path="/repositories/:repositoryId"
            element={<RepositoryDetails />}
          />
          {/* 

          <Route
            path="/repositories/:repositoryId"
            element={<RepositoryDetails />}
          />

          <Route
            path="/repositories/:repositoryId/search"
            element={<CodeSearch />}
          />

          <Route
            path="/repositories/:repositoryId/chat"
            element={<Chat />}
          />

          <Route
            path="/repositories/:repositoryId/activity"
            element={<AgentActivity />}
          />

          <Route path="/conversations" element={<Conversations />} />

          <Route path="/usage" element={<Usage />} />

          <Route path="/settings" element={<Settings />} /> */}
        </Route>

        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        {/* <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;