import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Editor, ContextMenu } from "@svar-ui/react-calendar";
import "@svar-ui/react-core/style.css";
import "@svar-ui/react-editor/style.css";
import "@svar-ui/react-menu/style.css";
import "@svar-ui/react-toolbar/style.css";
import api from "../api";
import { USER_INFO } from "../constants";
import CreateSchedule from "../components/CreateSchedule";

import "../styles/Schedule.css";

export const Schedule = () => {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin = currentUser?.role === "ADMIN";

  const [events, setEvents] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState(
    isDoctor ? currentUser?.id : "",
  );

  const [editorState, setEditorState] = useState({
    open: false,
    event: null,
  });

  const [contextMenuState, setContextMenuState] = useState({
    open: false,
    event: null,
    point: null,
  });

  const today = useMemo(() => new Date(), []);

  const monthName = today.toLocaleDateString("ru-RU", {
    month: "long",
  });

  const currentMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const currentYear = today.getFullYear();

  const miniCalendarDays = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);

    const firstWeekDay = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const previousMonthDays = new Date(year, month, 0).getDate();

    const result = [];

    for (let i = firstWeekDay - 1; i >= 0; i -= 1) {
      result.push({
        day: previousMonthDays - i,
        outside: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push({
        day,
        outside: false,
        today: day === today.getDate(),
      });
    }

    while (result.length < 42) {
      result.push({
        day: result.length - daysInMonth - firstWeekDay + 1,
        outside: true,
      });
    }

    return result;
  }, [today]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchDoctors = async () => {
      try {
        const doctorsRes = await api.get("doctors/list/");
        setDoctors(doctorsRes.data);
      } catch (err) {
        console.error("Ошибка при загрузке врачей:", err);

        setError(
          err.response?.data?.detail || "Не удалось загрузить список врачей.",
        );
      }
    };
  }, [isAdmin]);

  useEffect(() => {
    const targetDoctorId = isDoctor ? currentUser?.id : selectedDoctorId;

    if (!targetDoctorId) {
      setEvents([]);
      return;
    }

    api
      .get(`/schedule/?doctor_id=${targetDoctorId}`)
      .then((res) => {
        const schedule = Array.isArray(res.data) ? res.data : [];

        const formattedEvents = schedule.map((item) => ({
          id: item.id,

          text: `Пациент: ${
            item.patient_name || "Не указан"
          } (${item.procedure || "Прием"})`,

          start: new Date(item.start_time),
          end: new Date(item.end_time),

          doctorId: Number(item.doctor),
        }));

        setEvents(formattedEvents);
      })
      .catch((err) => {
        console.error("Ошибка загрузки расписания:", err);

        setEvents([]);
      });
  }, [selectedDoctorId, currentUser?.id, isDoctor]);

  const visibleEvents = useMemo(() => {
    if (isDoctor) {
      return events.filter(
        (event) => Number(event.doctorId) === Number(currentUser?.id),
      );
    }

    return events.filter(
      (event) => Number(event.doctorId) === Number(selectedDoctorId),
    );
  }, [events, selectedDoctorId, currentUser?.id, isDoctor]);

  const todayEvents = useMemo(() => {
    return visibleEvents.filter((event) => {
      const eventDate = new Date(event.start);

      return (
        eventDate.getFullYear() === today.getFullYear() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getDate() === today.getDate()
      );
    });
  }, [visibleEvents, today]);

  const bookedCount = todayEvents.length;

  const freeCount = Math.max(0, 12 - bookedCount);

  const selectedDoctor = doctors.find(
    (doctor) => Number(doctor.id) === Number(selectedDoctorId),
  );

  const selectedDoctorName =
    selectedDoctor?.doctor_name || selectedDoctor?.name || "Выберите врача";

  const handleEventClick = (eventObj) => {
    setEditorState({
      open: true,
      event: eventObj,
    });
  };

  const handleCellClick = (date) => {
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

  const handleContextMenu = (event, eventObj) => {
    event.preventDefault();

    setContextMenuState({
      open: true,
      event: eventObj,
      point: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  const handleSaveEvent = async (updatedEvent) => {
    const targetDoctorId = isDoctor
      ? currentUser?.id
      : Number(selectedDoctorId);

    const patientId = Number(updatedEvent.patient_id || updatedEvent.text);

    if (!targetDoctorId) {
      alert("Не выбран врач.");
      return;
    }

    if (!patientId) {
      alert("Не удалось определить пациента.");
      return;
    }

    const payload = {
      doctor_id: Number(targetDoctorId),
      patient_id: patientId,
      appointment_date: new Date(updatedEvent.start).toISOString(),
    };

    try {
      if (updatedEvent.id) {
        await api.post(`/appointments/${updatedEvent.id}/cancel/`, {
          status: "CANCELLED",
        });

        const res = await api.post("/schedule/book/", payload);

        setEvents((prev) =>
          prev.map((event) =>
            event.id === updatedEvent.id
              ? {
                  ...updatedEvent,
                  id: res.data?.log_id || updatedEvent.id,
                  doctorId: Number(targetDoctorId),
                }
              : event,
          ),
        );
      } else {
        const res = await api.post("/schedule/book/", payload);

        setEvents((prev) => [
          ...prev,
          {
            ...updatedEvent,
            id: res.data?.log_id || Date.now(),
            doctorId: Number(targetDoctorId),
          },
        ]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.response?.data ? JSON.stringify(err.response.data) : null) ||
        "Ошибка при сохранении записи.";

      alert(`Не удалось сохранить запись: ${errorMessage}`);
    } finally {
      setEditorState({
        open: false,
        event: null,
      });
    }
  };

  const closeEditor = () => {
    setEditorState({
      open: false,
      event: null,
    });
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
            className="schedule__sidebar-add"
            onClick={() => {
              const now = new Date();

              setEditorState({
                open: true,
                event: {
                  start: now,
                  end: new Date(now.getTime() + 15 * 60 * 1000),
                  text: "",
                },
              });
            }}
            aria-label="Добавить запись"
          >
            +
          </button>
        </div>

        <div className="schedule__mini-calendar">
          <div className="schedule__mini-header">
            <button type="button" className="schedule__mini-arrow">
              ‹
            </button>

            <span>
              {currentMonth} {currentYear}
            </span>

            <button type="button" className="schedule__mini-arrow">
              ›
            </button>
          </div>

          <div className="schedule__weekdays">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="schedule__days">
            {miniCalendarDays.map((item, index) => (
              <button
                type="button"
                key={`${item.day}-${index}`}
                className={[
                  "schedule__day",
                  item.outside ? "is-outside" : "",
                  item.today ? "is-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.day}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="schedule__today-button">
          Сегодня, {today.getDate()}{" "}
          {today.toLocaleDateString("ru-RU", {
            month: "short",
          })}
        </button>

        <div className="schedule__sidebar-section">
          <div className="schedule__section-label">Врач</div>

          {isDoctor ? (
            <div className="schedule__doctor-card">
              <div className="schedule__doctor-avatar">
                {selectedDoctorName.charAt(0).toUpperCase()}
              </div>

              <div className="schedule__doctor-info">
                <div className="schedule__doctor-name">
                  {currentUser?.name ||
                    currentUser?.doctor_name ||
                    "Мой кабинет"}
                </div>

                <div className="schedule__doctor-role">Личный график</div>
              </div>
            </div>
          ) : (
            <select
              className="schedule__doctor-select"
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
            >
              {doctors.length === 0 ? (
                <option value="">Врачи не найдены</option>
              ) : (
                doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.doctor_name || doctor.name || `Д-р ${doctor.id}`}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Quick filter */}

        <div className="schedule__sidebar-section">
          <div className="schedule__section-label">Отображение</div>

          <button type="button" className="schedule__filter-button is-active">
            <span className="schedule__filter-dot" />
            Все записи
          </button>

          <button type="button" className="schedule__filter-button">
            <span className="schedule__filter-dot is-free" />
            Свободные окна
          </button>
        </div>

        {/* Statistics */}

        <div className="schedule__stats">
          <div className="schedule__stat">
            <span className="schedule__stat-value">{bookedCount}</span>

            <span className="schedule__stat-label">Записей сегодня</span>
          </div>

          <div className="schedule__stat">
            <span className="schedule__stat-value">{freeCount}</span>

            <span className="schedule__stat-label">Свободных окон</span>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CALENDAR
          ===================================================== */}

      <main className="schedule__main">
        <div className="schedule__main-header">
          <div className="schedule__main-title">
            <div className="schedule__main-eyebrow">ГРАФИК ПРИЕМА</div>

            <h1>{isDoctor ? "Мое расписание" : selectedDoctorName}</h1>
          </div>

          <div className="schedule__main-actions">
            <button type="button" className="schedule__action-button">
              Сегодня
            </button>

            <button type="button" className="schedule__action-button">
              Неделя
            </button>
          </div>
        </div>

        <div className="schedule__calendar-wrapper">
          <Calendar
            events={visibleEvents}
            mode="week"
            locale={ruLocale}
            onEventClick={handleEventClick}
            onEventContextMenu={handleContextMenu}
            onCellClick={handleCellClick}
          />
        </div>
      </main>

      {/* =====================================================
          EDITOR
          ===================================================== */}

      {editorState.open && (
        <Editor
          event={editorState.event}
          onSave={handleSaveEvent}
          onClose={closeEditor}
        />
      )}

      {/* =====================================================
          CONTEXT MENU
          ===================================================== */}

      {contextMenuState.open && (
        <ContextMenu
          point={contextMenuState.point}
          onClose={closeContextMenu}
          items={[
            {
              id: "edit",
              text: ruLocale.contextMenu.edit,
              action: editFromContextMenu,
            },
          ]}
        />
      )}
      {isAdmin && (
        <div className="schedule__create-menu">
          <label>Создать расписание для врача</label>
          <button>Создать</button>
        </div>
      )}
    </div>
  );
};

export default Schedule;
