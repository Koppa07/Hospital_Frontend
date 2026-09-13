import { useState } from "react";
import api from "../api";

function PatientProfile({ existingProfile, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    patient_name: existingProfile?.patient_name || "",
    birth_date: existingProfile?.birth_date || "",
    insurance: existingProfile?.insurance || "",
    address: existingProfile?.address || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = existingProfile ? "put" : "post";
      const res = await api[method]("/patient/profile/", formData);
      onSuccess(res.data.profile);
    } catch (err) {
      console.error("Ошибка при сохранении профиля:", err);
      const serverErrors = err.response?.data;
      if (typeof serverErrors === "object" && serverErrors !== null) {
        const firstErrorKey = Object.keys(serverErrors)[0];
        const errorMessage = Array.isArray(serverErrors[firstErrorKey])
          ? `${firstErrorKey}: ${serverErrors[firstErrorKey][0]}`
          : serverErrors.detail || "Проверьте корректность введенных данных.";
        setError(errorMessage);
      } else {
        setError("Не удалось сохранить данные профиля.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>
          {existingProfile
            ? "Редактирование профиля"
            : "Заполнение данных пациента"}
        </h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>ФИО</label>
            <input
              type="text"
              name="patient_name"
              value={formData.patient_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Дата рождения</label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Полис ОМС</label>
            <input
              type="text"
              name="insurance"
              value={formData.insurance}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Адрес проживания</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            {onClose && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
            )}
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? "Сохранение..." : "Сохранить профиль"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientProfile;
