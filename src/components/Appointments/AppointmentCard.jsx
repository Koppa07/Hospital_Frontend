function AppointmentCard({ app, onCancel, onComplete }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "BOOKED":
        return <span className="badge badge--booked">Запланировано</span>;
      case "COMPLETED":
        return <span className="badge badge--completed">Завершено</span>;
      case "CANCELLED":
        return <span className="badge badge--cancelled">Отменено</span>;
      case "NO_SHOW":
        return <span className="badge badge--noshow">Неявка</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="appointment__card">
      <div className="appointment__card-header">
        <h4>{app.title}</h4>
        {getStatusBadge(app.status)}
      </div>

      <div className="appointment__card-body">
        <p>
          <strong>Время:</strong>{" "}
          {new Date(app.start).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          -{" "}
          {new Date(app.end).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p>
          <strong>Дата:</strong> {new Date(app.start).toLocaleDateString()}
        </p>
        <p>
          <strong>Карта пациента:</strong> #{app.patient_id}
        </p>
      </div>

      {app.status === "BOOKED" && (
        <div className="appointment__card-actions">
          <button onClick={() => onComplete(app)} className="btn btn--complete">
            Завершить приём
          </button>
          <button onClick={() => onCancel(app)} className="btn btn--cancel">
            Отменить / Неявка
          </button>
        </div>
      )}
    </div>
  );
}

export default AppointmentCard;
