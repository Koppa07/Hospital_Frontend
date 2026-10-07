import { useState, useEffect } from "react";
import api from "../api";
import "../styles/CreateSchedule.css";

function CreateScheduleModal({ doctors, onClose, onSuccess }) {
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("8:00");
  const [endTime, setEndTime] = useState("20:00");

  // const [availableHours, setAvailableHours] = useState([]);
  // const [loadingHours, setLoadingHours] = useState([]);

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
    if (!startTime || !endTime) {
      setError("Укажите время начала и окончания смены");
      return;
    }
    if (startTime >= endTime) {
      setError("Время окончания должно быть позже времени начала");
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
        date,
        start_time: startTime,
        end_time: endTime,
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
    <div
      className="modal__overlay"
      onClick={isSubmitting ? undefined : onClose}
    >
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
          <div className="form__group">
            <label>Начало рабочего дня</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="my__input"
            />
          </div>
          <div className="form__group">
            <label>Конец рабочего дня</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="my__input"
            />
          </div>

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
              disabled={
                isSubmitting || !startTime || !endTime || !date || !doctorId
              }
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
