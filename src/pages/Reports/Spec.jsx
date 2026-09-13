import api from "../../api";
import { useState, useEffect } from "react";
import "C:/Users/Koppa07/vsCodeProjects/frontend/src/styles/Reports/spec.css";

function Spec() {
  const [specs, setSpecs] = useState([]);
  const [error, setError] = useState(null);

  const [editingSpecId, setEditingSpecId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    spec_title: "",
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSpecs = async () => {
    setError(null);
    try {
      const res = await api.get("/specializations/");
      setSpecs(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Не удалось загрузить сведения о специализациях",
      );
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingSpecId(null);
    setFormData({ spec_title: "" });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (spec) => {
    const specId = spec.id || spec.spec_id;
    setEditingSpecId(specId);
    setFormData({
      spec_title: spec.spec_title || spec.title || "",
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setEditingSpecId(null);
  };
  const handleDelete = async (spec) => {
    const specId = spec.spec_id || spec.id;
    const confirmMessage = "Вы уверены, что хотите удалить эту специализацию?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.delete(`/specializations/${specId}/`);
      setSpecs((prev) =>
        prev.filter((item) => (item.spec_id || item.id) !== specId),
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Не удалось удалить специализацию. Попробуйте позже.",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (editingSpecId) {
        const res = await api.put(
          `/specializations/${editingSpecId}/`,
          formData,
        );
        setSpecs((prev) =>
          prev.map((s) =>
            (s.id || s.spec_id) === editingSpecId ? res.data : s,
          ),
        );
      } else {
        const res = await api.post("/specializations/", formData);
        setSpecs((prev) => [...prev, res.data]);
      }
      handleCloseModal();
    } catch (err) {
      const errorData = err.response?.data;
      if (typeof errorData === "object" && errorData !== null) {
        const messages = Object.entries(errorData)
          .map(
            ([key, val]) =>
              `${key}: ${Array.isArray(val) ? val.join(", ") : val}`,
          )
          .join("\n");
        setSubmitError(messages);
      } else {
        setSubmitError(
          editingSpecId
            ? "Не удалось обновить специализацию."
            : "Не удалось добавить специализацию.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="spec__container">
      <div className="spec__header">
        <h2>Список специализаций</h2>
        <button onClick={handleOpenAddModal} className="btn btn--primary">
          + Добавить специализацию
        </button>
      </div>

      {error && <div className="specs__error">{error}</div>}

      <div className="specs__grid">
        {specs.length > 0 ? (
          specs.map((spec) => (
            <div key={spec.id || spec.spec_id} className="spec__card">
              <h3>{spec.spec_title || spec.title}</h3>
              <button
                onClick={() => handleOpenEditModal(spec)}
                className="spec__edit-btn"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDelete(spec)}
                className="spec__delete-btn"
              >
                Удалить
              </button>
            </div>
          ))
        ) : (
          <p className="specs__empty">
            Специализации по вашему запросу не найдены.
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal__overlay" onClick={handleCloseModal}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingSpecId
                ? "Редактирование специализации"
                : "Добавление специализации"}
            </h3>

            {submitError && <div className="modal__error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form__group">
                <label className="form__label">Название специализации:</label>
                <input
                  type="text"
                  name="spec_title"
                  value={formData.spec_title}
                  onChange={handleInputChange}
                  required
                  placeholder="Введите название"
                  className="form__input"
                />
              </div>

              <div className="modal__actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="btn btn--secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn--primary"
                >
                  {isSubmitting ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Spec;
