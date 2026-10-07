import { useState } from "react";
import api from "../../api";
import "../../styles/Appointments/Complete.css";
function CompleteAppointmentModal({ appointment, onClose, onSuccess }) {
  const [diseaseId, setDiseaseId] = useState("");
  const [complains, setComplains] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/appointments/${appointment.id}/complete/`, {
        log_id: appointment.id,
        disease_id: Number(diseaseId),
        complains,
        recommendations,
      });
      onSuccess(appointment.id, "COMPLETED");
      onClose();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Ошибка при завершении приёма",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <h3>Завершение приёма #{appointment.id}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label>ID Диагноза (Заболевания):</label>
            <input
              type="number"
              required
              min="1"
              value={diseaseId}
              onChange={(e) => setDiseaseId(e.target.value)}
              className="my__input"
              placeholder="Введите ID заболевания"
            />
          </div>

          <div className="form__group">
            <label>Жалобы пациента:</label>
            <textarea
              required
              rows="3"
              value={complains}
              onChange={(e) => setComplains(e.target.value)}
              className="my__input"
              placeholder="Опишите жалобы"
            />
          </div>

          <div className="form__group">
            <label>Рекомендации:</label>
            <textarea
              rows="3"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="my__input"
              placeholder="Рекомендации по лечению"
            />
          </div>

          <div className="modal__actions">
            <button type="button" onClick={onClose} className="btn--second">
              Отмена
            </button>
            <button type="submit" className="btn--prime" disabled={loading}>
              {loading ? "Сохранение..." : "Завершить приём"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompleteAppointmentModal;
