import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api";
import AppointmentCard from "../components/Appointments/AppointmentCard";
import Cancel from "../components/Appointments/Cancel";
import Complete from "../components/Appointments/Complete";
import Book from "../components/Appointments/Book";
import "../styles/Appointments.css";
import { USER_INFO } from "../constants";

function Appointments() {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  const isDoctor = currentUser?.role === "DOCTOR";
  const isPatient = currentUser?.role === "PATIENT";
  const doctorsLoadedRef = useRef(false);
  const appsLoadedRef = useRef(false);
  const [apps, setApps] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");

  const [selectedApp, setSelectedApp] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    if (isDoctor) {
      return;
    }

    if (doctorsLoadedRef.current) {
      return;
    }

    doctorsLoadedRef.current = true;

    const fetchDoctors = async () => {
      try {
        const doctorsRes = await api.get("/doctors/list/");
        setDoctors(doctorsRes.data);
      } catch (err) {
        console.error("Ошибка при загрузке врачей:", err);

        setError(
          err.response?.data?.detail || "Не удалось загрузить список врачей.",
        );

        doctorsLoadedRef.current = false;
      }
    };

    fetchDoctors();
  }, [isDoctor]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (!isDoctor) {
        params.doctor_id = doctorId;
      }
      if (date) {
        params.date = date;
      }

      const res = await api.get("/appointments/", {
        params,
      });

      setApps(res.data);
    } catch (err) {
      console.error("Ошибка загрузки записей:", err);
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
      console.error("MESSAGE:", err.message);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Ошибка загрузки приёмов.",
      );

      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [isPatient, isDoctor, doctorId, date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusUpdate = (appId, newStatus) => {
    setApps((prev) =>
      prev.map((item) =>
        item.log_id === appId ? { ...item, status: newStatus } : item,
      ),
    );
  };

  const handleBookingSuccess = () => {
    setModalType(null);
    fetchAppointments();
  };

  const renderAppointmentCard = (app) => (
    <AppointmentCard
      key={app.log_id}
      app={app}
      onCancel={
        app.status !== "CANCELLED" &&
        app.status !== "COMPLETED" &&
        app.status !== "NO_SHOW"
          ? (appointment) => {
              setSelectedApp(appointment);
              setModalType("cancel");
            }
          : undefined
      }
      onComplete={
        isDoctor &&
        app.status !== "CANCELLED" &&
        app.status !== "COMPLETED" &&
        app.status !== "NO_SHOW"
          ? (appointment) => {
              setSelectedApp(appointment);
              setModalType("complete");
            }
          : undefined
      }
      user={currentUser}
    />
  );

  return (
    <div className="appointments__container">
      <div className="appointments__header">
        <h2>{isPatient ? "Мои записи на приём" : "Записи на приём"}</h2>

        {!isDoctor && !isPatient && (
          <button onClick={() => setModalType("book")} className="btn--prime">
            + Добавить запись
          </button>
        )}

        {isPatient && (
          <button onClick={() => setModalType("book")} className="btn--prime">
            + Записаться к врачу
          </button>
        )}
      </div>
      <div className="appointments__filters">
        {!isDoctor && (
          <div className="filter__group">
            <label htmlFor="doctor-select">Врач:</label>

            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              disabled={isDoctor}
              className="my__input"
            >
              {!isDoctor && <option value="">-- Выберите врача --</option>}

              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name || doc.name || `Врач #${doc.doctor_id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter__group">
          <label htmlFor="date-input">Дата приёма:</label>

          <input
            id="date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="my__input"
          />
        </div>

        {date && (
          <button
            type="button"
            className="btn--second"
            onClick={() => setDate("")}
          >
            Показать все даты
          </button>
        )}
      </div>
      {loading && (
        <div className="appointments__loading">Загрузка приёмов...</div>
      )}
      {error && <div className="appointments__error">{error}</div>}
      {!loading && !error && apps.length === 0 && (
        <div className="appointments__empty">
          {" "}
          {isPatient
            ? date
              ? "На выбранную дату у вас нет записей."
              : "У вас пока нет запланированных записей."
            : isDoctor
              ? date
                ? "На выбранную дату записей нет."
                : "У вас пока нет записей."
              : !doctorId
                ? "Выберите врача для отображения записей."
                : "Записи не найдены."}{" "}
        </div>
      )}{" "}
      {!loading && apps.length > 0 && (
        <div className="appointments__grid">
          {" "}
          {apps.map(renderAppointmentCard)}{" "}
        </div>
      )}
      {modalType === "book" && (
        <Book
          doctors={doctors}
          onClose={() => setModalType(null)}
          onSuccess={handleBookingSuccess}
          user={currentUser}
        />
      )}
      {modalType === "cancel" && selectedApp && (
        <Cancel
          appointment={selectedApp}
          onClose={() => {
            setModalType(null);
            setSelectedApp(null);
          }}
          onSuccess={(appId, newStatus) => {
            handleStatusUpdate(appId, newStatus);
            setModalType(null);
            setSelectedApp(null);
          }}
        />
      )}
      {modalType === "complete" && selectedApp && (
        <Complete
          appointment={selectedApp}
          onClose={() => {
            setModalType(null);
            setSelectedApp(null);
          }}
          onSuccess={(appId, newStatus) => {
            handleStatusUpdate(appId, newStatus);
            setModalType(null);
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
}

export default Appointments;
