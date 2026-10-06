import { useState, useEffect, useRef } from "react";
import api from "../../api";
import "../../styles/Appointments/Book.css";

function BookAppointmentModal({ doctors, onClose, onSuccess, user }) {
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);

  const isPatient = user?.role === "PATIENT";
  useEffect(() => {
    if (isPatient && user?.patient_id) {
      setSelectedPatient({
        id: user.patient_id,
      });
    }
  }, [isPatient, user]);
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/patients/list/");
        setPatients(res.data);
      } catch (err) {
        console.error("Ошибка при загрузке пациентов:", err);
      }
    };

    fetchPatients();
  }, [isPatient]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      setSelectedSlot("");
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        const res = await api.get("/schedule/slots/", {
          params: { doctor_id: doctorId, date: date },
        });
        setAvailableSlots(res.data);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Не удалось загрузить доступные слоты",
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [doctorId, date]);

  const filteredPatients = patients.filter((patient) => {
    const fullName = patient.patient_name || patient.name;
    return fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelectPatient = (patient) => {
    const fullName = patient.patient_name || patient.name;
    setSelectedPatient({
      id: patient.patient_id || patient.card_number,
      name: fullName,
    });
    setSearchTerm(fullName);
    setIsDropdownOpen(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setSearchTerm("");
    setIsDropdownOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPatient && !selectedPatient?.id) {
      setError("Выберите пациента");
      return;
    }

    if (!selectedSlot) {
      setError("Выберите время приёма");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        doctor_id: Number(doctorId),
        slot_id: Number(selectedSlot),
        patient_id: Number(patientId),
      };
      if (!isPatient) {
        payload.patient_id = Number(selectedPatient.id);
      }

      const res = await api.post("/schedule/book/", payload);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("BOOK ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);

      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Не удалось записать пациента",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <h3>Новая запись на приём</h3>

        {error && <div className="modal__error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label>Врач:</label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="my__input"
            >
              <option value="">-- Выберите врача --</option>
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name || doc.name || `Врач #${doc.doctor_id}`}
                </option>
              ))}
            </select>
          </div>

          {!isPatient && (
            <div
              className="form__group"
              ref={dropdownRef}
              style={{ position: "relative" }}
            >
              <label>Пациент (ФИО):</label>
              <div style={{ display: "flex", gap: "5px" }}>
                <input
                  type="text"
                  required
                  placeholder="Начните вводить ФИО..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedPatient(null);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="my__input"
                />
                {selectedPatient && (
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="btn--second"
                  >
                    ✕
                  </button>
                )}
              </div>

              {isDropdownOpen && !selectedPatient && (
                <ul className="autocomplete__list">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => {
                      const fullName = patient.patient_name || patient.name;
                      return (
                        <li
                          key={patient.patient_id}
                          onClick={() => handleSelectPatient(patient)}
                          className="autocomplete__item"
                        >
                          <strong>{fullName}</strong> (Карта #
                          {patient.card_number})
                        </li>
                      );
                    })
                  ) : (
                    <li className="autocomplete__item autocomplete__item--empty">
                      Пациенты не найдены
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="form__group">
            <label>Дата приёма:</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="my__input"
            />
          </div>

          {doctorId && date && (
            <div className="form__group">
              <label>Доступное время:</label>
              {loadingSlots ? (
                <p>Загрузка слотов...</p>
              ) : availableSlots.length > 0 ? (
                <select
                  required
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="my__input"
                >
                  <option value="">-- Выберите время --</option>
                  {availableSlots.map((slot) => {
                    const timeStr = new Date(
                      slot.start_datetime,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <option key={slot.slot_id} value={slot.slot_id}>
                        {timeStr}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <p className="form__hint">
                  Нет доступных слотов на выбранную дату
                </p>
              )}
            </div>
          )}

          <div className="modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="btn--second"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn--prime"
              disabled={
                isSubmitting ||
                !selectedSlot ||
                (!isPatient && !selectedPatient)
              }
            >
              {isSubmitting
                ? "Запись..."
                : isPatient
                  ? "Записаться"
                  : "Записать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookAppointmentModal;
