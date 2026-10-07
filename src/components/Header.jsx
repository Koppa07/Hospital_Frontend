import { Link } from "react-router-dom";
import { USER_INFO } from "../constants";
import menuIcon from "../assets/images/Menu.svg";

import "../styles/Header.css";

function Header({ onMenuClick }) {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;

  return (
    <header className="header__container">
      <div className="header__sidebar">
        <button
          type="button"
          onClick={onMenuClick}
          className="header__menu-button"
          aria-label="Открыть меню"
        >
          <img src={menuIcon} alt="" className="header__menu-icon" />
        </button>
      </div>
      <div className="header__username-role">
        <Link to="/">
          {user?.doctor_name || user?.patient_name || user?.username}
        </Link>
        {/*TODO получение имени пользователя*/}
        <p>{user?.role}</p>
      </div>
    </header>
  );
}
export default Header;
