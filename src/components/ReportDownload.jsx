import { useEffect, useState } from "react";
import api from "../api";
import "../styles/Reports.css";

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getErrorMessage = async (error) => {
  const data = error.response?.data;
  if (data instanceof Blob) {
    const text = await data.text();
    try {
      const parsed = JSON.parse(text);
      return parsed.detail || parsed.error || "Не удалось скачать отчет.";
    } catch {
      return "Не удалось скачать отчет.";
    }
  }
  return data?.detail || data?.error || "Не удалось скачать отчет.";
};

const savePdf = (response, fallbackFilename) => {
  const fileUrl = URL.createObjectURL(response.data);
  const downloadLink = document.createElement("a");
  const contentDisposition = response.headers["content-disposition"] || "";
  const filename =
    /filename="?([^";]+)"?/i.exec(contentDisposition)?.[1] || fallbackFilename;

  downloadLink.href = fileUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
};

function ReportDownload({ isDoctor = false }) {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [startDate, setStartDate] = useState(getToday);
  const [endDate, setEndDate] = useState(getToday);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [diagnosisDateFrom, setDiagnosisDateFrom] = useState(getToday);
  const [diagnosisDateTo, setDiagnosisDateTo] = useState(getToday);
  const [isDownloadingDiagnosisDrugs, setIsDownloadingDiagnosisDrugs] =
    useState(false);
  const [diagnosisDrugsError, setDiagnosisDrugsError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const loadDoctors = async () => {
      try {
        if (isDoctor) {
          const response = await api.get("/doctor/profile/");
          if (isCurrentRequest) {
            setDoctorId(String(response.data.doctor_id));
          }
        } else {
          const response = await api.get("/doctors/list/");
          if (isCurrentRequest) {
            setDoctors(response.data);
          }
        }
      } catch (loadError) {
        if (isCurrentRequest) {
          setError(
            loadError.response?.data?.detail ||
              (isDoctor
                ? "Не удалось загрузить профиль врача."
                : "Не удалось загрузить список врачей."),
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoadingDoctors(false);
        }
      }
    };

    loadDoctors();
    return () => {
      isCurrentRequest = false;
    };
  }, [isDoctor]);

  const handleDownload = async (event) => {
    event.preventDefault();
    setError("");

    if (!doctorId) {
      setError("Выберите врача.");
      return;
    }
    if (startDate > endDate) {
      setError("Дата начала не может быть позже даты окончания.");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await api.get(`/reports/doctor/${doctorId}/pdf/`, {
        params: { start_date: startDate, end_date: endDate },
        responseType: "blob",
      });
      savePdf(
        response,
        `analytics_doctor_${doctorId}_${startDate}_${endDate}.pdf`,
      );
    } catch (downloadError) {
      setError(await getErrorMessage(downloadError));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDiagnosisDrugsDownload = async (event) => {
    event.preventDefault();
    setDiagnosisDrugsError("");

    if (diagnosisDateFrom > diagnosisDateTo) {
      setDiagnosisDrugsError(
        "Дата начала не может быть позже даты окончания.",
      );
      return;
    }

    setIsDownloadingDiagnosisDrugs(true);
    try {
      const response = await api.get("/reports/diagnoses-drugs/", {
        params: {
          date_from: diagnosisDateFrom,
          date_to: diagnosisDateTo,
        },
        responseType: "blob",
      });
      savePdf(
        response,
        `diagnosis_drugs_${diagnosisDateFrom}_${diagnosisDateTo}.pdf`,
      );
    } catch (downloadError) {
      setDiagnosisDrugsError(await getErrorMessage(downloadError));
    } finally {
      setIsDownloadingDiagnosisDrugs(false);
    }
  };

  return (
    <div className="reports__downloads">
      <div className="reports__download">
        <h3>Скачать отчет о работе врача</h3>
        <form onSubmit={handleDownload}>
          {!isDoctor && (
            <label className="reports__download-field">
              Врач
              <select
                className="my__input"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
                disabled={isLoadingDoctors || doctors.length === 0}
                required
              >
                <option value="">
                  {isLoadingDoctors
                    ? "Загрузка списка врачей..."
                    : "Выберите врача"}
                </option>
                {doctors.map((doctor) => {
                  const id = doctor.doctor_id ?? doctor.id;
                  return (
                    <option key={id} value={id}>
                      {doctor.doctor_name || doctor.name || `Врач #${id}`}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
          {isDoctor && (
            <p className="reports__download-doctor">
              Отчет будет сформирован по вашему профилю.
            </p>
          )}
          <div className="reports__download-dates">
            <label className="reports__download-field">
              С
              <input
                className="my__input"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </label>
            <label className="reports__download-field">
              По
              <input
                className="my__input"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </label>
          </div>
          {error && (
            <div className="reports__download-error" role="alert">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn--prime"
            disabled={
              isDownloading ||
              isLoadingDoctors ||
              !doctorId ||
              (!isDoctor && doctors.length === 0)
            }
          >
            {isDownloading ? "Формирование отчета..." : "Скачать PDF"}
          </button>
        </form>
      </div>
      {!isDoctor && (
        <div className="reports__download">
          <h3>Скачать отчет по диагнозам и препаратам</h3>
          <form onSubmit={handleDiagnosisDrugsDownload}>
            <div className="reports__download-dates">
              <label className="reports__download-field">
                С
                <input
                  className="my__input"
                  type="date"
                  value={diagnosisDateFrom}
                  max={diagnosisDateTo}
                  onChange={(event) => setDiagnosisDateFrom(event.target.value)}
                  required
                />
              </label>
              <label className="reports__download-field">
                По
                <input
                  className="my__input"
                  type="date"
                  value={diagnosisDateTo}
                  min={diagnosisDateFrom}
                  onChange={(event) => setDiagnosisDateTo(event.target.value)}
                  required
                />
              </label>
            </div>
            {diagnosisDrugsError && (
              <div className="reports__download-error" role="alert">
                {diagnosisDrugsError}
              </div>
            )}
            <button
              type="submit"
              className="btn--prime"
              disabled={isDownloadingDiagnosisDrugs}
            >
              {isDownloadingDiagnosisDrugs
                ? "Формирование отчета..."
                : "Скачать PDF"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ReportDownload;
