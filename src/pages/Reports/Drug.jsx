import api from "../../api";
import { useState, useEffect } from "react";
import "../../styles/Reports/drugs.css";
import { USER_INFO } from "../../constants";

function Drug() {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const isRegistrar = currentUser?.role === "REGISTRAR";
  const canWrite = currentUser?.role === "ADMIN";

  if (isRegistrar) <NotFound />;

  const [drugs, setDrugs] = useState([]);
  const [error, setError] = useState(null);

  const [editingDrugId, setEditingDrugId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    drug_title: "",
    drug_type: "",
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDrugs = async () => {
    setError(null);
    try {
      const res = await api.get("/drugs/");
      setDrugs(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Не удалось загрузить сведения о медикаментах",
      );
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingDrugId(null);
    setFormData({ drug_title: "", drug_type: "" });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (drug) => {
    const drugId = drug.drug_id || drug.id;
    setEditingDrugId(drugId);
    setFormData({
      drug_title: drug.drug_title || drug.title || "",
      drug_type: drug.drug_type || drug.type || "",
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setEditingDrugId(null);
  };
  const handleDelete = async (drug) => {
    const drugId = drug.drug_id || drug.id;
    const confirmMessage = "Вы уверены, что хотите удалить этот медикамент?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.delete(`/drugs/${drugId}/`);
      setDrugs((prev) =>
        prev.filter((item) => (item.drug_id || item.id) !== drugId),
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Не удалось удалить медикамент. Попробуйте позже.",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (editingDrugId) {
        await api.put(`/drugs/${editingDrugId}/`, formData);
      } else {
        await api.post("/drugs/", formData);
      }
      await fetchDrugs();
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
          editingDrugId
            ? "Не удалось обновить медикамент."
            : "Не удалось добавить медикамент.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="drug__container">
      <div className="drug__header">
        <h2>Список медикаментов</h2>
        {canWrite && (
          <button onClick={handleOpenAddModal} className="btn--prime">
            + Добавить медикамент
          </button>
        )}
      </div>

      {error && <div className="drugs__error">{error}</div>}

      <div className="drugs__grid">
        {drugs.length > 0 ? (
          drugs.map((drug) => (
            <div key={drug.drug_id || drug.id} className="drug__card">
              <div className="drug__card-body">
                <h3>{drug.drug_title || drug.title}</h3>
                {drug.drug_type && (
                  <p>
                    <strong>Тип медикамента:</strong>{" "}
                    {drug.drug_type || drug.type}
                  </p>
                )}
              </div>
              {canWrite && (
                <div className="drug__card-actions">
                  <button
                    onClick={() => handleOpenEditModal(drug)}
                    className="btn--second"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(drug)}
                    className="btn--delete"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="drugs__empty">
            Медикамента по вашему запросу не найдены.
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal__overlay" onClick={handleCloseModal}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingDrugId
                ? "Редактирование медикамента"
                : "Добавление медикамента"}
            </h3>

            {submitError && <div className="modal__error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form__group">
                <label className="form__label">Название медикамента:</label>
                <input
                  type="text"
                  name="drug_title"
                  value={formData.drug_title}
                  onChange={handleInputChange}
                  required
                  placeholder="Введите название"
                  className="my__input"
                />
              </div>

              <div className="form__group">
                <label className="form__label">Тип медикамента:</label>
                <input
                  type="text"
                  name="drug_type"
                  value={formData.drug_type}
                  onChange={handleInputChange}
                  placeholder="Введите тип"
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

export default Drug;
