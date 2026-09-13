import api from "../../api";
import "C:/Users/Koppa07/vsCodeProjects/frontend/src/styles/Homes/Admin.css";
import { USER_INFO } from "../../constants";
import ChangePassword from "../ChangePassword";
import { useState } from "react";
function AdminHome() {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  return (
    <div className="admin-home_container">
      <h1>{user.username}</h1>
      <div className="admin-home__reports">
        <a href="/reports" className="go-to-reports">
          Справочники
        </a>
      </div>
      <div className="admin-home__doctors">
        <a href="/doctors" className="go-todoctors">
          Персонал
        </a>
      </div>
      <div className="admin-home__schedule">
        <a href="/schedule" className="go-to-schedule">
          Расписание
        </a>
      </div>
      <div className="admin-home__patients">
        <a href="/patients" className="go-to-patients">
          Пациенты
        </a>
      </div>
      <div className="admin-home__appointments">
        <a href="/appointments" className="go-to-appointments">
          Приемы
        </a>
      </div>
      <section className="patient-home__section">
        <button
          className="btn btn--secondary"
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
export default AdminHome;
