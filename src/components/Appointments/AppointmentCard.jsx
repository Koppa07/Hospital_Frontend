import "../../styles/Appointments/AppointmentCard.css";

function AppointmentCard({ app, onCancel, onComplete, user }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "BOOKED":
        return <span className="appointment-card__badge">Запланировано</span>;

      case "COMPLETED":
        return <span className="appointment-card__badge">Завершено</span>;

      case "CANCELLED":
        return <span className="appointment-card__badge">Отменено</span>;

      case "NO_SHOW":
        return <span className="appointment-card__badge">Неявка</span>;

      default:
        return <span className="appointment-card__badge">{status}</span>;
    }
  };

  const isDoctor = user?.role === "DOCTOR";
  const isPatient = user?.role === "PATIENT";
  const status = app?.status?.toUpperCase();
  const appointmentDate = app?.appointment_date || app?.start_datetime;

  return (
    <article className="appointment-card">
      <div className="appointment-card__header">
        <span className="appointment-card__date">
          {appointmentDate
            ? new Date(appointmentDate).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Дата не указана"}
        </span>

        <div
          className={`appointment-card__status appointment-card__status--${
            status?.toLowerCase() || "default"
          }`}
        >
          {getStatusBadge(status || "Неизвестно")}
        </div>
      </div>

      <div className="appointment-card__body">
        {!isDoctor && (
          <>
            <p>
              <strong>Врач:</strong>{" "}
              {app.doctor_name || `Врач #${app.doctor_id}`}
            </p>

            <p>
              <strong>Специализация:</strong> {app.specialization || "Терапевт"}
            </p>

            <p>
              <strong>Кабинет:</strong> {app.room_number || "—"}
            </p>
          </>
        )}

        {isDoctor && (
          <p>
            <strong>Пациент:</strong>{" "}
            {app.patient_name || app.patient?.name || "—"}
          </p>
        )}
      </div>

      {status === "BOOKED" && (
        <div className="appointment-card__actions">
          <button
            type="button"
            onClick={() => onCancel(app)}
            className="btn--second"
          >
            Отменить
          </button>
          {isDoctor && (
            <div>
              <button
                type="button"
                onClick={() => onComplete(app)}
                className="btn--prime"
              >
                Завершить приём
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default AppointmentCard;
