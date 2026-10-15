import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Calendar, Editor, ContextMenu } from "@svar-ui/react-calendar";
import { Locale } from "@svar-ui/react-core";
import { ru } from "@svar-ui/calendar-locales";
import { ru as ruCore } from "@svar-ui/core-locales";

import "@svar-ui/react-core/style.css";
import "@svar-ui/react-editor/style.css";
import "@svar-ui/react-menu/style.css";
import "@svar-ui/react-toolbar/style.css";

import api from "../api";
import { USER_INFO } from "../constants";
import CreateSchedule from "../components/CreateSchedule";
import "../styles/Schedule.css";

const ruLocale = {
  ...ruCore,
  ...ru,
};

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

const sameDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const getDoctorName = (doctor) =>
  doctor?.doctor_name || doctor?.name || `Врач #${doctor?.id ?? ""}`;

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const Schedule = () => {
  const currentUser = useMemo(() => getStoredUser(), []);

  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin = currentUser?.role === "ADMIN";

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

  const [activeFilter, setActiveFilter] = useState("all");
  const [calendarView, setCalendarView] = useState("week");

  const [calendarApi, setCalendarApi] = useState(null);

  const [editorState, setEditorState] = useState({
    open: false,
    event: null,
  });

  const [contextMenuState, setContextMenuState] = useState({
    open: false,
    event: null,
    point: null,
  });

  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);

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
    if (!isAdmin) return;

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
            list.some((doctor) => String(doctor.id) === String(previous))
          ) {
            return previous;
          }

          return list.length ? String(list[0].id) : "";
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
  }, [isAdmin]);

  const loadSchedule = useCallback(async () => {
    const targetDoctorId = isDoctor ? currentDoctorId : selectedDoctorId;

    if (!targetDoctorId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/schedule/?doctor_id=${encodeURIComponent(targetDoctorId)}`,
      );

      const schedule = Array.isArray(response.data) ? response.data : [];

      const formattedEvents = schedule
        .map((item) => ({
          id: item.id,
          text: `Пациент: ${item.patient_name || "Не указан"} (${
            item.procedure || "Прием"
          })`,
          start: new Date(item.start_time),
          end: new Date(item.end_time),
          doctorId: Number(item.doctor ?? item.doctor_id ?? targetDoctorId),
          patient_id: item.patient_id,
          procedure: item.procedure,
          patient_name: item.patient_name,
        }))
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
  }, [isDoctor, currentDoctorId, selectedDoctorId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    if (!calendarApi) return;

    calendarApi.exec("navigate-to", {
      date: selectedDate,
      view: calendarView,
    });
  }, [calendarApi, selectedDate, calendarView]);

  const visibleEvents = useMemo(() => {
    if (isDoctor) {
      return events.filter(
        (event) => Number(event.doctorId) === Number(currentDoctorId),
      );
    }

    if (!selectedDoctorId) return [];

    return events.filter(
      (event) => Number(event.doctorId) === Number(selectedDoctorId),
    );
  }, [events, isDoctor, currentDoctorId, selectedDoctorId]);

  const filteredEvents = useMemo(
    () => (activeFilter === "all" ? visibleEvents : []),
    [visibleEvents, activeFilter],
  );

  const selectedDayEvents = useMemo(
    () =>
      visibleEvents.filter((event) =>
        sameDay(new Date(event.start), selectedDate),
      ),
    [visibleEvents, selectedDate],
  );

  const bookedCount = selectedDayEvents.length;

  const freeCount = Math.max(0, 12 - bookedCount);

  const selectedDoctor = doctors.find(
    (doctor) => Number(doctor.id) === Number(selectedDoctorId),
  );

  const selectedDoctorName = isDoctor
    ? currentUser?.doctor_name || currentUser?.name || "Мое расписание"
    : selectedDoctor
      ? getDoctorName(selectedDoctor)
      : "Выберите врача";

  const selectMiniDate = (date) => {
    setSelectedDate(new Date(date));
    setDisplayedMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const changeMonth = (offset) => {
    setDisplayedMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + offset, 1),
    );
  };

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setDisplayedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const openNewAppointment = (date = selectedDate) => {
    const start = new Date(date);
    const end = new Date(start.getTime() + 15 * 60 * 1000);

    setEditorState({
      open: true,
      event: {
        start,
        end,
        text: "",
      },
    });
  };

  const handleEventClick = (eventObj) => {
    setEditorState({
      open: true,
      event: eventObj,
    });
  };

  const handleCellClick = (date) => {
    const start = new Date(date);

    setSelectedDate(start);
    setDisplayedMonth(new Date(start.getFullYear(), start.getMonth(), 1));

    openNewAppointment(start);
  };

  const handleContextMenu = (event, eventObj) => {
    if (event?.preventDefault) event.preventDefault();

    setContextMenuState({
      open: true,
      event: eventObj,
      point: {
        x: event?.clientX ?? 0,
        y: event?.clientY ?? 0,
      },
    });
  };

  const closeEditor = () => {
    setEditorState({ open: false, event: null });
  };

  const closeContextMenu = () => {
    setContextMenuState({
      open: false,
      event: null,
      point: null,
    });
  };

  const editFromContextMenu = () => {
    if (!contextMenuState.event) return;

    setEditorState({
      open: true,
      event: contextMenuState.event,
    });

    closeContextMenu();
  };

  const handleSaveEvent = async (updatedEvent) => {
    const targetDoctorId = isDoctor ? currentDoctorId : selectedDoctorId;

    const patientId = Number(updatedEvent.patient_id || updatedEvent.text);

    if (!targetDoctorId) {
      alert("Не выбран врач.");
      return;
    }

    if (!patientId) {
      alert("Не удалось определить пациента. Укажите ID пациента.");
      return;
    }

    const start = new Date(updatedEvent.start);

    if (Number.isNaN(start.getTime())) {
      alert("Указана некорректная дата записи.");
      return;
    }

    const payload = {
      doctor_id: Number(targetDoctorId),
      patient_id: patientId,
      appointment_date: start.toISOString(),
    };

    try {
      if (updatedEvent.id) {
        await api.post(`/appointments/${updatedEvent.id}/cancel/`, {
          status: "CANCELLED",
        });
      }

      await api.post("/schedule/book/", payload);

      closeEditor();
      await loadSchedule();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.response?.data ? JSON.stringify(err.response.data) : null) ||
        "Ошибка при сохранении записи.";

      alert(`Не удалось сохранить запись: ${errorMessage}`);
    }
  };

  const calendarMenuItems = [
    {
      id: "edit",
      text: "Редактировать",
      action: editFromContextMenu,
    },
  ];

  return (
    <div className="schedule__container">
      <aside className="schedule__sidebar">
        <div className="schedule__sidebar-header">
          <div>
            <div className="schedule__sidebar-label">РАСПИСАНИЕ</div>
            <div className="schedule__sidebar-title">Приемы</div>
          </div>

          <button
            type="button"
            className="schedule__sidebar-add btn--prime"
            onClick={() => openNewAppointment()}
          >
            +
          </button>
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
                onClick={() => selectMiniDate(item.date)}
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
            <div className="schedule__section-label">Врач</div>

            <select
              className="schedule__doctor-select"
              value={selectedDoctorId}
              onChange={(event) => {
                setSelectedDoctorId(event.target.value);
                setActiveFilter("all");
              }}
              disabled={loading || doctors.length === 0}
            >
              {doctors.length === 0 ? (
                <option value="">Врачи не найдены</option>
              ) : (
                doctors.map((doctor) => (
                  <option key={doctor.id} value={String(doctor.id)}>
                    {getDoctorName(doctor)}
                  </option>
                ))
              )}
            </select>
          </section>
        )}

        <section className="schedule__sidebar-section">
          <div className="schedule__section-label">Отображение</div>

          <button
            type="button"
            className={`schedule__filter-button ${
              activeFilter === "all" ? "is-active" : ""
            }`}
            aria-pressed={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          >
            <span className="schedule__filter-dot" />
            Все записи
          </button>

          <button
            type="button"
            className={`schedule__filter-button ${
              activeFilter === "free" ? "is-active" : ""
            }`}
            aria-pressed={activeFilter === "free"}
            onClick={() => setActiveFilter("free")}
          >
            <span className="schedule__filter-dot is-free" />
            Свободные окна
          </button>
        </section>

        <section className="schedule__stats">
          <div className="schedule__stat">
            <span className="schedule__stat-value">{bookedCount}</span>
            <span className="schedule__stat-label">
              Записей на{" "}
              {selectedDate.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <div className="schedule__stat">
            <span className="schedule__stat-value">{freeCount}</span>
            <span className="schedule__stat-label">
              Ориентировочно свободных окон
            </span>
          </div>
        </section>
      </aside>

      <main className="schedule__main">
        <div className="schedule__main-header">
          <div className="schedule__main-title">
            <div className="schedule__main-eyebrow">ГРАФИК ПРИЕМА</div>

            <h1>{selectedDoctorName}</h1>
          </div>

          <div className="schedule__main-actions">
            <button
              type="button"
              className="schedule__action-button"
              onClick={goToToday}
            >
              Сегодня
            </button>

            <button
              type="button"
              className="schedule__action-button"
              aria-pressed={calendarView === "week"}
              onClick={() => setCalendarView("week")}
            >
              Неделя
            </button>

            <button
              type="button"
              className="schedule__action-button"
              aria-pressed={calendarView === "day"}
              onClick={() => setCalendarView("day")}
            >
              День
            </button>

            <button
              type="button"
              className="schedule__action-button"
              aria-pressed={calendarView === "month"}
              onClick={() => setCalendarView("month")}
            >
              Месяц
            </button>

            {isAdmin && (
              <button
                type="button"
                className="schedule__action-button btn--prime"
                onClick={() => setCreateScheduleOpen(true)}
              >
                Создать график
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
          <Locale words={ruLocale}>
            <Calendar
              init={setCalendarApi}
              events={filteredEvents}
              date={selectedDate}
              view={calendarView}
              onEventClick={handleEventClick}
              onCellClick={handleCellClick}
              onEventContextMenu={handleContextMenu}
            />

            {calendarApi && editorState.open && (
              <Editor
                api={calendarApi}
                event={editorState.event}
                onSave={handleSaveEvent}
                onClose={closeEditor}
              />
            )}

            {calendarApi && contextMenuState.open && (
              <ContextMenu
                api={calendarApi}
                options={calendarMenuItems.map((item) => ({
                  id: item.id,
                  text: item.text,
                }))}
                onClick={({ action, context }) => {
                  if (action?.id === "edit") {
                    setEditorState({
                      open: true,
                      event: context || contextMenuState.event,
                    });
                  }
                  closeContextMenu();
                }}
              >
                <div />
              </ContextMenu>
            )}
          </Locale>
        </div>
      </main>

      {isAdmin && createScheduleOpen && (
        <CreateSchedule
          doctors={doctors}
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
