import api from "../../api";
import { useState, useEffect } from "react";
import "C:/Users/Koppa07/vsCodeProjects/frontend/src/styles/Reports/dep.css";

function Dep() {
  const [deps, setDeps] = useState([]);
  const [error, setError] = useState(null);

  const [editingDepId, setEditingDepId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    dep_title: "",
    name_of_manager: "",
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDeps = async () => {
    setError(null);
    try {
      const res = await api.get("/departments/");
      setDeps(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Не удалось загрузить сведения об отделениях",
      );
    }
  };

  useEffect(() => {
    fetchDeps();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingDepId(null);
    setFormData({ dep_title: "", name_of_manager: "" });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dep) => {
    const depId = dep.dep_id || dep.id;
    setEditingDepId(depId);
    setFormData({
      dep_title: dep.dep_title || dep.title || "",
      name_of_manager: dep.name_of_manager || "",
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setEditingDepId(null);
  };
  const handleDelete = async (dep) => {
    const depId = dep.dep_id || dep.id;
    const confirmMessage = "Вы уверены, что хотите удалить это отделение?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.delete(`/departments/${depId}/`);
      setDeps((prev) =>
        prev.filter((item) => (item.dep_id || item.id) !== depId),
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Не удалось удалить отделение. Попробуйте позже.",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (editingDepId !== null) {
        await api.put(`/departments/${editingDepId}/`, formData);
      } else {
        await api.post("/departments/", formData);
      }
      await fetchDeps();
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
          editingDepId
            ? "Не удалось обновить отделение."
            : "Не удалось добавить отделение.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dep__container">
      <div className="dep__header">
        <h2>Список отделений</h2>
        <button onClick={handleOpenAddModal} className="btn--prime">
          + Добавить отделение
        </button>
      </div>

      {error && <div className="deps__error">{error}</div>}

      <div className="deps__grid">
        {deps.length > 0 ? (
          deps.map((dep) => (
            <div key={dep.dep_id || dep.id} className="dep__card">
              <div className="dep__card-body">
                <h3>{dep.dep_title || dep}</h3>
                {dep.name_of_manager && (
                  <p>
                    <strong>Фамилия заведующего:</strong> {dep.name_of_manager}
                  </p>
                )}
              </div>
              <div className="dep__card-actions">
                <button
                  onClick={() => handleOpenEditModal(dep)}
                  className="btn--second"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(dep)}
                  className="btn--delete"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="deps__empty">Отделения по вашему запросу не найдены.</p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal__overlay" onClick={handleCloseModal}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingDepId
                ? "Редактирование отделения"
                : "Добавление отделения"}
            </h3>

            {submitError && <div className="modal__error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form__group">
                <label className="form__label">Название отделения:</label>
                <input
                  type="text"
                  name="dep_title"
                  value={formData.dep_title}
                  onChange={handleInputChange}
                  required
                  placeholder="Введите название"
                  className="my__input"
                />
              </div>

              <div className="form__group">
                <label className="form__label">Фамилия заведующего:</label>
                <input
                  type="text"
                  name="name_of_manager"
                  value={formData.name_of_manager}
                  onChange={handleInputChange}
                  placeholder="Введите фамилию"
                  className="my__input"
                  required
                />
              </div>

              <div className="modal__actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="btn--second"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn--prime"
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

export default Dep;
