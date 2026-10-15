import React, { useCallback, useEffect, useMemo, useState } from "react";

import api from "../api";
import { USER_INFO } from "../constants";
import BookAppointmentModal from "../components/Appointments/Book";
import CreateSchedule from "../components/CreateSchedule";
import "../styles/Schedule.css";

const getStoredUser = () => {
  try {
    const savedUser = localStorage.getItem(USER_INFO);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date) => {
  const result = startOfDay(date);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
};

const sameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const getDoctorId = (doctor) => doctor?.doctor_id ?? doctor?.id;

const getDoctorName = (doctor) =>
  doctor?.doctor_name || doctor?.name || `Врач #${getDoctorId(doctor) ?? ""}`;

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getViewRange = (date, view) => {
  let start;
  let end;

  if (view === "day") {
    start = startOfDay(date);
    end = start;
  } else if (view === "week") {
    start = startOfWeek(date);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
  } else {
    start = new Date(date.getFullYear(), date.getMonth(), 1);
    end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
};

const getEventMinutes = (date) => date.getHours() * 60 + date.getMinutes();

const formatTime = (date) =>
  date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const Schedule = () => {
  const currentUser = useMemo(() => getStoredUser(), []);

  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin = currentUser?.role === "ADMIN";
  const canManageSchedule = isAdmin || currentUser?.role === "REGISTRAR";

  const currentDoctorId = currentUser?.doctor_id ?? currentUser?.id;

  const [events, setEvents] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState(
    isDoctor ? String(currentDoctorId ?? "") : "",
  );

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [calendarView, setCalendarView] = useState("week");

  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);
  const [selectedDayModal, setSelectedDayModal] = useState(null);

  const monthName = displayedMonth.toLocaleDateString("ru-RU", {
    month: "long",
  });

  const currentMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const currentYear = displayedMonth.getFullYear();

  const miniCalendarDays = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result = [];

    for (let i = offset - 1; i >= 0; i -= 1) {
      const date = new Date(year, month, -i);
      result.push({ date, outside: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push({
        date: new Date(year, month, day),
        outside: false,
      });
    }

    let nextDay = 1;

    while (result.length < 42) {
      result.push({
        date: new Date(year, month + 1, nextDay++),
        outside: true,
      });
    }

    return result;
  }, [displayedMonth]);

  useEffect(() => {
    if (isDoctor) return;

    let cancelled = false;

    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors/list/");

        if (cancelled) return;

        const list = Array.isArray(response.data) ? response.data : [];
        setDoctors(list);

        setSelectedDoctorId((previous) => {
          if (
            previous &&
            list.some(
              (doctor) => String(getDoctorId(doctor)) === String(previous),
            )
          ) {
            return previous;
          }

          return "";
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail || "Не удалось загрузить список врачей.",
          );
        }
      }
    };

    fetchDoctors();

    return () => {
      cancelled = true;
    };
  }, [isDoctor]);

  const loadSchedule = useCallback(async () => {
    const targetDoctorId = isDoctor ? currentDoctorId : selectedDoctorId;

    if (isDoctor && !targetDoctorId) {
      setEvents([]);
      return;
    }

    if (!isDoctor && !targetDoctorId && doctors.length === 0) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const range = getViewRange(selectedDate, calendarView);
      const response = await api.get("/schedule/", {
        params: {
          ...(targetDoctorId ? { doctor_id: targetDoctorId } : {}),
          ...range,
        },
      });

      const schedule = Array.isArray(response.data) ? response.data : [];

      const formattedEvents = schedule
        .map((item) => {
          const type = item.type || "appointment";
          const doctorId = Number(
            item.doctor ?? item.doctor_id ?? targetDoctorId,
          );
          const doctor = doctors.find(
            (candidate) => Number(getDoctorId(candidate)) === doctorId,
          );
          return {
            id: `${type}-${item.id}`,
            type,
            text:
              type === "shift"
                ? item.title || "Рабочее время врача"
                : item.title ||
                  `Пациент: ${item.patient_name || "Не указан"} (${
                    item.procedure || "Прием"
                  })`,
            start: new Date(item.start ?? item.start_time),
            end: new Date(item.end ?? item.end_time),
            doctorId,
            doctorName: item.doctor_name || getDoctorName(doctor),
            patient_id: item.patient_id,
            procedure: item.procedure,
            patient_name: item.patient_name,
            status: item.status,
          };
        })
        .filter(
          (item) =>
            !Number.isNaN(item.start.getTime()) &&
            !Number.isNaN(item.end.getTime()),
        );

      setEvents(formattedEvents);
    } catch (err) {
      console.error("Ошибка загрузки расписания:", err);
      setEvents([]);
      setError(
        err.response?.data?.detail ||
          "Не удалось загрузить расписание. Попробуйте обновить страницу.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    isDoctor,
    currentDoctorId,
    selectedDoctorId,
    selectedDate,
    calendarView,
    doctors,
  ]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    if (!selectedDayModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedDayModal(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedDayModal]);

  const visibleEvents = useMemo(() => {
    if (isDoctor) {
      return events.filter(
        (event) => Number(event.doctorId) === Number(currentDoctorId),
      );
    }

    if (!selectedDoctorId) return events;
    return events.filter(
      (event) => Number(event.doctorId) === Number(selectedDoctorId),
    );
  }, [events, isDoctor, currentDoctorId, selectedDoctorId]);

  const selectedDoctor = doctors.find(
    (doctor) => Number(getDoctorId(doctor)) === Number(selectedDoctorId),
  );

  const selectedDoctorName = isDoctor
    ? currentUser?.doctor_name || currentUser?.name || "Мое расписание"
    : selectedDoctor
      ? getDoctorName(selectedDoctor)
      : "Все врачи";

  const selectDate = (date) => {
    const selected = startOfDay(date);
    setSelectedDate(selected);
    setDisplayedMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  };

  const changeMonth = (offset) => {
    const nextMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + offset,
      1,
    );
    setDisplayedMonth(nextMonth);
    if (calendarView === "month") {
      const selectedDay = Math.min(
        selectedDate.getDate(),
        new Date(
          nextMonth.getFullYear(),
          nextMonth.getMonth() + 1,
          0,
        ).getDate(),
      );
      selectDate(
        new Date(nextMonth.getFullYear(), nextMonth.getMonth(), selectedDay),
      );
    }
  };

  const goToToday = () => {
    selectDate(new Date());
  };

  const navigatePeriod = (offset) => {
    const nextDate = new Date(selectedDate);

    if (calendarView === "day") {
      nextDate.setDate(nextDate.getDate() + offset);
    } else if (calendarView === "week") {
      nextDate.setDate(nextDate.getDate() + offset * 7);
    } else {
      const day = nextDate.getDate();
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + offset);
      const lastDay = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth() + 1,
        0,
      ).getDate();
      nextDate.setDate(Math.min(day, lastDay));
    }

    selectDate(nextDate);
  };

  const weekDays = useMemo(() => {
    const monday = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, [selectedDate]);

  const eventsForDate = useCallback(
    (date) =>
      visibleEvents
        .filter((event) => sameDay(event.start, date))
        .sort((first, second) => first.start - second.start),
    [visibleEvents],
  );

  const openDayDetails = (date) => {
    selectDate(date);
    setSelectedDayModal(startOfDay(date));
  };

  const timelineBounds = useMemo(() => {
    const dates = calendarView === "day" ? [selectedDate] : weekDays;
    const periodEvents = dates.flatMap(eventsForDate);
    const startMinute = periodEvents.length
      ? Math.min(...periodEvents.map((event) => getEventMinutes(event.start)))
      : 8 * 60;
    const endMinute = periodEvents.length
      ? Math.max(
          ...periodEvents.map(
            (event) =>
              getEventMinutes(event.start) +
              (event.end.getTime() - event.start.getTime()) / 60000,
          ),
        )
      : 20 * 60;
    const startHour = Math.max(0, Math.floor(startMinute / 60) - 1);
    const endHour = Math.min(24, Math.ceil(endMinute / 60) + 1);

    return {
      startHour: Math.min(startHour, 8),
      endHour: Math.max(endHour, 20),
    };
  }, [calendarView, selectedDate, weekDays, eventsForDate]);

  const renderTimelineDay = (date, compact = false) => {
    const dayEvents = eventsForDate(date);
    const duration = timelineBounds.endHour - timelineBounds.startHour;
    const hourHeight = compact ? 48 : 64;
    const positionedEvents = dayEvents.map((event) => {
      const top =
        ((getEventMinutes(event.start) - timelineBounds.startHour * 60) / 60) *
        hourHeight;
      const minutes = Math.max(
        15,
        (event.end.getTime() - event.start.getTime()) / 60000,
      );

      return {
        event,
        top,
        height: Math.max(24, (minutes / 60) * hourHeight),
      };
    });

    return (
      <div
        className={`schedule__timeline ${
          compact ? "schedule__timeline--compact" : ""
        }`}
        style={{ height: `${duration * hourHeight}px` }}
      >
        {Array.from({ length: duration + 1 }, (_, index) => (
          <div
            className="schedule__timeline-hour"
            key={timelineBounds.startHour + index}
            style={{ top: `${index * hourHeight}px` }}
          >
            <time>
              {String(timelineBounds.startHour + index).padStart(2, "0")}:00
            </time>
          </div>
        ))}
        {positionedEvents
          .filter(({ event }) => event.type === "shift")
          .map(({ event, top, height }, index) => (
            <div
              className="schedule__timeline-shift"
              key={event.id}
              style={{
                top: `${top}px`,
                height: `${height}px`,
                left: `${4 + (index % 3) * 3}%`,
                width: `${92 - (index % 3) * 3}%`,
              }}
              title={`${event.doctorName}: ${formatTime(event.start)}–${formatTime(
                event.end,
              )}`}
            >
              <strong>{event.doctorName}</strong>
              <span>
                {formatTime(event.start)}–{formatTime(event.end)} · рабочее
                время
              </span>
            </div>
          ))}
        {positionedEvents
          .filter(({ event }) => event.type === "appointment")
          .map(({ event, top, height }, index) => (
            <article
              className={`schedule__timeline-appointment ${
                event.status === "CANCELLED" ? "is-cancelled" : ""
              }`}
              key={event.id}
              style={{
                top: `${top}px`,
                height: `${Math.max(28, height)}px`,
                left: `${8 + (index % 3) * 5}%`,
                width: `${82 - (index % 3) * 5}%`,
              }}
              title={`${event.doctorName}: ${event.text}`}
            >
              <time>{formatTime(event.start)}</time>
              <strong>{event.doctorName}</strong>
              <span>
                {event.patient_name || event.procedure || event.text}
              </span>
            </article>
          ))}
        {!dayEvents.length && (
          <span className="schedule__timeline-empty">
            Нет записей и графика
          </span>
        )}
      </div>
    );
  };

  const bookingDoctors = isDoctor
    ? [
        {
          doctor_id: currentDoctorId,
          doctor_name: currentUser?.doctor_name || currentUser?.name,
        },
      ]
    : doctors;

  const selectedDoctorForBooking = isDoctor
    ? currentDoctorId
    : selectedDoctorId;

  return (
    <div className="schedule__container">
      <aside className="schedule__sidebar">
        <div className="schedule__sidebar-header">
          <div>
            <div className="schedule__sidebar-label">РАСПИСАНИЕ</div>
            <div className="schedule__sidebar-title">Приемы</div>
          </div>
        </div>

        <section className="schedule__mini-calendar">
          <div className="schedule__mini-header">
            <button
              type="button"
              className="schedule__mini-arrow"
              aria-label="Предыдущий месяц"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>

            <span>
              {currentMonth} {currentYear}
            </span>

            <button
              type="button"
              className="schedule__mini-arrow"
              aria-label="Следующий месяц"
              onClick={() => changeMonth(1)}
            >
              ›
            </button>
          </div>

          <div className="schedule__weekdays">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="schedule__days">
            {miniCalendarDays.map((item) => (
              <button
                type="button"
                key={item.date.toISOString()}
                className={[
                  "schedule__day",
                  item.outside ? "is-outside" : "",
                  sameDay(item.date, new Date()) ? "is-today" : "",
                  sameDay(item.date, selectedDate) ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={formatDate(item.date)}
                aria-pressed={sameDay(item.date, selectedDate)}
                onClick={() => selectDate(item.date)}
              >
                {item.date.getDate()}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="schedule__today-button"
          onClick={goToToday}
        >
          Сегодня, {new Date().getDate()}{" "}
          {new Date().toLocaleDateString("ru-RU", {
            month: "short",
          })}
        </button>

        {!isDoctor && (
          <section className="schedule__sidebar-section">
            <label
              className="schedule__section-label"
              htmlFor="schedule-doctor"
            >
              Врач
            </label>

            <select
              id="schedule-doctor"
              className="schedule__doctor-select"
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              disabled={loading || doctors.length === 0}
            >
              <option value="">Все врачи</option>
              {doctors.length === 0 ? (
                <option value="" disabled>
                  Врачи не найдены
                </option>
              ) : (
                doctors.map((doctor) => (
                  <option key={getDoctorId(doctor)} value={getDoctorId(doctor)}>
                    {getDoctorName(doctor)}
                  </option>
                ))
              )}
            </select>
          </section>
        )}
      </aside>

      <main className="schedule__main">
        <div className="schedule__main-header">
          <div className="schedule__main-title">
            <div className="schedule__main-eyebrow">ГРАФИК ПРИЕМА</div>

            <h1>{selectedDoctorName}</h1>
            <div className="schedule__period-label">
              {calendarView === "month"
                ? `${currentMonth} ${currentYear}`
                : calendarView === "week"
                  ? `${formatDate(weekDays[0])} — ${weekDays[6].toLocaleDateString(
                      "ru-RU",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}`
                  : formatDate(selectedDate)}
            </div>
          </div>

          <div className="schedule__main-actions">
            <button
              type="button"
              className="schedule__action-button schedule__period-arrow"
              aria-label="Предыдущий период"
              onClick={() => navigatePeriod(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="schedule__action-button"
              onClick={goToToday}
            >
              Сегодня
            </button>
            <button
              type="button"
              className="schedule__action-button schedule__period-arrow"
              aria-label="Следующий период"
              onClick={() => navigatePeriod(1)}
            >
              ›
            </button>

            <div
              className="schedule__view-switcher"
              aria-label="Вид расписания"
            >
              {[
                ["day", "День"],
                ["week", "Неделя"],
                ["month", "Месяц"],
              ].map(([view, label]) => (
                <button
                  type="button"
                  key={view}
                  className={`schedule__action-button ${
                    calendarView === view ? "is-active" : ""
                  }`}
                  aria-pressed={calendarView === view}
                  onClick={() => setCalendarView(view)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn--second"
              onClick={() => setCreateAppointmentOpen(true)}
            >
              + Новая запись
            </button>
            {canManageSchedule && (
              <button
                type="button"
                className="schedule__action-button btn--prime"
                onClick={() => setCreateScheduleOpen(true)}
              >
                + График врача
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="schedule__error" role="alert">
            {error}
            <button type="button" onClick={loadSchedule}>
              Повторить
            </button>
          </div>
        )}

        {loading && (
          <div className="schedule__loading" role="status">
            Загрузка расписания...
          </div>
        )}

        <div className="schedule__calendar-wrapper">
          {calendarView === "day" && (
            <section className="schedule__day-view">
              <h2>{formatDate(selectedDate)}</h2>
              <div className="schedule__day-timeline">
                {renderTimelineDay(selectedDate)}
              </div>
            </section>
          )}

          {calendarView === "week" && (
            <section className="schedule__week-view">
              {weekDays.map((date) => {
                return (
                  <div
                    className="schedule__week-column"
                    key={date.toISOString()}
                  >
                    <button
                      type="button"
                      className={`schedule__column-heading ${
                        sameDay(date, selectedDate) ? "is-selected" : ""
                      }`}
                      onClick={() => selectDate(date)}
                    >
                      <span>
                        {date.toLocaleDateString("ru-RU", { weekday: "short" })}
                      </span>
                      <strong>{date.getDate()}</strong>
                    </button>
                    <div className="schedule__column-events">
                      {renderTimelineDay(date, true)}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {calendarView === "month" && (
            <section className="schedule__month-view">
              <div className="schedule__month-weekdays">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="schedule__month-grid">
                {miniCalendarDays.map(({ date, outside }) => {
                  const dayEvents = eventsForDate(date);
                  return (
                    <button
                      type="button"
                      key={date.toISOString()}
                      className={`schedule__month-day ${
                        outside ? "is-outside" : ""
                      } ${sameDay(date, selectedDate) ? "is-selected" : ""} ${
                        sameDay(date, new Date()) ? "is-today" : ""
                      }`}
                      aria-label={`${outside ? "Открыть месяц" : "Открыть день"}: ${formatDate(
                        date,
                      )}`}
                      aria-haspopup={outside ? undefined : "dialog"}
                      onClick={() => {
                        if (outside) {
                          selectDate(date);
                          return;
                        }
                        openDayDetails(date);
                      }}
                    >
                      <span className="schedule__month-day-number">
                        {date.getDate()}
                      </span>
                      <span className="schedule__month-events">
                        {dayEvents.slice(0, 2).map((event) => (
                          <span
                            className={`schedule__month-event ${
                              event.type === "shift"
                                ? "is-shift"
                                : "is-appointment"
                            }`}
                            key={event.id}
                          >
                            {event.type === "shift"
                              ? `${formatTime(event.start)}–${formatTime(
                                  event.end,
                                )} · ${event.doctorName}`
                              : `${formatTime(event.start)} ${
                                  event.patient_name ||
                                  event.procedure ||
                                  event.text
                                } · ${event.doctorName}`}
                          </span>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="schedule__month-more">
                            + еще {dayEvents.length - 2}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {selectedDayModal && (
        <div
          className="schedule__day-modal-overlay"
          onClick={() => setSelectedDayModal(null)}
        >
          <section
            className="schedule__day-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-day-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="schedule__day-modal-header">
              <div>
                <span>РАСПИСАНИЕ НА ДЕНЬ</span>
                <h2 id="schedule-day-modal-title">
                  {formatDate(selectedDayModal)}
                </h2>
              </div>
              <button
                type="button"
                className="schedule__day-modal-close"
                aria-label="Закрыть"
                onClick={() => setSelectedDayModal(null)}
              >
                ×
              </button>
            </header>
            <div className="schedule__day-modal-events">
              <div className="schedule__day-modal-summary">
                <span>
                  <strong>
                    {
                      eventsForDate(selectedDayModal).filter(
                        (event) => event.type === "appointment",
                      ).length
                    }
                  </strong>
                  записей
                </span>
                <span>
                  <strong>
                    {
                      eventsForDate(selectedDayModal).filter(
                        (event) => event.type === "shift",
                      ).length
                    }
                  </strong>
                  смен
                </span>
              </div>
              <div className="schedule__day-timeline schedule__day-timeline--modal">
                {renderTimelineDay(selectedDayModal)}
              </div>
            </div>
            <footer className="schedule__day-modal-actions">
              <button
                type="button"
                className="schedule__action-button"
                onClick={() => setSelectedDayModal(null)}
              >
                Закрыть
              </button>
              <button
                type="button"
                className="schedule__action-button btn--prime"
                onClick={() => {
                  setSelectedDayModal(null);
                  setCreateAppointmentOpen(true);
                }}
              >
                + Новая запись
              </button>
            </footer>
          </section>
        </div>
      )}

      {createAppointmentOpen && (
        <BookAppointmentModal
          doctors={bookingDoctors}
          user={currentUser}
          initialDoctorId={selectedDoctorForBooking}
          initialDate={toDateInputValue(selectedDate)}
          onClose={() => setCreateAppointmentOpen(false)}
          onSuccess={loadSchedule}
        />
      )}

      {canManageSchedule && createScheduleOpen && (
        <CreateSchedule
          doctors={doctors}
          initialDoctorId={selectedDoctorId}
          initialDate={toDateInputValue(selectedDate)}
          onClose={() => setCreateScheduleOpen(false)}
          onSuccess={async () => {
            setCreateScheduleOpen(false);
            await loadSchedule();
          }}
        />
      )}
    </div>
  );
};

export default Schedule;
