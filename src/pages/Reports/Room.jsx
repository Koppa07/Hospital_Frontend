import api from "../../api";
import { useState, useEffect } from "react";
import "../../styles/Reports/rooms.css";
import "../../styles/Reports/reports.css";
import { USER_INFO } from "../../constants";

const AVAILABLE_EQUIPMENT = [
  "УЗИ аппарат",
  "ЭКГ аппарат",
  "Тонометр",
  "Фонендоскоп",
  "Офтальмоскоп",
  "Кушетка медицинская",
  "Кольпоскоп",
  "Дефибриллятор",
  "Ростомер и весы",
  "Аппарат ИВЛ",
  "Спирометр",
];

function Room() {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const canWrite = currentUser?.role === "ADMIN";

  const [selectedEquipmentItem, setSelectedEquipmentItem] = useState("");
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    room_number: "",
    equipment: [],
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRooms = async () => {
    setError(null);
    try {
      const res = await api.get("/rooms/");
      setRooms(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Не удалось загрузить сведения о кабинетах",
      );
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEquipment = () => {
    if (
      selectedEquipmentItem &&
      !formData.equipment.includes(selectedEquipmentItem)
    ) {
      setFormData((prev) => ({
        ...prev,
        equipment: [...prev.equipment, selectedEquipmentItem],
      }));
      setSelectedEquipmentItem("");
    }
  };

  const handleRemoveEquipment = (itemToRemove) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((item) => item !== itemToRemove),
    }));
  };

  const handleOpenAddModal = () => {
    setEditingRoomId(null);
    setFormData({ room_number: "", equipment: [] });
    setSelectedEquipmentItem("");
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room) => {
    const roomId = room.id || room.room_id;
    setEditingRoomId(roomId);

    let parsedEquipment = [];
    if (Array.isArray(room.equipment)) {
      parsedEquipment = room.equipment;
    } else if (typeof room.equipment === "string" && room.equipment.trim()) {
      parsedEquipment = room.equipment.split(",").map((item) => item.trim());
    }

    setFormData({
      room_number: room.room_number || room.number || "",
      equipment: parsedEquipment,
    });
    setSelectedEquipmentItem("");
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setEditingRoomId(null);
  };
  const handleDelete = async (room) => {
    const roomId = room.room_id || room.id;
    const confirmMessage = "Вы уверены, что хотите удалить этот кабинет?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.delete(`/rooms/${roomId}/`);
      setRooms((prev) =>
        prev.filter((item) => (item.room_id || item.id) !== roomId),
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          "Не удалось удалить кабинет. Попробуйте позже.",
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      ...formData,
      equipment: Array.isArray(formData.equipment)
        ? formData.equipment.join(", ")
        : formData.equipment,
    };

    try {
      if (editingRoomId) {
        const res = await api.put(`/rooms/${editingRoomId}/`, payload);
      } else {
        await api.post("/rooms/", payload);
      }
      fetchRooms();
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
          editingRoomId
            ? "Не удалось обновить данные кабинета."
            : "Не удалось добавить кабинет.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEquipmentList = (equipment) => {
    if (!equipment) return "Не указано";
    if (Array.isArray(equipment)) {
      return equipment.length > 0 ? equipment.join(", ") : "Не указано";
    }
    return equipment;
  };

  return (
    <div className="report__container">
      <div className="report__header">
        <h2>Список кабинетов</h2>
        {canWrite && (
          <button onClick={handleOpenAddModal} className="btn--prime">
            + Добавить кабинет
          </button>
        )}
      </div>

      {error && <div className="reports__error">{error}</div>}

      <div className="reports__grid">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.id || room.room_id} className="report__card">
              <div className="report__card-body">
                <h3>Кабинет №{room.room_number || room.number}</h3>
                <p>
                  <strong>Оборудование:</strong>{" "}
                  {renderEquipmentList(room.equipment)}
                </p>
              </div>
              {canWrite && (
                <div className="report__card-actions">
                  <button
                    onClick={() => handleOpenEditModal(room)}
                    className="btn--second"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(room)}
                    className="btn--delete"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="reports__empty">
            Кабинеты по вашему запросу не найдены.
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal__overlay" onClick={handleCloseModal}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingRoomId
                ? "Редактирование кабинета"
                : "Добавление кабинета"}
            </h3>

            {submitError && <div className="modal__error">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form__group">
                <label className="form__label">Номер кабинета:</label>
                <input
                  type="number"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleInputChange}
                  required
                  placeholder="Введите номер"
                  className="my__input"
                />
              </div>

              <div className="form__group">
                <label className="form__label">Добавить оборудование:</label>
                <div className="equipment__select-group">
                  <select
                    value={selectedEquipmentItem}
                    onChange={(e) => setSelectedEquipmentItem(e.target.value)}
                    className="my__input "
                  >
                    <option value="">-- Выберите оборудование --</option>
                    {AVAILABLE_EQUIPMENT.map((item, index) => (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddEquipment}
                    className="equipment__add-btn"
                  >
                    Добавить
                  </button>
                </div>

                <div className="equipment__chips-container">
                  {formData.equipment.map((item, index) => (
                    <span key={index} className="equipment__chip">
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(item)}
                        className="equipment__chip-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
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

export default Room;
