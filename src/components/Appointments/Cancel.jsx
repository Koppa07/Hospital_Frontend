import { useState } from "react";
import api from "../../api";
import { USER_INFO } from "../../constants";

function CancelAppointmentModal({ appointment, onClose, onSuccess }) {
  const [status, setStatus] = useState("CANCELLED");
  const [loading, setLoading] = useState(false);

  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  const isDoctor = currentUser?.role === "DOCTOR";
  const isPatient = currentUser?.role === "PATIENT";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/appointments/${appointment.log_id}/cancel/`, {
        status,
      });
      onSuccess(appointment.log_id, status);
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
        <h3>Отмена приёма #{appointment.log_id}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label>Причина / Статус:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="my__input"
              required
            >
              <option value="CANCELLED">Отменить</option>
              {!isPatient && !isDoctor && (
                <div>
                  <option value="NO_SHOW">Пациент не явился</option>
                </div>
              )}
            </select>
          </div>

          <div className="modal__actions">
            <button type="button" onClick={onClose} className="btn--second">
              Отмена
            </button>
            <button type="submit" className="btn--prime" disabled={loading}>
              {loading ? "Сохранение..." : "Подтвердить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelAppointmentModal;
