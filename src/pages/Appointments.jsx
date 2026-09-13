import { useState, useEffect } from "react";
import api from "../api";
import AppointmentCard from "../components/Appointments/AppointmentCard";
import Cancel from "../components/Appointments/Cancel";
import Complete from "../components/Appointments/Complete";
import Book from "../components/Appointments/Book";
import "../styles/Appointments.css";
import { USER_INFO } from "../constants";
import NotFound from "./NotFound";

function Appointments() {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const isDoctor = currentUser?.role === "DOCTOR";
  const isPatient = currentUser?.role === "PATIENT";

  if (isPatient) return <NotFound />;

  const [apps, setApps] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");

  const [selectedApp, setSelectedApp] = useState(null);
  const [modalType, setModalType] = useState(null);
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const doctorsRes = await api.get("/doctors/");
        setDoctors(doctorsRes.data);

        if (isDoctor) {
          setDoctorId(currentUser.doctor_id);
        }
      } catch (err) {
        console.error("Ошибка при загрузке начальных данных:", err);
      }
    };

    fetchInitialData();
  }, []);

  const fetchAppointments = async () => {
    if (!doctorId) {
      setApps([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = { doctor_id: doctorId };
      if (date) {
        params.start = `${date}T00:00:00`;
        params.end = `${date}T23:59:59`;
      }
      const res = await api.get("/schedule/", { params });
      setApps(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Ошибка загрузки приёмов.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [doctorId, date]);

  const handleStatusUpdate = (appId, newStatus) => {
    setApps((prev) =>
      prev.map((item) =>
        item.id === appId ? { ...item, status: newStatus } : item,
      ),
    );
  };

  const handleBookingSuccess = () => {
    fetchAppointments();
  };

  return (
    <div className="appointments__container">
      <div className="appointments__header">
        <h2>Записи на прием</h2>
        {!isDoctor && (
          <button
            onClick={() => setModalType("book")}
            className="btn btn--primary"
          >
            + Добавить запись
          </button>
        )}
      </div>

      <div className="appointments__filters">
        <div className="filter__group">
          <label htmlFor="doctor-select">Врач:</label>
          <select
            id="doctor-select"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={isDoctor}
          >
            {!isDoctor && <option value="">-- Выберите врача --</option>}
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.doctor_name || doc.name || `Врач #${doc.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter__group">
          <label htmlFor="date-input">Дата приёма:</label>
          <input
            id="date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <div>Загрузка приёмов...</div>}
      {error && <div className="appointments__error">{error}</div>}

      {!doctorId ? (
        <p>Выберите врача для отображения записей.</p>
      ) : (
        <div className="appointments__grid">
          {apps.map((app) => (
            <AppointmentCard
              key={app.id}
              app={app}
              onCancel={(a) => {
                setSelectedApp(a);
                setModalType("cancel");
              }}
              onComplete={(a) => {
                setSelectedApp(a);
                setModalType("complete");
              }}
            />
          ))}
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
          onClose={() => setModalType(null)}
          onSuccess={handleStatusUpdate}
        />
      )}

      {modalType === "complete" && selectedApp && (
        <Complete
          appointment={selectedApp}
          onClose={() => setModalType(null)}
          onSuccess={handleStatusUpdate}
        />
      )}
    </div>
  );
}

export default Appointments;
