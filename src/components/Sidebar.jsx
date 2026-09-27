import api from "../api";
import { useEffect, useRef, useState } from "react";
import { USER_INFO, ICONS } from "../constants";
import "../styles/Sidebar.css";
import SidebarLink from "./SidebarLink";

function Sidebar({ onClose }) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isPatient = user?.role === "PATIENT";
  const isDoctor = user?.role === "DOCTOR";
  const isAdmin = user?.role === "ADMIN";
  const isRegistrar = user?.role === "REGISTRAR";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <aside className="sidebar__container">
      <SidebarLink to="/" icon={ICONS.Home} onClick={handleLinkClick}>
        Главная
      </SidebarLink>
      {isPatient && (
        <div className="sidebar__patient">
          <SidebarLink
            to="/appointments"
            end
            icon={ICONS.Apps}
            onClick={handleLinkClick}
          >
            Записи на прием
          </SidebarLink>
          <SidebarLink
            to="/medical-history"
            icon={ICONS.History}
            onClick={handleLinkClick}
          >
            История болезни
          </SidebarLink>
        </div>
      )}
      {(isAdmin || isDoctor || isRegistrar) && (
        <div className="sidebar__admin">
          <div className="sidebar__dropdown" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="sidebar__dropdown-button"
            >
              <span className="sidebar__button-content">
                <img src={ICONS.Reports} alt="" className="sidebar__icon" />

                <span>Справочники</span>
              </span>
              <span>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div className="sidebar__dropdown-menu">
                <SidebarLink to="/departments" onClick={handleLinkClick}>
                  Отделения
                </SidebarLink>
                <SidebarLink to="/specializations" onClick={handleLinkClick}>
                  Специальности
                </SidebarLink>
                <SidebarLink to="/rooms" onClick={handleLinkClick}>
                  Кабинеты
                </SidebarLink>
                {!isRegistrar && (
                  <div>
                    <SidebarLink to="/diseases" onClick={handleLinkClick}>
                      Болезни
                    </SidebarLink>
                    <SidebarLink to="/drugs" onClick={handleLinkClick}>
                      Медикаменты
                    </SidebarLink>
                  </div>
                )}
              </div>
            )}
          </div>
          <SidebarLink
            to="/doctors"
            icon={ICONS.Docs}
            onClick={handleLinkClick}
          >
            Персонал
          </SidebarLink>
          <SidebarLink
            to="/schedule"
            icon={ICONS.Schedule}
            onClick={handleLinkClick}
          >
            Расписание
          </SidebarLink>
          {(isAdmin || isRegistrar) && (
            <SidebarLink
              to="/patients"
              icon={ICONS.Pats}
              onClick={handleLinkClick}
            >
              Пациенты
            </SidebarLink>
          )}
          <SidebarLink
            to="/appointments"
            icon={ICONS.Apps}
            onClick={handleLinkClick}
          >
            Приемы
          </SidebarLink>
        </div>
      )}
      <SidebarLink to="/logout" icon={ICONS.Logout} onClick={handleLinkClick}>
        Выйти
      </SidebarLink>
    </aside>
  );
}
export default Sidebar;
