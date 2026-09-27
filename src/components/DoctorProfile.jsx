import { useState, useEffect } from "react";
import api from "../api";

function DoctorProfile({ existingProfile, onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    doctor_name: existingProfile?.doctor_name || "",
    spec: existingProfile?.spec || "",
    dep: existingProfile?.dep || "",
    room: existingProfile?.room || "",
  });

  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFormData({
      doctor_name: existingProfile?.doctor_name || "",
      spec: existingProfile?.spec || "",
      dep: existingProfile?.dep || "",
      room: existingProfile?.room || "",
    });
  }, [existingProfile]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [depRes, specRes, roomRes] = await Promise.all([
          api.get("/departments/").catch(() => ({ data: [] })),
          api.get("/specializations/").catch(() => ({ data: [] })),
          api.get("/rooms/").catch(() => ({ data: [] })),
        ]);

        setDepartments(depRes.data);
        setSpecialties(specRes.data);
        setRooms(roomRes.data);
      } catch (err) {
        console.error("Ошибка загрузки опций для формы:", err);
      }
    };

    fetchOptions();
  }, []);

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

      const serverErrors = err.response?.data;

      if (typeof serverErrors === "object" && serverErrors !== null) {
        const firstErrorKey = Object.keys(serverErrors)[0];

        const errorMessage = Array.isArray(serverErrors[firstErrorKey])
          ? `${firstErrorKey}: ${serverErrors[firstErrorKey][0]}`
          : serverErrors.detail || "Проверьте корректность введенных данных.";

        setError(errorMessage);
      } else {
        setError(
          "Не удалось сохранить данные профиля. Проверьте введенные поля.",
        );
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
              placeholder="Введите ФИО"
              required
            />
          </div>

          <div className="form__group">
            <label className="form__label">Специализация:</label>

            <select
              name="spec"
              value={formData.spec}
              onChange={handleChange}
              className="my__input"
              required
            >
              <option value="">-- Выберите специализацию --</option>

              {specialties.map((item) => (
                <option
                  key={item.id || item.spec_id}
                  value={item.id || item.spec_id}
                >
                  {item.spec_title || item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form__group">
            <label className="form__label">Отделение:</label>

            <select
              name="dep"
              value={formData.dep}
              onChange={handleChange}
              className="my__input"
              required
            >
              <option value="">-- Выберите отделение --</option>

              {departments.map((item) => (
                <option
                  key={item.id || item.dep_id}
                  value={item.id || item.dep_id}
                >
                  {item.dep_title || item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form__group">
            <label className="form__label">Кабинет:</label>

            <select
              name="room"
              value={formData.room}
              onChange={handleChange}
              className="my__input"
              required
            >
              <option value="">-- Выберите кабинет --</option>

              {rooms.map((item) => (
                <option
                  key={item.id || item.room_id}
                  value={item.id || item.room_id}
                >
                  {item.room_number || item.number}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            {onClose && (
              <button
                type="button"
                className="btn--second"
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
            )}

            <button type="submit" className="btn--prime" disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить профиль"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DoctorProfile;
