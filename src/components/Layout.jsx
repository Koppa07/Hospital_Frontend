import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`layout ${sidebarOpen ? "layout--sidebar-open" : ""}`}>
      <Header onMenuClick={sidebarOpen ? closeSidebar : openSidebar} />

      <div className="layout__body">
        <Sidebar onClose={closeSidebar} />

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
