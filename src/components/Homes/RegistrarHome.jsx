import api from "../../api";
import "../../styles/Homes/home.css";
import { USER_INFO } from "../../constants";
import ChangePassword from "../ChangePassword";
import { Link } from "react-router-dom";
import { useState } from "react";
function RegistrarHome() {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  return (
    <div className="home_container">
      <div className="home__welcome">
        <h1>Добро пожаловать, {user.username}!</h1>
        <p className="home__subtitle">Личный кабинет регистратора</p>
      </div>
      <div className="home__reports">
        <Link to="/reports" className="go-to">
          Справочники
        </Link>
      </div>
      <div className="home__doctors">
        <Link to="/doctors" className="go-to">
          Персонал
        </Link>
      </div>
      <div className="home__schedule">
        <Link to="/schedule" className="go-to">
          Расписание
        </Link>
      </div>
      <div className="home__patients">
        <Link to="/patients" className="go-to">
          Пациенты
        </Link>
      </div>
      <div className="home__appointments">
        <Link to="/appointments" className="go-to">
          Приемы
        </Link>
      </div>
      <section className="home__section">
        <button
          className="btn--second"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          Сменить пароль
        </button>
        <ChangePassword
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </section>
    </div>
  );
}
export default RegistrarHome;
