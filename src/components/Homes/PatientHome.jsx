import { useState, useEffect } from "react";
import api from "../../api";
import { USER_INFO } from "../../constants";
import Book from "../Appointments/Book";
import Cancel from "../Appointments/Cancel";
import PatientProfile from "../PatientProfile";
import ChangePassword from "../ChangePassword";
import { Link } from "react-router-dom";
import "../../styles/Homes/home.css";
function PatientHome() {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [modalType, setModalType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [error, setError] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const fetchProfile = async () => {
    try {
      const res = await api.get(`/patient/profile/`);
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

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsRes = await api.get("/doctors/list/");
        setDoctors(doctorsRes.data);
      } catch (err) {
        console.error("Ошибка при загрузке врачей:", err);
      }
    };
    fetchDoctors();
    fetchProfile();
  }, []);

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

  const fetchMedicalHistory = async () => {
    try {
      const res = await api.get("/medical-history/");
      setMedicalHistory(res.data);
    } catch (err) {
      console.error("Не удалось загрузить историю болезней:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchMedicalHistory();
  }, []);

  const handleBookingSuccess = () => {
    fetchAppointments();
  };

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
    const updatedUser = { ...user, name: updatedProfile.name };
    localStorage.setItem(USER_INFO, JSON.stringify(updatedUser));
  };

  return (
    <div className="home_container">
      <div className="home__welcome">
        <h1>
          Добро пожаловать,{" "}
          {profile?.name || user?.full_name || user?.username || "Пациент"}!
        </h1>
        <p className="home__subtitle">Личный кабинет пациента</p>
      </div>

      {isProfileLoaded && !profile && (
        <div className="home__warning-banner">
          <p>
            ⚠️ Для записи на прием необходимо сначала заполнить персональные
            данные пациента.
          </p>
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
        <div
          className="btn-disabled-wrapper"
          data-tooltip={!profile ? "Заполните данные пациента." : ""}
        >
          <button
            onClick={() => setModalType("book")}
            className="btn--prime"
            disabled={!profile}
          >
            + Записаться на прием
          </button>
        </div>

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
        <h2>Мои текущие записи</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="home__grid">
            {upcomingAppointments.slice(0, 2).map((app) => (
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
                    <strong>Врач:</strong>{" "}
                    {app.doctor_name ||
                      app.doctor?.name ||
                      `Врач #${app.doctor_id || app.doctor}`}
                  </p>
                  <p>
                    <strong>Специализация:</strong>{" "}
                    {app.specialization || "Терапевт"}
                  </p>
                  <p>
                    <strong>Кабинет:</strong> {app.office || app.room || "—"}
                  </p>
                </div>
                {app.status !== "CANCELLED" && app.status !== "COMPLETED" && (
                  <div className="appointment-card__actions">
                    <button
                      className="btn btn--danger-outline"
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
        <div className="home__appointments">
          <Link to="/appointments/" className="go-to">
            Все записи
          </Link>
        </div>
      </section>

      <section className="home__section">
        <h2>Медицинская карта и история визитов</h2>
        {medicalHistory.length > 0 ? (
          <div className="history-list">
            {medicalHistory.slice(0, 2).map((item) => (
              <div key={item.id || item.log_id} className="history-item">
                <div className="history-item__header">
                  <span className="history-item__date">
                    {new Date(
                      item.date || item.appointment_date || item.created_at,
                    ).toLocaleDateString("ru-RU")}
                  </span>
                  <span className="history-item__doctor">
                    {item.doctor_name ||
                      `Врач #${item.doctor_id || item.doctor}`}
                  </span>
                </div>
                <div className="history-item__content">
                  <p>
                    <strong>Диагноз:</strong> {item.disease || "Не указан"}
                  </p>
                  <p>
                    <strong>Назначения / Рекомендации:</strong>{" "}
                    {item.prescription || item.recommendations || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="home__empty">История приёмов пуста.</p>
        )}
        <div className="home__history">
          <Link to="/medical-history/" className="go-to">
            Полная медицинская карта
          </Link>
        </div>
      </section>
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

      {modalType === "book" && (
        <Book
          doctors={doctors}
          onClose={() => setModalType(null)}
          onSuccess={handleBookingSuccess}
          user={user}
        />
      )}

      {modalType === "cancel" && selectedApp && (
        <Cancel
          appointment={selectedApp}
          onClose={() => setModalType(null)}
          onSuccess={handleStatusUpdate}
        />
      )}

      {modalType === "profile" && (
        <PatientProfile
          existingProfile={profile}
          onClose={() => setModalType(null)}
          onSuccess={handleProfileSuccess}
        />
      )}
    </div>
  );
}

export default PatientHome;
