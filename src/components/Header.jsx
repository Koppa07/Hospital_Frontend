import { Link } from "react-router-dom";
import { USER_INFO } from "../constants";
import menuIcon from "../assets/images/Menu.svg";

import "../styles/Header.css";

function Header({ onMenuClick, menuButtonRef, profile }) {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const roleNames = {
    ADMIN: "Администратор",
    DOCTOR: "Врач",
    PATIENT: "Пациент",
    REGISTRAR: "Регистратор",
  };

  const profileName =
    user?.role === "PATIENT"
      ? profile?.patient_name || user?.patient_name || ""
      : user?.role === "DOCTOR"
        ? profile?.doctor_name || user?.doctor_name || user?.name || ""
        : user?.full_name || user?.name || "";

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
