import { useState, useEffect } from "react";
import api from "../api";
import "../styles/CreateSchedule.css";

function CreateScheduleModal({ doctors, onClose, onSuccess }) {
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [availableHours, setAvailableHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSubnit = async (e) => {
    e.preventDefault();

    if (!doctorId) {
      setError("Выберите врача");
      return;
    }
    if (!time) {
      setError("Выберите рабочие часы");
      return;
    }
    if (!date) {
      setError("Выберите дату");
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        doctor_id: Number(doctorId),
        date: Date(date),
        time: TimeRanges(time),
      };

      const res = await api.post("schedule/create/", payload);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("CREATE SCHEDULE ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);

      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Не удалось создать график",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <h3>Создание графика врача</h3>
        {error && <div className="modal__error">{error}</div>}

        <form onSubmit={handleSubnit}>
          <div className="form__group">
            <label>Врач:</label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="my__input"
            >
              <option value="">-- Выберите врача --</option>
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name || doc.name || `Врач #${doc.doctor_id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form__group">
            <label>Дата:</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="my__input"
            />
          </div>
          {doctorId && date && (
            <div className="form__group">
              <label>Доступное время:</label>
              {loadingTime ? (
                <p>Загрузка...</p>
              ) : availableHours.length > 0 ? (
                // TODO Выбор рабочих часов от - до
                <div></div>
              ) : (
                <p className="form__hint">
                  Нет доступных рабочих часов на выбранную дату
                </p>
              )}
            </div>
          )}

          <div className="modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="btn--second"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn--prime"
              disabled={isSubmitting || !time || !date || !doctorId}
            >
              {isSubmitting ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default CreateScheduleModal;
