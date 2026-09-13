import { useState } from "react";
import api from "../api";

function ChangePassword({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFormData({ old_password: "", new_password: "", confirm_password: "" });
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (formData.old_password === formData.new_password) {
      setError("Новый пароль совпадает со старым.");
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError("Новый пароль и подтверждение не совпадают.");
      return;
    }

    if (formData.new_password.length < 4) {
      setError("Длина нового пароля должна быть не менее 4 символов.");
      return;
    }

    setLoading(true);

    try {
      await api.post("user/change-password/", {
        old_password: formData.old_password,
        new_password: formData.new_password,
      });

      setSuccessMessage("Пароль успешно изменён!");
      setFormData({ old_password: "", new_password: "", confirm_password: "" });

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      const serverErrors = err.response?.data;
      if (typeof serverErrors === "object" && serverErrors !== null) {
        const messages = Object.entries(serverErrors)
          .map(([key, val]) => `${Array.isArray(val) ? val.join(", ") : val}`)
          .join("\n");
        setError(messages);
      } else {
        setError(err.response?.data?.detail || "Не удалось изменить пароль.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Смена пароля</h3>
        </div>

        {error && <div className="modal-alert modal-alert--error">{error}</div>}
        {successMessage && (
          <div className="modal-alert modal-alert--success">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Текущий пароль:</label>
            <input
              type="password"
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              required
              placeholder="Введите старый пароль"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Новый пароль:</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              required
              placeholder="Введите новый пароль"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Подтвердите новый пароль:</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              placeholder="Повторите новый пароль"
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? "Сохранение..." : "Изменить пароль"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
