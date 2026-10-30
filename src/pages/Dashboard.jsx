import React, { useEffect, useMemo, useState } from "react";
import {
  currentTimeLabel,
  dateLabel,
  durationLabel,
  money,
  shortDate,
  timeToMinutes,
  toISODate,
  weekDates,
} from "../lib/date";
import {
  getOpenPunch,
  getShiftForDate,
  overtimePay,
  to12Hour,
} from "../lib/hr";
import { Avatar, Button, Metric, PageHeader, SectionHeading, StatusPill } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Dashboard({ state, onOpenPunch, onNavigate, onApproveOvertime }) {
  const [now, setNow] = useState(new Date());
  const today = toISODate();

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const employees = state.employees;
  const onClock = state.punches
    .filter((punch) => punch.date === today && punch.status === "open")
    .map((punch) => ({
      punch,
      employee: employees.find((employee) => employee.id === punch.employeeId),
    }))
    .filter((entry) => entry.employee);

  const scheduledToday = employees.filter(
    (employee) => getShiftForDate(state.weekSchedule, employee.id, now)?.status === "scheduled",
  );
  const missingPunch = scheduledToday.filter(
    (employee) => !state.punches.some((punch) => punch.date === today && punch.employeeId === employee.id),
  );
  const pendingOvertime = state.overtime.filter((item) => item.status === "pending");
  const approvedOvertime = state.overtime.filter((item) => item.status === "approved");
  const overtimeCost = approvedOvertime.reduce((total, item) => {
    const employee = employees.find((person) => person.id === item.employeeId);
    return total + overtimePay(item, employee);
  }, 0);

  const week = weekDates(now);
  const days = week.map((date) => {
    const assigned = employees.filter(
      (employee) => getShiftForDate(state.weekSchedule, employee.id, date)?.status === "scheduled",
    );
    return {
      date,
      assigned,
      isToday: toISODate(date) === today,
    };
  });

  const nextVacations = useMemo(
    () =>
      [...state.vacationRequests]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 2),
    [state.vacationRequests],
  );

  return (
    <div className="page dashboard-page">
      <PageHeader
        meta={dateLabel(now)}
        title="El turno de hoy, de un vistazo."
        description="Ponches, asistencia y horas extras sin papeles."
        actions={
          <>
            <Button variant="secondary" onClick={() => onNavigate("horarios")}>
              Ver horario
            </Button>
            <Button icon="plus" onClick={() => onOpenPunch()}>
              Registrar ponche
            </Button>
          </>
        }
      />

      <section className="dashboard-hero">
        <div className="punch-spotlight">
          <div className="punch-spotlight__top">
            <div>
              <span className="eyebrow eyebrow--light">Ponche de hoy</span>
              <h2>
                {onClock.length} <span>personas en turno</span>
              </h2>
            </div>
            <div className="live-clock">
              <span>{currentTimeLabel(now)}</span>
              <small>Hora local</small>
            </div>
          </div>
          <div className="punch-spotlight__body">
            <div className="on-clock-avatars">
              {onClock.slice(0, 6).map(({ employee }) => (
                <Avatar employee={employee} key={employee.id} size="md" />
              ))}
              {onClock.length > 6 && <span className="avatar avatar--md avatar--more">+{onClock.length - 6}</span>}
            </div>
            <p>
              {missingPunch.length
                ? `${missingPunch.length} personas del horario aún no han registrado entrada.`
                : "Todo el equipo programado ya registró su entrada."}
            </p>
          </div>
          <div className="punch-spotlight__footer">
            <button className="punch-action" onClick={() => onOpenPunch()}>
              <span>
                <Icon name="clock" size={18} />
                Abrir terminal de ponche
              </span>
              <Icon name="arrowUpRight" size={20} />
            </button>
            <span className="punch-spotlight__note">
              <Icon name="check" size={15} /> Sincronizado localmente
            </span>
          </div>
        </div>

        <div className="pending-panel">
          <SectionHeading
            title="Necesita tu atención"
            subtitle="Acciones pendientes de hoy"
          />
          <div className="attention-list">
            <button className="attention-row" onClick={() => onNavigate("horas-extras")}>
              <span className="attention-row__icon attention-row__icon--orange">
                <Icon name="timer" size={18} />
              </span>
              <span>
                <strong>{pendingOvertime.length} horas extras por aprobar</strong>
                <small>Revisa y confirma antes de nómina</small>
              </span>
              <Icon name="chevronRight" size={17} />
            </button>
            <button className="attention-row" onClick={() => onOpenPunch()}>
              <span className="attention-row__icon">
                <Icon name="clock" size={18} />
              </span>
              <span>
                <strong>{missingPunch.length} entradas pendientes</strong>
                <small>{missingPunch.slice(0, 2).map((person) => person.name.split(" ")[0]).join(", ") || "Sin pendientes"}</small>
              </span>
              <Icon name="chevronRight" size={17} />
            </button>
            <button className="attention-row" onClick={() => onNavigate("vacaciones")}>
              <span className="attention-row__icon attention-row__icon--sand">
                <Icon name="sun" size={18} />
              </span>
              <span>
                <strong>
                  {state.vacationRequests.filter((request) => request.status === "pending").length} solicitudes de vacaciones
                </strong>
                <small>Hay fechas por confirmar</small>
              </span>
              <Icon name="chevronRight" size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="metrics-band">
        <Metric
          label="Programados hoy"
          value={`${scheduledToday.length} personas`}
          detail={`${employees.length} en nómina`}
        />
        <Metric
          label="En turno ahora"
          value={`${onClock.length}`}
          detail={`${missingPunch.length} por entrar`}
          tone="green"
        />
        <Metric
          label="Horas extras aprobadas"
          value={`${approvedOvertime.reduce((sum, item) => sum + item.hours, 0).toFixed(2)} h`}
          detail="Semana actual"
        />
        <Metric
          label="Costo de extras"
          value={money(overtimeCost, state.settings.currency)}
          detail="Solo aprobadas"
          tone="orange"
        />
      </section>

      <div className="dashboard-grid">
        <section className="surface schedule-snapshot">
          <SectionHeading
            title="Esta semana"
            subtitle="Dotación programada por día"
            action={
              <button className="text-link" onClick={() => onNavigate("horarios")}>
                Ver horario <Icon name="arrowUpRight" size={15} />
              </button>
            }
          />
          <div className="week-staffing">
            {days.map((day) => {
              const max = Math.max(...days.map((entry) => entry.assigned.length), 1);
              return (
                <div className={`staffing-day ${day.isToday ? "is-today" : ""}`} key={toISODate(day.date)}>
                  <span className="staffing-day__name">{shortDate(day.date)}</span>
                  <div className="staffing-day__bars" aria-label={`${day.assigned.length} personas programadas`}>
                    {Array.from({ length: Math.min(day.assigned.length, 10) }, (_, index) => (
                      <i
                        key={index}
                        style={{
                          height: `${36 + ((index + day.assigned.length) % 4) * 8}px`,
                          opacity: 0.56 + index / Math.max(max, 12),
                        }}
                      />
                    ))}
                  </div>
                  <strong>{day.assigned.length}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface overtime-snapshot">
          <SectionHeading
            title="Horas extras recientes"
            subtitle="Pendientes de aprobación"
            action={
              <button className="text-link" onClick={() => onNavigate("horas-extras")}>
                Ver todas <Icon name="arrowUpRight" size={15} />
              </button>
            }
          />
          <div className="compact-list">
            {pendingOvertime.slice(0, 3).map((item) => {
              const employee = employees.find((person) => person.id === item.employeeId);
              return (
                <div className="compact-person" key={item.id}>
                  <Avatar employee={employee} size="sm" />
                  <div>
                    <strong>{employee?.name}</strong>
                    <small>{item.reason}</small>
                  </div>
                  <span className="compact-person__value">
                    <strong>{item.hours.toFixed(2)} h</strong>
                    <small>{money(overtimePay(item, employee), state.settings.currency)}</small>
                  </span>
                  <Button
                    aria-label={`Aprobar horas extras de ${employee?.name}`}
                    icon="check"
                    onClick={() => onApproveOvertime(item.id)}
                    size="sm"
                    variant="quiet"
                  >
                    Aprobar
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="dashboard-grid dashboard-grid--bottom">
        <section className="surface team-today">
          <SectionHeading
            title="Equipo en turno"
            subtitle="Entradas activas y tiempo transcurrido"
            action={<StatusPill tone="green" dot>En vivo</StatusPill>}
          />
          <div className="team-today__list">
            {onClock.slice(0, 5).map(({ employee, punch }) => {
              const elapsed = Math.max(
                0,
                now.getHours() * 60 + now.getMinutes() - timeToMinutes(punch.clockIn),
              );
              return (
                <div className="team-person" key={employee.id}>
                  <Avatar employee={employee} size="sm" />
                  <div>
                    <strong>{employee.name}</strong>
                    <small>{employee.role}</small>
                  </div>
                  <span>{to12Hour(punch.clockIn)}</span>
                  <StatusPill tone="green">{durationLabel(elapsed)}</StatusPill>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface upcoming-card">
          <SectionHeading title="Próximas ausencias" subtitle="Vacaciones y permisos" />
          <div className="absence-list">
            {nextVacations.map((request) => {
              const employee = employees.find((person) => person.id === request.employeeId);
              return (
                <div className="absence-row" key={request.id}>
                  <Avatar employee={employee} size="sm" />
                  <div>
                    <strong>{employee?.name}</strong>
                    <small>{shortDate(request.startDate)} — {shortDate(request.endDate)} · {request.days} días</small>
                  </div>
                  <StatusPill tone={request.status === "approved" ? "green" : "orange"}>
                    {request.status === "approved" ? "Aprobada" : "Pendiente"}
                  </StatusPill>
                </div>
              );
            })}
          </div>
          <button className="inspection-note" onClick={() => onNavigate("reportes")}>
            <span>
              <Icon name="chart" size={18} />
              <strong>Reporte semanal listo</strong>
              <small>Asistencia, extras y puntualidad</small>
            </span>
            <Icon name="arrowUpRight" size={18} />
          </button>
        </section>
      </div>
    </div>
  );
}
