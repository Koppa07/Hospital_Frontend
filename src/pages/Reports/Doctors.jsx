import { useState, useEffect } from "react";
import "C:/Users/Koppa07/vsCodeProjects/frontend/src/styles/Doctors.css";
import api from "../../api";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  const [filters, setFilters] = useState({
    dep: "",
    spec: "",
    doctor_name: "",
  });

  const [error, setError] = useState(null);
  const [editingDocId, setEditingDocId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    doctor_name: "",
    dep: "",
    spec: "",
    room: "",
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [depRes, specRes] = await Promise.all([
          api.get("/departments/").catch(() => ({ data: [] })),
          api.get("/specialties/").catch(() => ({ data: [] })),
        ]);
        setDepartments(depRes.data);
        setSpecialties(specRes.data);
      } catch (err) {
        console.error("Ошибка загрузки опций для формы:", err);
      }
    };
    fetchOptions();
  }, []);

  const fetchDoctors = async () => {
    setError(null);
    try {
      const params = {};
      if (filters.spec) params.spec = filters.spec;
      if (filters.dep) params.dep = filters.dep;
      if (filters.doctor_name) params.doctor_name = filters.doctor_name;

      const res = await api.get("/doctors/", { params });
      setDoctors(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Не удалось загрузить список врачей",
      );
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [filters.spec, filters.dep, filters.doctor_name]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ spec: "", dep: "", doctor_name: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingDocId(null);
    setFormData({
      doctor_name: "",
      dep: "",
      spec: "",
      room: "",
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc) => {
    const docId = doc.doctor_id || doc.id;
    setEditingDocId(docId);
    setFormData({
      doctor_name: doc.doctor_name || "",
      dep: doc.dep?.id || doc.dep_id || doc.dep || "",
      spec: doc.spec?.id || doc.spec_id || doc.spec || "",
      room: doc.room?.id || doc.room_id || doc.room || "",
    });
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setEditingDocId(null);
  };

  const handleDelete = async (doc) => {
    const docId = doc.doctor_id || doc.id;
    const confirmMessage =
      "Вы уверены, что хотите удалить сведения об этом враче?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.delete(`/doctors/${docId}/`);
      setDoctors((prev) =>
        prev.filter((item) => (item.doctor_id || item.id) !== docId),
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Не удалось удалить сведения о враче. Попробуйте позже.",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (editingDocId) {
        const res = await api.put(`/doctors/${editingDocId}/`, formData);
        setDoctors((prev) =>
          prev.map((item) =>
            (item.doctor_id || item.id) === editingDocId ? res.data : item,
          ),
        );
      } else {
        const res = await api.post("/doctors/", formData);
        setDoctors((prev) => [...prev, res.data]);
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
          editingDocId
            ? "Не удалось обновить сведения о враче."
            : "Не удалось добавить сведения о враче.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="doctors__container">
      <div className="doc__header">
        <h2>Список врачей</h2>
        <button onClick={handleOpenAddModal} className="btn btn--primary">
          + Добавить врача
        </button>
      </div>

      <div className="doctors__filters">
        <div className="filter__group">
          <label>Отделение:</label>
          <input
            type="text"
            name="dep"
            value={filters.dep}
            onChange={handleFilterChange}
            placeholder="Поиск по названию отделения"
            className="doctors__input"
          />
        </div>
        <div className="filter__group">
          <label>Специализация:</label>
          <input
            type="text"
            name="spec"
            value={filters.spec}
            onChange={handleFilterChange}
            placeholder="Поиск по специализации"
            className="doctors__input"
          />
        </div>
        <div className="filter__group">
          <label>ФИО врача:</label>
          <input
            type="text"
            name="doctor_name"
            value={filters.doctor_name}
            onChange={handleFilterChange}
            placeholder="Поиск по ФИО врача"
            className="doctors__input"
          />
        </div>
        <button
          type="button"
          onClick={handleResetFilters}
          className="doctors__reset-btn"
        >
          Сбросить фильтры
        </button>
      </div>

      {error && <div className="doctors__error">{error}</div>}

      <div className="doctors__grid">
        {doctors.length > 0 ? (
          doctors.map((doc) => (
            <div key={doc.id || doc.doctor_id} className="doctor__card">
              <div className="doctor__card-body">
                <h3>{doc.doctor_name || doc.user?.username}</h3>
                <p>
                  <strong>Специализация:</strong>{" "}
                  {doc.specialization ||
                    doc.spec ||
                    doc.spec_title ||
                    "Не указана"}
                </p>
                <p>
                  <strong>Отделение:</strong>{" "}
                  {doc.department_name ||
                    doc.department?.name ||
                    doc.dep_title ||
                    doc.dep ||
                    "Не указано"}
                </p>
                {doc.room && (
                  <p>
                    <strong>Кабинет:</strong>{" "}
                    {doc.room ||
                      doc.room_number ||
                      doc.room?.number ||
                      "Не указан"}
                  </p>
                )}
              </div>
              <div className="doc__card-actions">
                <button
                  onClick={() => handleOpenEditModal(doc)}
                  className="doc__edit-btn"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="doc__delete-btn"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="doctors__empty">Врачи по вашему запросу не найдены.</p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal__overlay" onClick={handleCloseModal}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingDocId ? "Редактирование врача" : "Добавление врача"}
            </h3>

            {submitError && <div className="modal__error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form__group">
                <label className="form__label">ФИО врача:</label>
                <input
                  type="text"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Введите ФИО"
                  className="form__input"
                />
              </div>

              <div className="form__group">
                <label className="form__label">Специализация:</label>
                <select
                  name="spec"
                  value={formData.spec}
                  onChange={handleInputChange}
                  className="form__input"
                >
                  <option value="">-- Выберите специализацию --</option>
                  {specialties.map((item) => (
                    <option
                      key={item.id || item.spec_id}
                      value={item.id || item.spec_id}
                    >
                      {item.spec_title || item.title || item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label className="form__label">Отделение:</label>
                <select
                  name="dep"
                  value={formData.dep}
                  onChange={handleInputChange}
                  className="form__input"
                >
                  <option value="">-- Выберите отделение --</option>
                  {departments.map((item) => (
                    <option
                      key={item.id || item.dep_id}
                      value={item.id || item.dep_id}
                    >
                      {item.dep_title || item.title || item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label className="form__label">№ Кабинета:</label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="Введите номер кабинета"
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

export default Doctors;
