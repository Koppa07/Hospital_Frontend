import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { USER_INFO } from "../constants";
import menuIcon from "../assets/images/Menu.svg";

import "../styles/Header.css";

function Header({ onMenuClick, menuButtonRef }) {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const [profileName, setProfileName] = useState(
    user?.doctor_name ||
      user?.patient_name ||
      user?.full_name ||
      user?.name ||
      "",
  );
  const roleNames = {
    ADMIN: "Администратор",
    DOCTOR: "Врач",
    PATIENT: "Пациент",
    REGISTRAR: "Регистратор",
  };

  useEffect(() => {
    const profileUrl =
      user?.role === "DOCTOR"
        ? "/doctor/profile/"
        : user?.role === "PATIENT"
          ? "/patient/profile/"
          : null;

    if (!profileUrl) return;

    let isMounted = true;
    api
      .get(profileUrl)
      .then((response) => {
        if (isMounted) {
          setProfileName(
            response.data.doctor_name || response.data.patient_name || "",
          );
        }
      })
      .catch((error) => {
        if (error.response?.status !== 404) {
          console.error("Ошибка загрузки ФИО пользователя:", error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  return (
    <header className="header__container">
      <div className="header__sidebar">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onMenuClick}
          className="header__menu-button"
          aria-label="Открыть меню"
        >
          <img src={menuIcon} alt="" className="header__menu-icon" />
        </button>
      </div>
      <div className="header__username-role">
        {(profileName || user?.username) && (
          <Link to="/">{profileName || user.username}</Link>
        )}
        <p>{roleNames[user?.role] || ""}</p>
      </div>
    </header>
  );
}
export default Header;
