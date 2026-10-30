import React, { useMemo, useState } from "react";
import { addDays, compactDate, toISODate, weekDates, weekDayName } from "../lib/date";
import { areaMeta } from "../data/seed";
import { getShiftForDate, to12Hour } from "../lib/hr";
import { Avatar, Button, Modal, PageHeader, SectionHeading, StatusPill } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Schedule({ state, onUpdateSchedule, notify }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [area, setArea] = useState("all");
  const [rotationOpen, setRotationOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: "scheduled", start: "09:00", end: "17:00" });

  const dates = weekDates(addDays(new Date(), weekOffset * 7));
  const visibleEmployees = useMemo(
    () =>
      state.employees.filter(
        (employee) => employee.active && (area === "all" || employee.area === area),
      ),
    [state.employees, area],
  );

  function openEditor(employee, weekday) {
    const current = getShiftForDate(state.weekSchedule, employee.id, dates[weekday]);
    setEditing({ employee, weekday });
    setEditForm({
      status: current?.status || "scheduled",
      start: current?.start || "09:00",
      end: current?.end || "17:00",
    });
  }

  function saveSchedule(event) {
    event.preventDefault();
    onUpdateSchedule(editing.employee.id, dates[editing.weekday].getDay(), editForm);
    setEditing(null);
    notify("Horario actualizado", `${editing.employee.name} · ${weekDayName(dates[editing.weekday])}`);
  }

  const rangeLabel = `${compactDate(dates[0])} — ${compactDate(dates[6])}`;

  return (
    <div className="page schedule-page">
      <PageHeader
        meta="Planificación semanal"
        title="Horarios y rotaciones"
        description="Organiza turnos, días libres y cambios sin cruzar nombres en papel."
        actions={
          <>
            <Button icon="download" variant="secondary" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button icon="rotate" onClick={() => setRotationOpen(true)}>
              Nueva rotación
            </Button>
          </>
        }
      />

      <div className="week-toolbar">
        <div className="week-switcher">
          <button aria-label="Semana anterior" onClick={() => setWeekOffset((value) => value - 1)}>
            <Icon name="chevronLeft" size={17} />
          </button>
          <span>
            <strong>{rangeLabel}</strong>
            <small>{weekOffset === 0 ? "Semana actual" : weekOffset > 0 ? `En ${weekOffset} semana${weekOffset > 1 ? "s" : ""}` : `Hace ${Math.abs(weekOffset)} semana${Math.abs(weekOffset) > 1 ? "s" : ""}`}</small>
          </span>
          <button aria-label="Semana siguiente" onClick={() => setWeekOffset((value) => value + 1)}>
            <Icon name="chevronRight" size={17} />
          </button>
          {weekOffset !== 0 && (
            <button className="text-link week-toolbar__today" onClick={() => setWeekOffset(0)}>Hoy</button>
          )}
        </div>
        <div className="week-toolbar__filters">
          <select className="field-control field-control--compact" onChange={(event) => setArea(event.target.value)} value={area}>
            <option value="all">Todas las áreas</option>
            {Object.keys(areaMeta).map((name) => <option key={name}>{name}</option>)}
          </select>
          <span className="schedule-key"><i className="schedule-key__shift" /> Turno <i className="schedule-key__rest" /> Libre</span>
        </div>
      </div>

      <section className="surface schedule-board">
        <div className="schedule-grid">
          <div className="schedule-grid__corner">Empleado</div>
          {dates.map((date, index) => (
            <div
              className={`schedule-grid__day ${toISODate(date) === toISODate(new Date()) ? "is-today" : ""}`}
              key={toISODate(date)}
            >
              <span>{weekDayName(date)}</span>
              <strong>{date.getDate()}</strong>
            </div>
          ))}

          {visibleEmployees.map((employee) => (
            <div className="schedule-employee-row" key={employee.id}>
              <div className="schedule-employee">
                <Avatar employee={employee} size="xs" />
                <span><strong>{employee.name}</strong><small>{employee.area} · Rot. {employee.rotation}</small></span>
              </div>
              {dates.map((date, weekday) => {
                const shift = getShiftForDate(state.weekSchedule, employee.id, date);
                return (
                  <button
                    className={`shift-cell shift-cell--${shift?.status || "rest"}`}
                    key={`${employee.id}-${weekday}`}
                    onClick={() => openEditor(employee, weekday)}
                  >
                    {shift?.status === "scheduled" ? (
                      <>
                        <strong>{to12Hour(shift.start)}</strong>
                        <span>{to12Hour(shift.end)}</span>
                      </>
                    ) : (
                      <>
                        <strong>Libre</strong>
                        <span>Sin turno</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="schedule-notes">
        <div>
          <span className="schedule-notes__icon"><Icon name="rotate" size={19} /></span>
          <div><strong>Rotación activa</strong><p>Los días libres cambian según el grupo A, B o C asignado a cada empleado.</p></div>
        </div>
        <div>
          <span className="schedule-notes__icon"><Icon name="edit" size={19} /></span>
          <div><strong>Ajustes rápidos</strong><p>Toca una celda para cambiar el turno, mover el descanso o registrar un día libre.</p></div>
        </div>
      </section>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar día de trabajo"
        subtitle={editing ? `${editing.employee.name} · ${weekDayName(dates[editing.weekday])} ${dates[editing.weekday].getDate()}` : ""}
      >
        <form onSubmit={saveSchedule}>
          <label>
            <span className="field-label">Estado del día</span>
            <select className="field-control" onChange={(event) => setEditForm((form) => ({ ...form, status: event.target.value }))} value={editForm.status}>
              <option value="scheduled">Turno programado</option>
              <option value="rest">Día libre</option>
              <option value="vacation">Vacaciones</option>
              <option value="absence">Permiso / ausencia</option>
            </select>
          </label>
          {editForm.status === "scheduled" && (
            <div className="form-grid form-grid--2 modal-form-row">
              <label>
                <span className="field-label">Entrada</span>
                <input className="field-control" onChange={(event) => setEditForm((form) => ({ ...form, start: event.target.value }))} type="time" value={editForm.start} />
              </label>
              <label>
                <span className="field-label">Salida</span>
                <input className="field-control" onChange={(event) => setEditForm((form) => ({ ...form, end: event.target.value }))} type="time" value={editForm.end} />
              </label>
            </div>
          )}
          <div className="modal__actions">
            <Button onClick={() => setEditing(null)} type="button" variant="ghost">Cancelar</Button>
            <Button type="submit">Guardar cambio</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={rotationOpen}
        onClose={() => setRotationOpen(false)}
        title="Crear rotación"
        subtitle="La plantilla se aplica a los turnos de la semana visible."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setRotationOpen(false);
            notify("Rotación creada", "La plantilla se guardó correctamente.");
          }}
        >
          <label>
            <span className="field-label">Nombre de la rotación</span>
            <input className="field-control" defaultValue="Rotación de fin de semana" required />
          </label>
          <div className="form-grid form-grid--2 modal-form-row">
            <label>
              <span className="field-label">Área</span>
              <select className="field-control">
                {Object.keys(areaMeta).map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Ciclo</span>
              <select className="field-control"><option>Semanal</option><option>Quincenal</option><option>Mensual</option></select>
            </label>
          </div>
          <div className="notice notice--soft modal-form-row">
            <Icon name="rotate" size={18} />
            <span>El sistema mantendrá la misma cantidad de turnos semanales al aplicar la rotación.</span>
          </div>
          <div className="modal__actions">
            <Button onClick={() => setRotationOpen(false)} type="button" variant="ghost">Cancelar</Button>
            <Button type="submit">Crear rotación</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
