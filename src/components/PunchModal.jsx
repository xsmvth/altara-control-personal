import React, { useEffect, useMemo, useState } from "react";
import { currentTimeLabel, timeInputValue, toISODate } from "../lib/date";
import { getOpenPunch } from "../lib/hr";
import { Avatar, Button, Modal, StatusPill } from "./ui";
import { Icon } from "./Icon";

export function PunchModal({
  open,
  onClose,
  employees,
  punches,
  defaultEmployeeId,
  onSubmit,
  title = "Registrar ponche",
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultEmployeeId || "");
  const [action, setAction] = useState("in");
  const [time, setTime] = useState(timeInputValue());
  const [breakMinutes, setBreakMinutes] = useState(30);

  const selected = employees.find((employee) => employee.id === selectedId);
  const openPunch = selected ? getOpenPunch(punches, selected.id) : null;

  useEffect(() => {
    if (!open) return;
    const initialId = defaultEmployeeId || "";
    setSelectedId(initialId);
    setQuery("");
    setTime(timeInputValue());
    setBreakMinutes(30);
    const employeePunch = initialId ? getOpenPunch(punches, initialId) : null;
    setAction(employeePunch ? "out" : "in");
  }, [open, defaultEmployeeId, punches]);

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return employees.filter((employee) => employee.active).slice(0, 8);
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(normalized) ||
        employee.role.toLowerCase().includes(normalized),
    );
  }, [employees, query]);

  function chooseEmployee(employee) {
    setSelectedId(employee.id);
    const punch = getOpenPunch(punches, employee.id);
    setAction(punch ? "out" : "in");
    setBreakMinutes(30);
  }

  function submit(event) {
    event.preventDefault();
    if (!selected) return;
    onSubmit({
      employeeId: selected.id,
      action,
      time,
      breakMinutes: Number(breakMinutes) || 0,
      date: toISODate(),
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={`Hora actual: ${currentTimeLabel()}`}
      size="lg"
    >
      <form className="punch-form" onSubmit={submit}>
        {!defaultEmployeeId && (
          <div className="punch-form__search">
            <label className="field-label" htmlFor="punch-search">Buscar empleado</label>
            <div className="search-field">
              <Icon name="search" size={18} />
              <input
                autoFocus
                id="punch-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre o puesto..."
                value={query}
              />
            </div>
            <div className="employee-pick-list">
              {filteredEmployees.map((employee) => {
                const hasOpen = Boolean(getOpenPunch(punches, employee.id));
                return (
                  <button
                    className={`employee-pick ${selectedId === employee.id ? "is-selected" : ""}`}
                    key={employee.id}
                    onClick={() => chooseEmployee(employee)}
                    type="button"
                  >
                    <Avatar employee={employee} size="sm" />
                    <span>
                      <strong>{employee.name}</strong>
                      <small>{employee.role}</small>
                    </span>
                    <StatusPill dot tone={hasOpen ? "green" : "neutral"}>
                      {hasOpen ? "En turno" : "Fuera"}
                    </StatusPill>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selected && (
          <div className="punch-form__selected">
            <div className="punch-form__employee">
              <Avatar employee={selected} size="lg" />
              <div>
                <span className="eyebrow">{selected.area}</span>
                <h3>{selected.name}</h3>
                <p>{selected.role}</p>
              </div>
            </div>

            <div className="segmented" role="group" aria-label="Tipo de ponche">
              <button
                className={action === "in" ? "is-active" : ""}
                disabled={Boolean(openPunch)}
                onClick={() => setAction("in")}
                type="button"
              >
                <Icon name="clock" size={16} /> Entrada
              </button>
              <button
                className={action === "out" ? "is-active" : ""}
                disabled={!openPunch}
                onClick={() => setAction("out")}
                type="button"
              >
                <Icon name="logOut" size={16} /> Salida
              </button>
            </div>

            {openPunch && (
              <div className="notice notice--soft">
                <Icon name="clock" size={18} />
                <span>
                  Entrada registrada hoy a las <strong>{openPunch.clockIn}</strong>. Selecciona salida para cerrar el turno.
                </span>
              </div>
            )}

            <div className="form-grid form-grid--3">
              <label>
                <span className="field-label">Hora del ponche</span>
                <input
                  className="field-control"
                  onChange={(event) => setTime(event.target.value)}
                  type="time"
                  value={time}
                />
              </label>
              <label>
                <span className="field-label">Pausa</span>
                <select
                  className="field-control"
                  onChange={(event) => setBreakMinutes(event.target.value)}
                  value={breakMinutes}
                >
                  <option value="0">Sin pausa</option>
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                </select>
              </label>
              <div>
                <span className="field-label">Hora de referencia</span>
                <div className="read-only-field">{currentTimeLabel()}</div>
              </div>
            </div>

            <div className="modal__actions">
              {!defaultEmployeeId && (
                <Button onClick={() => setSelectedId("")} type="button" variant="ghost">
                  Cambiar empleado
                </Button>
              )}
              <Button
                disabled={action === "out" && !openPunch}
                icon={action === "in" ? "plus" : "check"}
                type="submit"
              >
                {action === "in" ? "Registrar entrada" : "Registrar salida"}
              </Button>
            </div>
          </div>
        )}

        {!selected && (
          <div className="modal__hint">
            <Icon name="search" size={17} />
            Selecciona una persona para registrar su ponche.
          </div>
        )}
      </form>
    </Modal>
  );
}
