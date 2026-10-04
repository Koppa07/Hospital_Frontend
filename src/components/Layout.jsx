import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        closeSidebar();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [sidebarOpen]);

  return (
    <div className={`layout ${sidebarOpen ? "layout--sidebar-open" : ""}`}>
      <Header onMenuClick={sidebarOpen ? closeSidebar : openSidebar} />

      <div className="layout__body">
        <div ref={sidebarRef}>
          {" "}
          <Sidebar onClose={closeSidebar} />{" "}
        </div>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
