import React, { useMemo, useState } from "react";
import { addDays, compactDate, durationLabel, money, shortDate, toISODate } from "../lib/date";
import { downloadCsv, getShiftForDate, minutesForPunch, overtimeHoursForPunch } from "../lib/hr";
import { areaMeta } from "../data/seed";
import { Avatar, Button, PageHeader, SectionHeading, StatusPill } from "../components/ui";

export default function Reports({ state, notify }) {
  const [days, setDays] = useState("7");
  const [area, setArea] = useState("all");
  const start = toISODate(addDays(new Date(), -(Number(days) - 1)));
  const today = toISODate();

  const filteredPunches = useMemo(
    () =>
      state.punches
        .filter((punch) => punch.date >= start && punch.date <= today)
        .filter((punch) => {
          const employee = state.employees.find((person) => person.id === punch.employeeId);
          return area === "all" || employee?.area === area;
        })
        .sort((a, b) => b.date.localeCompare(a.date) || a.clockIn.localeCompare(b.clockIn)),
    [state.punches, state.employees, start, today, area],
  );

  const totalMinutes = filteredPunches.reduce((total, punch) => total + minutesForPunch(punch), 0);
  const totalOvertime = filteredPunches.reduce((total, punch) => total + overtimeHoursForPunch(punch), 0);
  const totalPay = filteredPunches.reduce((total, punch) => {
    const employee = state.employees.find((person) => person.id === punch.employeeId);
    return total + (minutesForPunch(punch) / 60) * (employee?.hourlyRate || 0);
  }, 0);

  const chartDays = Array.from({ length: Math.min(Number(days), 14) }, (_, index) =>
    addDays(new Date(), index - (Math.min(Number(days), 14) - 1)),
  );
  const chartData = chartDays.map((date) => {
    const iso = toISODate(date);
    const minutes = state.punches
      .filter((punch) => punch.date === iso)
      .reduce((total, punch) => total + minutesForPunch(punch), 0);
    return { date, minutes, hours: minutes / 60 };
  });
  const chartMax = Math.max(...chartData.map((entry) => entry.hours), 1);

  function exportReport() {
    downloadCsv(`reporte-asistencia-${today}.csv`, [
      ["Fecha", "Empleado", "Área", "Entrada", "Salida", "Pausa", "Horas", "Horas extras", "Estado"],
      ...filteredPunches.map((punch) => {
        const employee = state.employees.find((person) => person.id === punch.employeeId);
        return [
          punch.date,
          employee?.name,
          employee?.area,
          punch.clockIn,
          punch.clockOut || "",
          punch.breakMinutes,
          (minutesForPunch(punch) / 60).toFixed(2),
          overtimeHoursForPunch(punch).toFixed(2),
          punch.status === "open" ? "En turno" : "Completado",
        ];
      }),
    ]);
    notify("Reporte exportado", "Se descargó el archivo CSV con el período seleccionado.");
  }

  return (
    <div className="page reports-page">
      <PageHeader
        meta="Informe operativo"
        title="Reportes del equipo"
        description="Asistencia, puntualidad y horas extras en un reporte listo para imprimir."
        actions={
          <>
            <Button icon="printer" onClick={() => window.print()} variant="secondary">Imprimir</Button>
            <Button icon="download" onClick={exportReport}>Exportar</Button>
          </>
        }
      />

      <section className="report-controls">
        <div>
          <span className="eyebrow">Período</span>
          <div className="segmented segmented--compact">
            <button className={days === "7" ? "is-active" : ""} onClick={() => setDays("7")}>7 días</button>
            <button className={days === "14" ? "is-active" : ""} onClick={() => setDays("14")}>14 días</button>
            <button className={days === "30" ? "is-active" : ""} onClick={() => setDays("30")}>30 días</button>
          </div>
        </div>
        <div>
          <span className="eyebrow">Área</span>
          <select className="field-control field-control--compact" onChange={(event) => setArea(event.target.value)} value={area}>
            <option value="all">Todas las áreas</option>
            {Object.keys(areaMeta).map((name) => <option key={name}>{name}</option>)}
          </select>
        </div>
        <span className="report-controls__range">{compactDate(start)} — {compactDate(today)}</span>
      </section>

      <section className="report-stats">
        <div><span>Horas trabajadas</span><strong>{totalMinutes ? durationLabel(totalMinutes) : "0 h"}</strong><small>{filteredPunches.length} ponches</small></div>
        <div><span>Horas extras</span><strong>{totalOvertime.toFixed(2)} h</strong><small>después del turno</small></div>
        <div><span>Costo estimado</span><strong>{money(totalPay, state.settings.currency)}</strong><small>tarifa regular</small></div>
        <div><span>Cumplimiento</span><strong>{Math.min(100, Math.round((filteredPunches.filter((punch) => punch.clockIn).length / Math.max(filteredPunches.length, 1)) * 100))}%</strong><small>ponches registrados</small></div>
      </section>

      <section className="surface report-chart">
        <SectionHeading
          title="Horas trabajadas por día"
          subtitle={`Total del período: ${(totalMinutes / 60).toFixed(1)} horas`}
          action={<StatusPill tone="green">Datos del sistema</StatusPill>}
        />
        <div className="bar-chart">
          {chartData.map((entry) => (
            <div className="bar-chart__column" key={toISODate(entry.date)}>
              <span className="bar-chart__value">{entry.hours.toFixed(1)} h</span>
              <div className="bar-chart__track">
                <i style={{ height: `${Math.max(4, (entry.hours / chartMax) * 100)}%` }} />
              </div>
              <span className="bar-chart__label">{shortDate(entry.date)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="surface report-table">
        <SectionHeading title="Detalle de asistencia" subtitle="Registros del período seleccionado" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Empleado</th>
                <th>Área</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Extras</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPunches.map((punch) => {
                const employee = state.employees.find((person) => person.id === punch.employeeId);
                return (
                  <tr key={punch.id}>
                    <td>{compactDate(punch.date)}</td>
                    <td>
                      <div className="table-person">
                        <Avatar employee={employee} size="xs" />
                        <span><strong>{employee?.name}</strong><small>{employee?.role}</small></span>
                      </div>
                    </td>
                    <td><span className="area-text" style={{ "--area-color": areaMeta[employee?.area]?.color }}>{employee?.area}</span></td>
                    <td>{punch.clockIn}</td>
                    <td>{punch.clockOut || "—"}</td>
                    <td>{durationLabel(minutesForPunch(punch))}</td>
                    <td className={overtimeHoursForPunch(punch) ? "text-orange" : ""}>
                      {overtimeHoursForPunch(punch) ? `${overtimeHoursForPunch(punch).toFixed(2)} h` : "—"}
                    </td>
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
