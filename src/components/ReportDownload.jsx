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
  const [dateRanges, setDateRanges] = useState(() => {
    const today = getToday();
    return {
      doctor: { start: today, end: today },
      diagnosesDrugs: { start: today, end: today },
      appointmentStatus: { start: today, end: today },
      doctorLoad: { start: today, end: today },
    };
  });
  const [asOfDate, setAsOfDate] = useState(getToday);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState("");
  const [reportErrors, setReportErrors] = useState({});

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
          setReportErrors((previous) => ({
            ...previous,
            doctor: loadError.response?.data?.detail ||
              (isDoctor
                ? "Не удалось загрузить профиль врача."
                : "Не удалось загрузить список врачей."),
          }));
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

  const handleReportDownload = async (
    event,
    reportKey,
    endpoint,
    params,
    fallbackFilename,
  ) => {
    event.preventDefault();
    setReportErrors((previous) => ({ ...previous, [reportKey]: "" }));

    const dateFrom = params.date_from || params.start_date;
    const dateTo = params.date_to || params.end_date;
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setReportErrors((previous) => ({
        ...previous,
        [reportKey]: "Дата начала не может быть позже даты окончания.",
      }));
      return;
    }

    setDownloadingReport(reportKey);
    try {
      const response = await api.get(endpoint, {
        params,
        responseType: "blob",
      });
      savePdf(response, fallbackFilename);
    } catch (downloadError) {
      const errorMessage = await getErrorMessage(downloadError);
      setReportErrors((previous) => ({
        ...previous,
        [reportKey]: errorMessage,
      }));
    } finally {
      setDownloadingReport("");
    }
  };

  const renderDateRange = (rangeKey) => {
    const { start, end } = dateRanges[rangeKey];
    const updateDate = (field, value) =>
      setDateRanges((previous) => ({
        ...previous,
        [rangeKey]: { ...previous[rangeKey], [field]: value },
      }));

    return (
      <div className="reports__download-dates">
        <label className="reports__download-field">
          С
          <input
            className="my__input"
            type="date"
            value={start}
            max={end}
            onChange={(event) => updateDate("start", event.target.value)}
            required
          />
        </label>
        <label className="reports__download-field">
          По
          <input
            className="my__input"
            type="date"
            value={end}
            min={start}
            onChange={(event) => updateDate("end", event.target.value)}
            required
          />
        </label>
      </div>
    );
  };

  const renderError = (reportKey) =>
    reportErrors[reportKey] && (
      <div className="reports__download-error" role="alert">
        {reportErrors[reportKey]}
      </div>
    );

  const renderSubmit = (reportKey) => (
    <button
      type="submit"
      className="btn--prime"
      disabled={
        downloadingReport !== "" ||
        (reportKey === "doctor" && isLoadingDoctors)
      }
    >
      {downloadingReport === reportKey
        ? "Формирование отчета..."
        : "Скачать PDF"}
    </button>
  );

  return (
    <div className="reports__downloads">
      <h2>Формирование отчетов</h2>
      <div className="reports__download">
        <h3>Отчет о работе врача</h3>
        <form
          onSubmit={(event) =>
            handleReportDownload(
              event,
              "doctor",
              `/reports/doctor/${doctorId}/pdf/`,
              {
                start_date: dateRanges.doctor.start,
                end_date: dateRanges.doctor.end,
              },
              `analytics_doctor_${doctorId}_${dateRanges.doctor.start}_${dateRanges.doctor.end}.pdf`,
            )
          }
        >
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
          {renderDateRange("doctor")}
          {renderError("doctor")}
          {renderSubmit("doctor")}
        </form>
      </div>

      {!isDoctor && (
        <>
          <div className="reports__download">
            <h3>Отчет по диагнозам и препаратам</h3>
            <form
              onSubmit={(event) =>
                handleReportDownload(
                  event,
                  "diagnoses-drugs",
                  "/reports/diagnoses-drugs/",
                  {
                    date_from: dateRanges.diagnosesDrugs.start,
                    date_to: dateRanges.diagnosesDrugs.end,
                  },
                  `diagnosis_drugs_${dateRanges.diagnosesDrugs.start}_${dateRanges.diagnosesDrugs.end}.pdf`,
                )
              }
            >
              {renderDateRange("diagnosesDrugs")}
              {renderError("diagnoses-drugs")}
              {renderSubmit("diagnoses-drugs")}
            </form>
          </div>

          <div className="reports__download">
            <h3>Возрастная структура пациентов</h3>
            <form
              onSubmit={(event) =>
                handleReportDownload(
                  event,
                  "patient-age",
                  "/reports/patient-age/",
                  { as_of_date: asOfDate },
                  `patient_age_report_${asOfDate}.pdf`,
                )
              }
            >
              <label className="reports__download-field">
                Дата отчета
                <input
                  className="my__input"
                  type="date"
                  value={asOfDate}
                  onChange={(event) => setAsOfDate(event.target.value)}
                  required
                />
              </label>
              {renderError("patient-age")}
              {renderSubmit("patient-age")}
            </form>
          </div>

          <div className="reports__download">
            <h3>Статусы записей на прием</h3>
            <form
              onSubmit={(event) =>
                handleReportDownload(
                  event,
                  "appointment-status",
                  "/reports/appointment-status/",
                  {
                    date_from: dateRanges.appointmentStatus.start,
                    date_to: dateRanges.appointmentStatus.end,
                  },
                  `appointment_status_report_${dateRanges.appointmentStatus.start}_${dateRanges.appointmentStatus.end}.pdf`,
                )
              }
            >
              {renderDateRange("appointmentStatus")}
              {renderError("appointment-status")}
              {renderSubmit("appointment-status")}
            </form>
          </div>

          <div className="reports__download">
            <h3>Загрузка врачей</h3>
            <form
              onSubmit={(event) =>
                handleReportDownload(
                  event,
                  "doctor-load",
                  "/reports/doctor-load/",
                  {
                    date_from: dateRanges.doctorLoad.start,
                    date_to: dateRanges.doctorLoad.end,
                  },
                  `doctor_load_report_${dateRanges.doctorLoad.start}_${dateRanges.doctorLoad.end}.pdf`,
                )
              }
            >
              {renderDateRange("doctorLoad")}
              {renderError("doctor-load")}
              {renderSubmit("doctor-load")}
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportDownload;
