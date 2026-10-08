import { Outlet } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import Sidebar from "./Sidebar/Sidebar"

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
        {/* fixed navbar */}
        <Navbar />

        {/* fixed sidebar */}
        <Sidebar/>

        {/* main content */}
        <main className="min-h-screen pt-20 pl-64">
          <Outlet />
        </main>
      
    </div>
  );
};

export default AppLayout;