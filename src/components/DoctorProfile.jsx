import { useState } from "react";
import api from "../api";

function DoctorProfile({ existingProfile, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    doctor_name: existingProfile?.doctor_name || "",
    spec: existingProfile?.spec || "",
    dep: existingProfile?.dep || "",
    room: existingProfile?.room || "",
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
      const res = await api[method]("/doctor/profile/", formData);
      onSuccess(res.data.profile);
    } catch (err) {
      console.error("Ошибка при сохранении профиля:", err);
      setError(
        err.response?.data?.detail ||
          "Не удалось сохранить данные профиля. Проверьте введенные поля.",
      );
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
            : "Заполнение данных врача"}
        </h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>ФИО</label>
            <input
              type="text"
              name="doctor_name"
              value={formData.doctor_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Специализация</label>
            <input
              type="text"
              name="spec"
              value={formData.spec}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Отделение</label>
            <input
              type="text"
              name="dep"
              value={formData.dep}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>№ Кабинета</label>
            <input
              type="text"
              name="room"
              value={formData.room}
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

export default DoctorProfile;
