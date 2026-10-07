import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { USER_INFO } from "../constants";
import api from "../api";
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileExists, setProfileExists] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_INFO);
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (user?.role !== "PATIENT" && user?.role !== "DOCTOR") {
      setProfileChecked(true);
      return;
    }
    const checkProfile = async () => {
      try {
        await api.get("/patient/profile/");
        setProfileExists(true);
      } catch (err) {
        if (err.response?.status === 404) {
          setProfileExists(false);
        } else {
          console.error("Ошибка проверки профиля:", err);
        }
      } finally {
        setProfileChecked(true);
      }
    };
    checkProfile();
  }, []);
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleMouseDown = (event) => {
      const sidebar = sidebarRef.current;
      const menuButton = menuButtonRef.current;
      if (sidebar?.contains(event.target)) {
        return;
      }
      if (menuButton?.contains(event.target)) {
        return;
      }
      closeSidebar();
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [sidebarOpen]);
  return (
    <div className={`layout ${sidebarOpen ? "layout--sidebar-open" : ""}`}>
      <Header onMenuClick={toggleSidebar} menuButtonRef={menuButtonRef} />
      <div className="layout__body">
        <div ref={sidebarRef}>
          <Sidebar onClose={closeSidebar} />
        </div>
        <main className="layout__content">
          <Outlet context={{ profileExists, setProfileExists }} />
        </main>
      </div>
    </div>
  );
}
export default Layout;
