import api from "../../api";
import { USER_INFO } from "../../constants";
import { useState, useEffect } from "react";
import DoctorProfile from "../DoctorProfile";
import Cancel from "../Appointments/Cancel";
import ChangePassword from "../ChangePassword";
import { Link } from "react-router-dom";
import "../../styles/Homes/home.css";
function DoctorHome() {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;
  const [modalType, setModalType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [error, setError] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const fetchProfile = async () => {
    try {
      const res = await api.get(`/doctor/profile/`);
      setProfile(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
      } else {
        console.error("Ошибка при получении профиля:", err);
      }
    } finally {
      setIsProfileLoaded(true);
    }
  };
  const fetchAppointments = async () => {
    setError(null);
    try {
      const res = await api.get("/appointments/");
      setUpcomingAppointments(res.data);
    } catch (err) {
      console.error("Не удалось загрузить записи:", err);
      setError("Не удалось загрузить записи.");
    }
  };
  useEffect(() => {
    fetchAppointments();
  }, []);
  const handleStatusUpdate = (appId, newStatus) => {
    setUpcomingAppointments((prev) =>
      prev.map((item) =>
        item.id === appId || item.log_id === appId
          ? { ...item, status: newStatus }
          : item,
      ),
    );
  };
  const handleProfileSuccess = (updatedProfile) => {
    setProfile(updatedProfile);
    setModalType(null);
    const updatedUser = { ...user, name: updatedProfile.doctor_name };
    localStorage.setItem(USER_INFO, JSON.stringify(updatedUser));
  };
  useEffect(() => {
    fetchProfile();
  }, []);
  return (
    <div className="home_container">
      <div className="home__welcome">
        <h1>
          Добро пожаловать, {user?.doctor_name || user?.username || "Врач"}!
        </h1>
        <p className="home__subtitle">Личный кабинет врача</p>
      </div>
      {isProfileLoaded && !profile && (
        <div className="home__warning-banner">
          <p>⚠️ Для работы необходимо сначала заполнить данные врача.</p>
          <button
            onClick={() => setModalType("profile")}
            className="btn--second"
          >
            Заполнить данные профиля
          </button>
        </div>
      )}

      {error && <div className="home__error">{error}</div>}
      <div className="home__actions">
        {profile && (
          <button
            onClick={() => setModalType("profile")}
            className="btn--second"
          >
            Редактировать профиль
          </button>
        )}
      </div>
      <section className="home__section">
        <h2>Запланированные записи</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="home__grid">
            {upcomingAppointments.map((app) => (
              <div key={app.id || app.log_id} className="appointment-card">
                <div className="appointment-card__header">
                  <span className="appointment-card__date">
                    {new Date(
                      app.appointment_date || app.start_datetime,
                    ).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`status status--${app.status?.toLowerCase()}`}
                  >
                    {app.status}
                  </span>
                </div>
                <div className="appointment-card__body">
                  <p>
                    <strong>Пациент:</strong>{" "}
                    {app.patient_name ||
                      app.patient?.name ||
                      `Пациент #${app.patient_id || app.patient}`}
                  </p>
                </div>
                {app.status !== "CANCELLED" && app.status !== "COMPLETED" && (
                  <div className="appointment-card__actions">
                    <button
                      className="btn--prime"
                      onClick={() => {
                        setSelectedApp(app);
                        setModalType("cancel");
                      }}
                    >
                      Отменить запись
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="home__empty">У вас пока нет активных записей.</p>
        )}
      </section>
      <div className="home__reports">
        <Link to="/reports" className="go-to">
          Справочники
        </Link>
      </div>
      <div className="home__schedule">
        <Link to="/schedule" className="go-to">
          Расписание
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
      {modalType === "cancel" && selectedApp && (
        <Cancel
          appointment={selectedApp}
          onClose={() => setModalType(null)}
          onSuccess={handleStatusUpdate}
        />
      )}

      {modalType === "profile" && (
        <DoctorProfile
          existingProfile={profile}
          onClose={() => setModalType(null)}
          onSuccess={handleProfileSuccess}
        />
      )}
    </div>
  );
}
export default DoctorHome;
