import { useState } from "react";
import api from "../api";
import "../styles/CreateSchedule.css";

function CreateScheduleModal({
  doctors,
  onClose,
  onSuccess,
  initialDoctorId = "",
  initialDate = "",
}) {
  const [doctorId, setDoctorId] = useState(String(initialDoctorId));
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("20:00");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
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
      return;
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

      await api.post("schedule/create/", payload);

      await onSuccess();
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

        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label>Врач:</label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="my__input"
            >
              <option value="">-- Выберите врача --</option>
              {doctors.map((doc) => {
                const id = doc.doctor_id ?? doc.id;
                return (
                  <option key={id} value={id}>
                    {doc.doctor_name || doc.name || `Врач #${id}`}
                  </option>
                );
              })}
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
