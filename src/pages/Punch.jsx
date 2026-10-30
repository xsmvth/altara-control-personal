import React, { useMemo, useState } from "react";
import { currentTimeLabel, dateLabel, durationLabel, toISODate } from "../lib/date";
import { getOpenPunch, getTodayShift, minutesForPunch, to12Hour } from "../lib/hr";
import { areaMeta } from "../data/seed";
import { Avatar, Button, PageHeader, SectionHeading, StatusPill } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Punch({ state, onOpenPunch }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [area, setArea] = useState("all");
  const today = toISODate();

  const activeIds = new Set(
    state.punches
      .filter((punch) => punch.date === today && punch.status === "open")
      .map((punch) => punch.employeeId),
  );

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.employees.filter((employee) => {
      const matchesQuery =
        !normalized ||
        employee.name.toLowerCase().includes(normalized) ||
        employee.role.toLowerCase().includes(normalized);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && activeIds.has(employee.id)) ||
        (filter === "off" && !activeIds.has(employee.id));
      const matchesArea = area === "all" || employee.area === area;
      return employee.active && matchesQuery && matchesFilter && matchesArea;
    });
  }, [state.employees, query, filter, area, activeIds]);

  const todaysPunches = state.punches
    .filter((punch) => punch.date === today)
    .sort((a, b) => (b.clockIn || "").localeCompare(a.clockIn || ""));

  return (
    <div className="page punch-page">
      <PageHeader
        meta={dateLabel()}
        title="Control de ponche"
        description="Un toque para registrar entrada o salida. Las horas trabajadas se calculan automáticamente."
        actions={<Button icon="plus" onClick={() => onOpenPunch()}>Nuevo ponche</Button>}
      />

      <section className="terminal-banner">
        <div className="terminal-banner__clock">
          <span className="eyebrow eyebrow--light">Reloj del restaurante</span>
          <strong>{currentTimeLabel()}</strong>
          <small>America/Santo_Domingo</small>
        </div>
        <div className="terminal-banner__stats">
          <div>
            <strong>{activeIds.size}</strong>
            <span>en turno</span>
          </div>
          <div>
            <strong>{state.employees.length - activeIds.size}</strong>
            <span>sin ponche</span>
          </div>
          <div>
            <strong>{todaysPunches.filter((punch) => punch.status === "closed").length}</strong>
            <span>salidas</span>
          </div>
        </div>
        <Button icon="clock" onClick={() => onOpenPunch()} variant="cream">
          Abrir terminal
        </Button>
      </section>

      <section className="surface punch-directory">
        <div className="toolbar">
          <div className="search-field search-field--wide">
            <Icon name="search" size={18} />
            <input
              aria-label="Buscar empleado"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o puesto"
              value={query}
            />
          </div>
          <div className="segmented segmented--compact" role="group" aria-label="Filtrar por estado">
            <button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>
              Todos
            </button>
            <button className={filter === "active" ? "is-active" : ""} onClick={() => setFilter("active")}>
              En turno
            </button>
            <button className={filter === "off" ? "is-active" : ""} onClick={() => setFilter("off")}>
              Fuera
            </button>
          </div>
          <select
            aria-label="Filtrar por área"
            className="field-control field-control--compact"
            onChange={(event) => setArea(event.target.value)}
            value={area}
          >
            <option value="all">Todas las áreas</option>
            {Object.keys(areaMeta).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="employee-punch-grid">
          {filteredEmployees.map((employee) => {
            const openPunch = getOpenPunch(state.punches, employee.id);
            const shift = getTodayShift(state.weekSchedule, employee.id);
            return (
              <button
                className={`employee-punch-card ${openPunch ? "is-active" : ""}`}
                key={employee.id}
                onClick={() => onOpenPunch(employee.id)}
              >
                <div className="employee-punch-card__top">
                  <Avatar employee={employee} size="lg" />
                  <StatusPill dot tone={openPunch ? "green" : shift?.status === "rest" ? "neutral" : "sand"}>
                    {openPunch ? "En turno" : shift?.status === "rest" ? "Libre" : "Fuera"}
                  </StatusPill>
                </div>
                <div className="employee-punch-card__identity">
                  <strong>{employee.name}</strong>
                  <span>{employee.role}</span>
                </div>
                <div className="employee-punch-card__footer">
                  <span
                    className="area-dot"
                    style={{ "--area-color": areaMeta[employee.area].color }}
                  >
                    {employee.area}
                  </span>
                  <span>{openPunch ? `Desde ${to12Hour(openPunch.clockIn)}` : shift?.status === "scheduled" ? `${to12Hour(shift.start)} – ${to12Hour(shift.end)}` : "Día libre"}</span>
                </div>
              </button>
            );
          })}
        </div>

        {!filteredEmployees.length && (
          <div className="empty-inline">
            <Icon name="search" size={18} />
            No encontramos empleados con esos filtros.
          </div>
        )}
      </section>

      <section className="surface punch-log">
        <SectionHeading
          title="Actividad de hoy"
          subtitle={`${todaysPunches.length} ponches registrados`}
          action={<StatusPill tone="green" dot>En vivo</StatusPill>}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Pausa</th>
                <th>Horas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {todaysPunches.map((punch) => {
                const employee = state.employees.find((person) => person.id === punch.employeeId);
                return (
                  <tr key={punch.id}>
                    <td>
                      <div className="table-person">
                        <Avatar employee={employee} size="xs" />
                        <span><strong>{employee?.name}</strong><small>{employee?.role}</small></span>
                      </div>
                    </td>
                    <td>{to12Hour(punch.clockIn)}</td>
                    <td>{punch.clockOut ? to12Hour(punch.clockOut) : "—"}</td>
                    <td>{punch.breakMinutes} min</td>
                    <td>{punch.status === "closed" ? durationLabel(minutesForPunch(punch)) : "En curso"}</td>
                    <td>
                      <StatusPill tone={punch.status === "open" ? "green" : "neutral"}>
                        {punch.status === "open" ? "En turno" : "Completado"}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
