import { useState, useEffect } from "react";
import "C:/Users/Koppa07/vsCodeProjects/frontend/src/styles/Patients.css";
import api from "../../api";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({
    card_number: "",
    insurance: "",
    patient_name: "",
  });
  const [error, setError] = useState(null);
  const [editingPatId, setEditingPatId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: "",
    birth_date: "",
    address: "",
    insurance: "",
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = async () => {
    setError(null);
    try {
      const params = {};
      if (filters.insurance) params["insurance__icontains"] = filters.insurance;
      if (filters.card_number)
        params["card_number__icontains"] = filters.card_number;
      if (filters.patient_name)
        params["patient_name__icontains"] = filters.patient_name;

      const res = await api.get("/patients/list/", { params });
      setPatients(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Не удалось загрузить список пациентов",
      );
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [filters.card_number, filters.insurance, filters.patient_name]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ insurance: "", card_number: "", patient_name: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingPatId(null);
    setFormData({
      patient_name: "",
      birth_date: "",
      address: "",
      insurance: "",
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pat) => {
    const patId = pat.patient_id || pat.pat_id || pat.id || pat.card_number;
    setEditingPatId(patId);
    setFormData({
      patient_name: pat.patient_name || pat.name || "",
      birth_date: pat.birth_date || "",
      address: pat.address || "",
      insurance: pat.insurance || "",
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setEditingPatId(null);
  };

  const handleDelete = async (pat) => {
    const patId = pat.patient_id || pat.pat_id || pat.id || pat.card_number;
    const confirmMessage =
      "Вы уверены, что хотите удалить сведения об этом пациенте?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.delete(`/patients/${patId}/`);
      setPatients((prev) =>
        prev.filter(
          (item) =>
            (item.patient_id || item.pat_id || item.id || item.card_number) !==
            patId,
        ),
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Не удалось удалить сведения о пациенте. Попробуйте позже.",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (editingPatId) {
        await api.put(`/patients/${editingPatId}/`, formData);
      } else {
        await api.post("/patients/register/", formData);
      }
      await fetchPatients();
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
          editingPatId
            ? "Не удалось обновить сведения о пациенте."
            : "Не удалось добавить сведения о пациенте.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pat__container">
      <div className="pat__header">
        <h2>Список пациентов</h2>
        <button onClick={handleOpenAddModal} className="btn--prime">
          + Добавить пациента
        </button>
      </div>

      <div className="patients__filters">
        <div className="filter__group">
          <label>Номер карты:</label>
          <input
            type="number"
            name="card_number"
            value={filters.card_number}
            onChange={handleFilterChange}
            placeholder="Поиск по номеру карты"
            className="my__input"
          />
        </div>
        <div className="filter__group">
          <label>ФИО пациента:</label>
          <input
            type="text"
            name="patient_name"
            value={filters.patient_name}
            onChange={handleFilterChange}
            placeholder="Поиск по ФИО пациента"
            className="my__input"
          />
        </div>
        <div className="filter__group">
          <label>Полис ОМС:</label>
          <input
            type="number"
            name="insurance"
            value={filters.insurance}
            onChange={handleFilterChange}
            placeholder="Поиск по номеру полиса"
            className="my__input"
          />
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="btn--second"
        >
          Сбросить фильтры
        </button>
      </div>

      {error && <div className="patients__error">{error}</div>}

      <div className="patients__grid">
        {patients.length > 0 ? (
          patients.map((pat) => (
            <div
              key={pat.id || pat.patient_id || pat.card_number}
              className="patient__card"
            >
              <div className="patient__card-body">
                <h3>
                  {pat.patient_name || pat.full_name || pat.user?.username}
                </h3>
                <p>
                  <strong>Номер карты:</strong>{" "}
                  {pat.card_number ||
                    pat.patient_id ||
                    pat.pat_id ||
                    pat.id ||
                    "Не указан"}
                </p>
                {pat.birth_date && (
                  <p>
                    <strong>Дата рождения:</strong>{" "}
                    {pat.birth_date || "Не указана"}
                  </p>
                )}
                {pat.address && (
                  <p>
                    <strong>Адрес:</strong> {pat.address || "Не указан"}
                  </p>
                )}
                <p>
                  <strong>Полис ОМС:</strong> {pat.insurance || "Не указан"}
                </p>
              </div>
              <div className="pat__card-actions">
                <button
                  onClick={() => handleOpenEditModal(pat)}
                  className="btn--second"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(pat)}
                  className="btn--delete"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="patients__empty">
            Пациенты по вашему запросу не найдены.
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal__overlay" onClick={handleCloseModal}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingPatId ? "Редактирование пациента" : "Добавление пациента"}
            </h3>

            {submitError && <div className="modal__error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form__group">
                <label className="form__label">ФИО пациента:</label>
                <input
                  type="text"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Введите ФИО"
                  className="my__input"
                />
              </div>

              <div className="form__group">
                <label className="form__label">Дата рождения:</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="my__input"
                  required
                />
              </div>

              <div className="form__group">
                <label className="form__label">Адрес:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Введите адрес"
                  className="my__input"
                />
              </div>

              <div className="form__group">
                <label className="form__label">Полис ОМС:</label>
                <input
                  type="number"
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleInputChange}
                  placeholder="Введите номер полиса ОМС"
                  className="my__input"
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

export default Patients;
