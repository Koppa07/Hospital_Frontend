import { useState } from "react";
import api from "../../api";

function CancelAppointmentModal({ appointment, onClose, onSuccess }) {
  const [status, setStatus] = useState("CANCELLED");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/appointments/${appointment.id}/cancel/`, { status });
      onSuccess(appointment.id, status);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка отмены записи");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <h3>Отмена приёма #{appointment.id}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label>Причина / Статус:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form__input"
            >
              <option value="CANCELLED">Отменено (CANCELLED)</option>
              <option value="NO_SHOW">Пациент не явился (NO_SHOW)</option>
            </select>
          </div>

          <div className="modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn--secondary"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn--danger"
              disabled={loading}
            >
              {loading ? "Сохранение..." : "Подтвердить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelAppointmentModal;
