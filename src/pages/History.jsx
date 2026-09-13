import { USER_INFO } from "../constants";
import "../styles/History.css";
import api from "../api";
import React, { useState, useEffect, useMemo } from "react";

function History() {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin = currentUser?.role === "ADMIN" || role === "REGISTRAR";
  const isPatient = currentUser?.role === "PATIENT";

  const [filters, setFilters] = useState({
    patientId: "",
    doctorId: "",
  });
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    setError(null);
    try {
      const params = {};
      if (filters.patientId) params.patient_id = filters.patientId;
      if (filters.doctorId && isAdmin) params.doctor_id = filters.doctorId;

      const res = await api.get("/medical-history/", { params });
      setHistory(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось загрузить историю");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters.patientId, filters.doctorId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="history__container">
      <h2>Медицинская история</h2>

      {!isPatient && (
        <div className="history__filters">
          <div className="filter__group">
            <label style={{ display: "block", marginBottom: "4px" }}>
              ID пациента:
            </label>
            <input
              type="text"
              name="patientId"
              value={filters.patientId}
              onChange={handleFilterChange}
              placeholder="Поиск по ID/Карте"
            />
          </div>

          {isAdminOrRegistrar && (
            <div className="filter__group">
              <label style={{ display: "block", marginBottom: "4px" }}>
                ID врача:
              </label>
              <input
                type="text"
                name="doctorId"
                value={filters.doctorId}
                onChange={handleFilterChange}
                placeholder="Поиск по ID врача"
              />
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: "red" }}>{error}</div>}

      {!error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {history.length === 0 ? (
            <div>Записи не найдены.</div>
          ) : (
            history.map((record) => (
              <div key={record.id || record.log_id}>
                <div>
                  <strong>
                    {new Date(record.appointment_date).toLocaleString()}
                  </strong>
                  <span style={{ color: "#666" }}>Статус: {record.status}</span>
                </div>

                {/* Администраторам и Регистраторам показываем полную информацию о врачах и пациентах */}
                {!isPatient && (
                  <p style={{ margin: "4px 0" }}>
                    <strong>Пациент:</strong> {record.patient_name} (Карта №
                    {record.patient_card})
                  </p>
                )}

                {!isDoctor && (
                  <p style={{ margin: "4px 0" }}>
                    <strong>Врач:</strong> {record.doctor_name} (
                    {record.doctor_specialty})
                  </p>
                )}

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid #eee",
                    margin: "12px 0",
                  }}
                />

                <div style={{ marginTop: "8px" }}>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Диагноз:</strong> {record.diagnosis || "Не указан"}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Назначения / Рекомендации:</strong>{" "}
                    {record.recommendations || "Отсутствуют"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
export default History;
