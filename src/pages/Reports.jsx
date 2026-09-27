import { USER_INFO } from "../constants";
import { Link } from "react-router-dom";
import "../styles/Reports.css";

function Reports() {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isRegistrar = user?.role === "REGISTRAR";
  return (
    <div className="reports__containter">
      <h2>Справочники</h2>
      <div className="reports__list">
        <div className="reports__list-item">
          <Link to="/departments/">Отделения</Link>
        </div>
        <div className="reports__list-item">
          <Link to="/specializations/">Специальности</Link>
        </div>
        <div className="reports__list-item">
          <Link to="/rooms/">Кабинеты</Link>
        </div>
        {!isRegistrar && (
          <>
            <div className="reports__list-item">
              <Link to="/diseases/">Болезни</Link>
            </div>
            <div className="reports__list-item">
              <Link to="/drugs/">Медикаменты</Link>
            </div>
          </>
        )}
        <div className="reports__list-item">
          <Link to="">Скачать отчеты</Link>{" "}
          {/*TODO сделать скачивание отчета */}
        </div>
      </div>
    </div>
  );
}
export default Reports;
