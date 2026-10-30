import React, { useMemo, useState } from "react";
import { compactDate, durationLabel, money, monthYear, toISODate } from "../lib/date";
import { downloadCsv, minutesForPunch, overtimePay } from "../lib/hr";
import { areaMeta } from "../data/seed";
import { Avatar, Button, Metric, PageHeader, SectionHeading, StatusPill } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Payroll({ state, onApprovePayroll, notify }) {
  const [area, setArea] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      state.employees
        .filter((employee) => employee.active)
        .filter((employee) => area === "all" || employee.area === area)
        .filter((employee) => !query || employee.name.toLowerCase().includes(query.toLowerCase()))
        .map((employee) => {
          const punches = state.punches.filter((punch) => punch.employeeId === employee.id);
          const regularHours = punches.reduce((total, punch) => total + Math.min(minutesForPunch(punch), 480) / 60, 0);
          const overtimeItems = state.overtime.filter(
            (item) => item.employeeId === employee.id && item.status === "approved",
          );
          const overtimeHours = overtimeItems.reduce((total, item) => total + item.hours, 0);
          const overtimeTotal = overtimeItems.reduce((total, item) => total + overtimePay(item, employee), 0);
          const regularPay = regularHours * employee.hourlyRate;
          return {
            employee,
            regularHours,
            overtimeHours,
            regularPay,
            overtimeTotal,
            total: regularPay + overtimeTotal,
          };
        }),
    [state.employees, state.punches, state.overtime, area, query],
  );

  const totals = rows.reduce(
    (accumulator, row) => ({
      regularHours: accumulator.regularHours + row.regularHours,
      overtimeHours: accumulator.overtimeHours + row.overtimeHours,
      regularPay: accumulator.regularPay + row.regularPay,
      overtimeTotal: accumulator.overtimeTotal + row.overtimeTotal,
      total: accumulator.total + row.total,
    }),
    { regularHours: 0, overtimeHours: 0, regularPay: 0, overtimeTotal: 0, total: 0 },
  );

  function exportPayroll() {
    downloadCsv(`nomina-altara-${toISODate()}.csv`, [
      ["Empleado", "Área", "Puesto", "Tarifa por hora", "Horas regulares", "Horas extras", "Pago regular", "Pago extras", "Total"],
      ...rows.map((row) => [
        row.employee.name,
        row.employee.area,
        row.employee.role,
        row.employee.hourlyRate,
        row.regularHours.toFixed(2),
        row.overtimeHours.toFixed(2),
        row.regularPay.toFixed(2),
        row.overtimeTotal.toFixed(2),
        row.total.toFixed(2),
      ]),
    ]);
    notify("Nómina exportada", "El archivo CSV está listo para compartir o abrir en Excel.");
  }

  return (
    <div className="page payroll-page">
      <PageHeader
        meta={`Período · ${monthYear()}`}
        title="Nómina del equipo"
        description="Tarifas, horas regulares y extras reunidas en un solo período."
        actions={
          <>
            <Button icon="download" onClick={exportPayroll} variant="secondary">Exportar</Button>
            <Button
              icon={state.payrollApproved ? "check" : "wallet"}
              onClick={() => {
                onApprovePayroll();
                notify(state.payrollApproved ? "Nómina reabierta" : "Nómina aprobada", state.payrollApproved ? "Puedes seguir ajustando ponches y extras." : "El período quedó listo para pago.");
              }}
              variant={state.payrollApproved ? "secondary" : "primary"}
            >
              {state.payrollApproved ? "Nómina aprobada" : "Procesar nómina"}
            </Button>
          </>
        }
      />

      <section className="payroll-summary">
        <Metric label="Total estimado" value={money(totals.total, state.settings.currency)} detail={`${rows.length} empleados`} />
        <Metric label="Horas regulares" value={`${totals.regularHours.toFixed(1)} h`} detail="Según ponches" />
        <Metric label="Horas extras" value={`${totals.overtimeHours.toFixed(2)} h`} detail={`Factor ${state.settings.overtimeMultiplier}×`} tone="orange" />
        <div className="payroll-status">
          <span className={`payroll-status__icon ${state.payrollApproved ? "is-approved" : ""}`}>
            <Icon name={state.payrollApproved ? "check" : "wallet"} size={20} />
          </span>
          <div>
            <span className="eyebrow">Estado del período</span>
            <strong>{state.payrollApproved ? "Aprobada para pago" : "En revisión"}</strong>
            <small>{state.payrollApproved ? `Cerrada el ${compactDate(new Date())}` : "Completa los pendientes antes de procesar"}</small>
          </div>
        </div>
      </section>

      <section className="surface payroll-table">
        <SectionHeading
          title="Detalle de nómina"
          subtitle="Tarifas en pesos dominicanos por hora"
          action={
            <div className="toolbar toolbar--inline">
              <div className="search-field">
                <Icon name="search" size={17} />
                <input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empleado" value={query} />
              </div>
              <select className="field-control field-control--compact" onChange={(event) => setArea(event.target.value)} value={area}>
                <option value="all">Todas las áreas</option>
                {Object.keys(areaMeta).map((name) => <option key={name}>{name}</option>)}
              </select>
            </div>
          }
        />
        <div className="table-wrap">
          <table className="payroll-data-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Tarifa / h</th>
                <th>Horas reg.</th>
                <th>Horas extra</th>
                <th>Pago regular</th>
                <th>Pago extra</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.employee.id}>
                  <td>
                    <div className="table-person">
                      <Avatar employee={row.employee} size="xs" />
                      <span><strong>{row.employee.name}</strong><small>{row.employee.role}</small></span>
                    </div>
                  </td>
                  <td>{money(row.employee.hourlyRate, state.settings.currency)}</td>
                  <td>{row.regularHours.toFixed(1)} h</td>
                  <td className={row.overtimeHours ? "text-orange" : ""}>{row.overtimeHours.toFixed(2)} h</td>
                  <td>{money(row.regularPay, state.settings.currency)}</td>
                  <td>{money(row.overtimeTotal, state.settings.currency)}</td>
                  <td><strong>{money(row.total, state.settings.currency)}</strong></td>
                  <td>
                    <StatusPill tone={state.payrollApproved ? "green" : "sand"}>
                      {state.payrollApproved ? "Aprobada" : "Borrador"}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2">Total del período</td>
                <td>{totals.regularHours.toFixed(1)} h</td>
                <td>{totals.overtimeHours.toFixed(2)} h</td>
                <td>{money(totals.regularPay, state.settings.currency)}</td>
                <td>{money(totals.overtimeTotal, state.settings.currency)}</td>
                <td>{money(totals.total, state.settings.currency)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="payroll-note">
        <Icon name="alert" size={18} />
        <p>
          Este cálculo usa las horas aprobadas y los ponches registrados. Antes de pagar, verifica retenciones, bonificaciones y reglas laborales aplicables.
        </p>
      </div>
    </div>
  );
}
