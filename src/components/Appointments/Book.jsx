import { useState, useEffect, useRef } from "react";
import api from "../../api";
import "../../styles/Appointments/Book.css";

function BookAppointmentModal({
  doctors,
  onClose,
  onSuccess,
  user,
  patientProfile,
  initialDoctorId = "",
  initialDate = "",
}) {
  const [doctorId, setDoctorId] = useState(String(initialDoctorId));
  const [date, setDate] = useState(initialDate);

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadedPatientProfile, setLoadedPatientProfile] = useState(null);

  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);

  const isPatient = user?.role === "PATIENT";
  const currentPatientProfile = patientProfile ?? loadedPatientProfile;
  const patientId =
    currentPatientProfile?.card_number ??
    currentPatientProfile?.patient_id ??
    user?.card_number ??
    user?.patient_id;
  const patientName = currentPatientProfile?.patient_name ?? user?.patient_name;
  const bookingPatient = isPatient
    ? patientId == null
      ? null
      : { id: patientId, name: patientName }
    : selectedPatient;

  useEffect(() => {
    if (!isPatient || patientProfile || patientId != null) return;

    let isActive = true;
    const fetchPatientProfile = async () => {
      try {
        const res = await api.get("/patient/profile/");
        if (isActive) setLoadedPatientProfile(res.data);
      } catch (err) {
        if (!isActive) return;
        console.error("Ошибка при загрузке профиля пациента:", err);
        setError(
          err.response?.data?.detail ||
            "Не удалось загрузить профиль пациента для записи",
        );
      }
    };

    fetchPatientProfile();
    return () => {
      isActive = false;
    };
  }, [isPatient, patientProfile, patientId]);

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
    if (!doctorId) return;

    let isActive = true;
    const fetchAvailableDates = async () => {
      setLoadingDates(true);
      setError(null);
      try {
        const res = await api.get("/schedule/available-dates/", {
          params: { doctor_id: doctorId },
        });
        if (!isActive) return;

        setAvailableDates(res.data);
        setDate(
          res.data.includes(initialDate) ? initialDate : (res.data[0] ?? ""),
        );
      } catch (err) {
        if (!isActive) return;
        console.error("Ошибка при загрузке доступных дат:", err);
        setError(
          err.response?.data?.detail || "Не удалось загрузить доступные даты",
        );
      } finally {
        if (isActive) setLoadingDates(false);
      }
    };

    fetchAvailableDates();
    return () => {
      isActive = false;
    };
  }, [doctorId, initialDate]);

  useEffect(() => {
    if (!doctorId || !date) return;

    let isActive = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        const res = await api.get("/schedule/slots/", {
          params: { doctor_id: doctorId, date: date },
        });
        if (isActive) setAvailableSlots(res.data);
      } catch (err) {
        if (isActive) {
          setError(
            err.response?.data?.detail ||
              "Не удалось загрузить доступные слоты",
          );
        }
      } finally {
        if (isActive) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isActive = false;
    };
  }, [doctorId, date]);

  const filteredPatients = patients.filter((patient) => {
    const fullName = patient.patient_name || patient.name;
    return fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelectPatient = (patient) => {
    const fullName = patient.patient_name || patient.name;
    setSelectedPatient({
      id: patient.card_number || patient.patient_id,
      name: patient.patient_name,
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

    if (!bookingPatient?.id) {
      setError(
        isPatient
          ? "Не удалось определить профиль пациента. Обновите профиль и попробуйте снова."
          : "Выберите пациента",
      );
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
        patient_id: Number(bookingPatient.id),
      };

      await api.post("/schedule/book/", payload);

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
              onChange={(e) => {
                const nextDoctorId = e.target.value;
                setDoctorId(nextDoctorId);
                setDate("");
                setAvailableDates([]);
                setAvailableSlots([]);
                setSelectedSlot("");
                setLoadingDates(Boolean(nextDoctorId));
                setLoadingSlots(false);
              }}
              className="my__input"
            >
              <option value="">-- Выберите врача --</option>
              {doctors.map((doc) => {
                const id = doc.doctor_id ?? doc.id;
                return (
                  <option key={id} value={id}>
                    {doc.doctor_name || `Врач #${id}`} -{" "}
                    {doc.spec_title || "Специализация не указана"}
                  </option>
                );
              })}
            </select>
          </div>

          {!isPatient && (
            <div
              className="form__group"
              ref={dropdownRef}
              style={{ position: "relative" }}
            >
              <label>Пациент (ФИО):</label>
              <div>
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
              </div>

              {isDropdownOpen && !selectedPatient && (
                <ul className="autocomplete__list">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => {
                      const fullName = patient.patient_name || patient.name;
                      return (
                        <li
                          key={patient.patient_id || patient.card_number}
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
            <select
              required
              value={date}
              disabled={
                !doctorId || loadingDates || availableDates.length === 0
              }
              onChange={(e) => {
                setDate(e.target.value);
                setAvailableSlots([]);
                setSelectedSlot("");
                setLoadingSlots(false);
              }}
              className="my__input"
            >
              <option value="">
                {loadingDates
                  ? "Загрузка доступных дат..."
                  : !doctorId
                    ? "-- Сначала выберите врача --"
                    : availableDates.length === 0
                      ? "Нет доступных дат"
                      : "-- Выберите дату --"}
              </option>
              {availableDates.map((availableDate) => (
                <option key={availableDate} value={availableDate}>
                  {new Date(`${availableDate}T00:00:00`).toLocaleDateString(
                    "ru-RU",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </option>
              ))}
            </select>
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
                      timeZone: "Europe/Moscow",
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
              disabled={isSubmitting || !selectedSlot || !bookingPatient?.id}
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
