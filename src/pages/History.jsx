import { USER_INFO } from "../constants";
import "../styles/History.css";
import api from "../api";
import React, { useState, useEffect, useMemo } from "react";

function History() {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "REGISTRAR";
  const isPatient = currentUser?.role === "PATIENT";

  const [filters, setFilters] = useState({
    patient_id: "",
    doctor_id: "",
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    setError(null);
    try {
      const params = {};
      if (filters.patient_id) {
        params.patient_id = filters.patient_id;
      }
      if (filters.doctor_id && isAdmin) {
        params.doctor_id = filters.doctor_id;
      }

      const res = await api.get("/medical-history/", { params });
      setHistory(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось загрузить историю");
    }
  };

  const fetchPatients = async () => {
    setError(null);
    try {
      const res = await api.get("/patients/list/");
      setPatients(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Не удалось загрузить список пациентов",
      );
    }
  };

  const fetchDoctors = async () => {
    setError(null);
    try {
      const res = await api.get("/doctors/list/");
      setDoctors(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Не удалось загрузить список врачей",
      );
    }
  };
  useEffect(() => {
    if (!isPatient) {
      fetchPatients();
    }
    if (isAdmin) {
      fetchDoctors();
    }
  }, [isPatient, isAdmin, fetchPatients, fetchDoctors]);

  useEffect(() => {
    fetchHistory();
  }, [filters.patient_id, filters.doctor_id, isAdmin]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const handleResetFilters = () => {
    setFilters({ patient_id: "", doctor_id: "" });
  };

  return (
    <div className="history__container">
      <h2>Медицинская история</h2>
      {!isPatient && (
        <div className="history__filters">
          <div className="filter__group">
            <label>ФИО пациента:</label>
            <select
              name="patient_id"
              value={filters.patient_id}
              onChange={handleFilterChange}
              className="my__input"
            >
              <option value="">-- Выберите пациента --</option>
              {patients.map((item) => (
                <option
                  key={item.patient_id || item.card_number}
                  value={item.patient_id || item.card_number}
                >
                  {item.patient_name}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div className="filter__group">
              <label>ФИО врача:</label>
              <select
                name="doctor_id"
                value={filters.doctor_id}
                onChange={handleFilterChange}
                className="my__input"
              >
                <option value="">-- Выберите врача --</option>
                {doctors.map((item) => (
                  <option key={item.doctor_id} value={item.doctor_id}>
                    {item.doctor_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn--second"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
      {error && <div className="history__error">{error}</div>}
      {!error && (
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history__empty">Записи не найдены.</div>
          ) : (
            history.map((record) => (
              <article
                className="history-item"
                key={record.id || record.log_id}
              >
                <div className="history-item__header">
                  <strong className="history-item__date">
                    {new Date(record.appointment_date).toLocaleString()}
                  </strong>

                  <span className="history-item__status">{record.status}</span>
                </div>

                <div className="history-item__meta">
                  {!isPatient && (
                    <p>
                      <strong>Пациент:</strong> {record.patient_name} (Карта №
                      {record.patient_card})
                    </p>
                  )}

                  {!isDoctor && (
                    <p>
                      <strong>Врач:</strong> {record.doctor_name} (
                      {record.doctor_specialty})
                    </p>
                  )}
                </div>

                <div className="history-item__content">
                  <p className="history-item__diagnosis">
                    <strong>Диагноз:</strong> {record.diagnosis || "Не указан"}
                  </p>

                  <p className="history-item__recommendations">
                    <strong>Назначения / Рекомендации:</strong>{" "}
                    {record.recommendations || "Отсутствуют"}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
export default History;
