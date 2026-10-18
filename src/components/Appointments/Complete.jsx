import { useEffect, useState } from "react";
import api from "../../api";
import "../../styles/Appointments/Complete.css";

function CompleteAppointmentModal({ appointment, onClose, onSuccess }) {
  const [diseaseId, setDiseaseId] = useState("");
  const [complains, setComplains] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [diseases, setDiseases] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState([]);
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [dosage, setDosage] = useState("");
  const [schedule, setSchedule] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadCatalogs = async () => {
      try {
        const [diseasesResponse, drugsResponse] = await Promise.all([
          api.get("/diseases/"),
          api.get("/drugs/"),
        ]);
        if (isActive) {
          setDiseases(diseasesResponse.data);
          setDrugs(drugsResponse.data);
        }
      } catch (err) {
        if (isActive) {
          setCatalogError(
            err.response?.data?.detail ||
              "Не удалось загрузить диагнозы и список лекарств.",
          );
        }
      } finally {
        if (isActive) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalogs();
    return () => {
      isActive = false;
    };
  }, []);

  const addDrug = () => {
    const selectedDrug = drugs.find(
      (drug) => String(drug.drug_id) === selectedDrugId,
    );

    if (!selectedDrug || !dosage.trim() || !schedule.trim()) {
      setFormError("Укажите лекарство, дозировку и схему приема.");
      return;
    }

    if (
      `Дозировка: ${dosage.trim()}; схема приема: ${schedule.trim()}`.length >
      100
    ) {
      setFormError(
        "Дозировка и схема приема вместе не должны превышать 100 символов.",
      );
      return;
    }

    if (
      prescriptionDrugs.some((drug) => drug.drug_id === selectedDrug.drug_id)
    ) {
      setFormError("Это лекарство уже добавлено в рецепт.");
      return;
    }

    setPrescriptionDrugs((current) => [
      ...current,
      {
        drug_id: selectedDrug.drug_id,
        drug_title: selectedDrug.drug_title,
        drug_type: selectedDrug.drug_type,
        dosage: dosage.trim(),
        schedule: schedule.trim(),
      },
    ]);
    setSelectedDrugId("");
    setDosage("");
    setSchedule("");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const appointmentId = appointment.log_id ?? appointment.id;
    if (appointmentId == null) {
      setFormError("Не удалось определить номер приема.");
      return;
    }

    if (prescriptionDrugs.length > 0 && !recommendations.trim()) {
      setFormError(
        "Укажите общие рекомендации по лечению для выписываемого рецепта.",
      );
      return;
    }

    setLoading(true);
    try {
      await api.post(`/appointments/${appointmentId}/complete/`, {
        disease_id: Number(diseaseId),
        complains,
        recommendations,
        drugs: prescriptionDrugs.map(({ drug_id, dosage, schedule }) => ({
          drug_id,
          dosage,
          schedule,
        })),
      });
      onSuccess(appointmentId, "COMPLETED");
      onClose();
    } catch (err) {
      const responseData = err.response?.data;
      const serverMessage =
        responseData?.error ||
        responseData?.detail ||
        (responseData &&
          Object.entries(responseData)
            .flatMap(([field, messages]) =>
              (Array.isArray(messages) ? messages : [messages]).map(
                (message) => `${field}: ${message}`,
              ),
            )
            .join(" "));
      setFormError(serverMessage || "Ошибка при завершении приёма");
    } finally {
      setLoading(false);
    }
  };

  const addedDrugIds = new Set(
    prescriptionDrugs.map((drug) => String(drug.drug_id)),
  );

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div
        className="modal__content complete-appointment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Завершение приёма #{appointment.log_id ?? appointment.id}</h3>
        {catalogError && (
          <div className="appointments__error">{catalogError}</div>
        )}
        {formError && <div className="appointments__error">{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label htmlFor="complete-disease">Диагноз:</label>
            <select
              id="complete-disease"
              required
              value={diseaseId}
              onChange={(e) => setDiseaseId(e.target.value)}
              className="my__input"
              disabled={catalogLoading || Boolean(catalogError)}
            >
              <option value="">Выберите диагноз</option>
              {diseases.map((disease) => (
                <option key={disease.disease_id} value={disease.disease_id}>
                  {disease.disease_code} — {disease.disease_title}
                </option>
              ))}
            </select>
          </div>

          <div className="form__group">
            <label htmlFor="complete-complains">Жалобы пациента:</label>
            <textarea
              id="complete-complains"
              required
              minLength={5}
              rows="3"
              value={complains}
              onChange={(e) => setComplains(e.target.value)}
              className="my__input"
              placeholder="Опишите жалобы"
            />
          </div>

          <div className="form__group">
            <label htmlFor="complete-recommendations">Рекомендации:</label>
            <textarea
              id="complete-recommendations"
              rows="3"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="my__input"
              placeholder="Рекомендации по лечению"
            />
          </div>

          <fieldset className="form__group">
            <legend>Рецепт</legend>
            <label htmlFor="prescription-drug">Лекарственный препарат*:</label>
            <select
              id="prescription-drug"
              value={selectedDrugId}
              onChange={(e) => setSelectedDrugId(e.target.value)}
              className="my__input"
              disabled={catalogLoading || Boolean(catalogError)}
            >
              <option value="">Выберите препарат</option>
              {drugs.map((drug) => (
                <option
                  key={drug.drug_id}
                  value={drug.drug_id}
                  disabled={addedDrugIds.has(String(drug.drug_id))}
                >
                  {drug.drug_title}
                  {drug.drug_type ? ` (${drug.drug_type})` : ""}
                </option>
              ))}
            </select>
            <label htmlFor="prescription-dosage">Дозировка*:</label>
            <input
              id="prescription-dosage"
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="my__input"
              placeholder="Например: 500 мг"
            />
            <label htmlFor="prescription-schedule">Схема приема*:</label>
            <input
              id="prescription-schedule"
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="my__input"
              placeholder="Например: 3 раза в день после еды, 7 дней"
            />
            <button
              type="button"
              className="btn--second"
              onClick={addDrug}
              disabled={catalogLoading || Boolean(catalogError)}
            >
              Добавить препарат
            </button>

            {prescriptionDrugs.length > 0 && (
              <ul>
                {prescriptionDrugs.map((drug) => (
                  <li key={drug.drug_id}>
                    {drug.drug_title}: {drug.dosage}; {drug.schedule}
                    <button
                      type="button"
                      className="btn--second"
                      aria-label={`Удалить ${drug.drug_title} из рецепта`}
                      onClick={() =>
                        setPrescriptionDrugs((current) =>
                          current.filter(
                            (item) => item.drug_id !== drug.drug_id,
                          ),
                        )
                      }
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div className="modal__actions">
            <button type="button" onClick={onClose} className="btn--second">
              Отмена
            </button>
            <button
              type="submit"
              className="btn--prime"
              disabled={loading || catalogLoading || Boolean(catalogError)}
            >
              {loading ? "Сохранение..." : "Завершить приём"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompleteAppointmentModal;
