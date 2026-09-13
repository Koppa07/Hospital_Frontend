import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Editor, ContextMenu } from "@svar-ui/react-calendar";

import { ruLocale } from "../locales/ru";
import api from "../api";
import { USER_INFO } from "../constants";

export const Schedule = () => {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin = currentUser?.role === "ADMIN";

  const [events, setEvents] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    isDoctor ? currentUser?.id : "",
  );

  const [editorState, setEditorState] = useState({ open: false, event: null });
  const [contextMenuState, setContextMenuState] = useState({
    open: false,
    event: null,
    point: null,
  });

  useEffect(() => {
    if (isAdmin) {
      api
        .get("/doctors/")
        .then((res) => {
          setDoctors(res.data);
          if (res.data.length > 0) setSelectedDoctorId(res.data[0].id);
        })
        .catch((err) => console.error("Ошибка загрузки списка врачей:", err));
    }
  }, [isAdmin]);

  useEffect(() => {
    const targetDoctorId = isDoctor ? currentUser?.id : selectedDoctorId;
    if (!targetDoctorId) return;

    api
      .get(`/schedule/?doctor_id=${targetDoctorId}`)
      .then((res) => {
        const formattedEvents = res.data.map((item) => ({
          id: item.id,
          text: `Пациент: ${item.patient_name || "Не указан"} (${item.procedure || "Прием"})`,
          start: new Date(item.start_time),
          end: new Date(item.end_time),
          doctorId: item.doctor,
        }));
        setEvents(formattedEvents);
      })
      .catch((err) => console.error("Ошибка загрузки расписания:", err));
  }, [selectedDoctorId, currentUser?.id, isDoctor]);

  const visibleEvents = useMemo(() => {
    if (isDoctor) {
      return events.filter((e) => e.doctorId === currentUser?.id);
    }
    return events.filter((e) => e.doctorId === Number(selectedDoctorId));
  }, [events, selectedDoctorId, currentUser?.id, isDoctor]);

  const handleContextMenu = (e, eventObj) => {
    e.preventDefault();
    setContextMenuState({
      open: true,
      event: eventObj,
      point: { x: e.clientX, y: e.clientY },
    });
  };

  const handleSaveEvent = async (updatedEvent) => {
    const targetDoctorId = isDoctor
      ? currentUser?.id
      : Number(selectedDoctorId);
    const patientId = Number(updatedEvent.patient_id || updatedEvent.text);

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
          prev.map((ev) =>
            ev.id === updatedEvent.id
              ? { ...updatedEvent, doctorId: targetDoctorId }
              : ev,
          ),
        );
      } else {
        const res = await api.post("/schedule/book/", payload);

        setEvents((prev) => [
          ...prev,
          {
            ...updatedEvent,
            id: res.data.log_id || Date.now(),
            doctorId: targetDoctorId,
          },
        ]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        "Ошибка при сохранении записи";

      alert(`Не удалось сохранить запись: ${errorMessage}`);
    } finally {
      setEditorState({ open: false, event: null });
    }
  };

  return (
    <div className="schedule__container" style={{ padding: "20px" }}>
      {isAdmin && (
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>
            Выберите врача:
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "4px" }}
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.doctor_name || `Д-р ${doc.name}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {isDoctor && (
        <h3 style={{ marginBottom: "15px" }}>Мое расписание приемов</h3>
      )}

      <div style={{ height: "calc(100vh - 200px)" }}>
        <Calendar
          events={visibleEvents}
          mode="week"
          locale={ruLocale}
          onEventClick={(ev) => setEditorState({ open: true, event: ev })}
          onEventContextMenu={handleContextMenu}
          onCellClick={(date) => {
            const newEvent = {
              start: date,
              end: new Date(date.getTime() + 15 * 60000),
              text: "",
            };
            setEditorState({ open: true, event: newEvent });
          }}
        />
      </div>

      {editorState.open && (
        <Editor
          event={editorState.event}
          onSave={handleSaveEvent}
          onClose={() => setEditorState({ open: false, event: null })}
        />
      )}

      {contextMenuState.open && (
        <ContextMenu
          point={contextMenuState.point}
          onClose={() =>
            setContextMenuState({ open: false, event: null, point: null })
          }
          items={[
            {
              id: "edit",
              text: ruLocale.contextMenu.edit,
              action: () => {
                setEditorState({ open: true, event: contextMenuState.event });
                setContextMenuState({ open: false, event: null, point: null });
              },
            },
          ]}
        />
      )}
    </div>
  );
};
export default Schedule;
