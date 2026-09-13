import api from "../../api";
import "C:/Users/Koppa07/vsCodeProjects/frontend/src/styles/Homes/Admin.css";
import { USER_INFO } from "../../constants";
import ChangePassword from "../ChangePassword";

function RegistrarHome() {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  return (
    <div className="registrar-home_container">
      <h1>{user.username}</h1>
      <div className="registrar-home__reports">
        <a href="/reports" className="go-to-reports">
          Справочники
        </a>
      </div>
      <div className="registrar-home__doctors">
        <a href="/doctors" className="go-to-doctors">
          Персонал
        </a>
      </div>
      <div className="registrar-home__schedule">
        <a href="/schedule" className="go-to-schedule">
          Расписание
        </a>
      </div>
      <div className="registrar-home__patients">
        <a href="/patients" className="go-to-patients">
          Пациенты
        </a>
      </div>
      <div className="registrar-home__appointments">
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
export default RegistrarHome;
