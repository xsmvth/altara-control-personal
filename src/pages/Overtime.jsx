import React, { useMemo, useState } from "react";
import { compactDate, money, toISODate } from "../lib/date";
import { overtimePay, to12Hour } from "../lib/hr";
import { Avatar, Button, EmptyState, Modal, PageHeader, SectionHeading, StatusPill } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Overtime({ state, onChangeStatus, onAddOvertime, notify }) {
  const [tab, setTab] = useState("pending");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: state.employees[0]?.id || "",
    date: toISODate(),
    hours: "1",
    reason: "",
  });

  const items = useMemo(
    () =>
      state.overtime
        .filter((item) => tab === "all" || item.status === tab)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.overtime, tab],
  );

  const chosen = state.employees.find((employee) => employee.id === form.employeeId);
  const preview = chosen
    ? Number(form.hours || 0) * chosen.hourlyRate * state.settings.overtimeMultiplier
    : 0;

  function submit(event) {
    event.preventDefault();
    onAddOvertime({
      id: `ot-${Date.now()}`,
      employeeId: form.employeeId,
      date: form.date,
      hours: Number(form.hours),
      multiplier: state.settings.overtimeMultiplier,
      reason: form.reason || "Horas extras manuales",
      status: "pending",
    });
    setModalOpen(false);
    setForm((current) => ({ ...current, hours: "1", reason: "" }));
    notify("Horas extras registradas", "La solicitud quedó pendiente de aprobación.");
  }

  const pending = state.overtime.filter((item) => item.status === "pending");
  const approved = state.overtime.filter((item) => item.status === "approved");
  const totalApproved = approved.reduce((total, item) => {
    const employee = state.employees.find((person) => person.id === item.employeeId);
    return total + overtimePay(item, employee);
  }, 0);

  return (
    <div className="page overtime-page">
      <PageHeader
        meta="Control de extras"
        title="Horas extras"
        description={`Calculadas con un factor de ${state.settings.overtimeMultiplier}× sobre la tarifa por hora.`}
        actions={<Button icon="plus" onClick={() => setModalOpen(true)}>Registrar horas</Button>}
      />

      <section className="overtime-summary">
        <div className="overtime-summary__primary">
          <span className="eyebrow eyebrow--light">Costo aprobado</span>
          <strong>{money(totalApproved, state.settings.currency)}</strong>
          <p>{approved.reduce((sum, item) => sum + item.hours, 0).toFixed(2)} horas extras listas para nómina.</p>
        </div>
        <div className="overtime-summary__item">
          <span>Por aprobar</span>
          <strong>{pending.length}</strong>
          <small>solicitudes</small>
        </div>
        <div className="overtime-summary__item">
          <span>Tarifa aplicada</span>
          <strong>{state.settings.overtimeMultiplier}×</strong>
          <small>por hora regular</small>
        </div>
      </section>

      <section className="surface overtime-ledger">
        <div className="ledger-head">
          <SectionHeading title="Bitácora de horas extras" subtitle="Historial de trabajo y aprobaciones" />
          <div className="segmented segmented--compact" role="group" aria-label="Filtrar horas extras">
            <button className={tab === "pending" ? "is-active" : ""} onClick={() => setTab("pending")}>Por aprobar</button>
            <button className={tab === "approved" ? "is-active" : ""} onClick={() => setTab("approved")}>Aprobadas</button>
            <button className={tab === "all" ? "is-active" : ""} onClick={() => setTab("all")}>Todas</button>
          </div>
        </div>

        {items.length ? (
          <div className="ledger-list">
            {items.map((item) => {
              const employee = state.employees.find((person) => person.id === item.employeeId);
              return (
                <article className="ledger-row" key={item.id}>
                  <Avatar employee={employee} size="md" />
                  <div className="ledger-row__person">
                    <strong>{employee?.name}</strong>
                    <span>{employee?.role} · {employee?.area}</span>
                  </div>
                  <div className="ledger-row__detail">
                    <span>{compactDate(item.date)}</span>
                    <small>{item.reason}</small>
                  </div>
                  <div className="ledger-row__hours">
                    <strong>{item.hours.toFixed(2)} h</strong>
                    <small>{money(overtimePay(item, employee), state.settings.currency)}</small>
                  </div>
                  <StatusPill tone={item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "orange"}>
                    {item.status === "approved" ? "Aprobada" : item.status === "rejected" ? "Rechazada" : "Pendiente"}
                  </StatusPill>
                  <div className="ledger-row__actions">
                    {item.status === "pending" && (
                      <>
                        <Button
                          icon="check"
                          onClick={() => {
                            onChangeStatus(item.id, "approved");
                            notify("Horas extras aprobadas", `${employee?.name} · ${item.hours} h`);
                          }}
                          size="sm"
                          variant="quiet"
                        >
                          Aprobar
                        </Button>
                        <button
                          aria-label="Rechazar horas extras"
                          className="icon-button icon-button--danger"
                          onClick={() => onChangeStatus(item.id, "rejected")}
                        >
                          <Icon name="x" size={17} />
                        </button>
                      </>
                    )}
                    {item.status !== "pending" && (
                      <button className="icon-button" aria-label="Ver detalle" title="Ver detalle">
                        <Icon name="more" size={18} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="timer" title="No hay registros aquí">
            Cuando agregues o apruebes horas extras, aparecerán en esta sección.
          </EmptyState>
        )}
      </section>

      <div className="overtime-rule">
        <span><Icon name="alert" size={18} /></span>
        <p><strong>Regla aplicada:</strong> se pagan a {state.settings.overtimeMultiplier}× la tarifa por hora después del turno programado. La configuración se puede cambiar en Ajustes.</p>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar horas extras" subtitle="La solicitud quedará pendiente para aprobación.">
        <form onSubmit={submit}>
          <label>
            <span className="field-label">Empleado</span>
            <select className="field-control" onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} value={form.employeeId}>
              {state.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.role}</option>)}
            </select>
          </label>
          <div className="form-grid form-grid--2 modal-form-row">
            <label>
              <span className="field-label">Fecha</span>
              <input className="field-control" onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" value={form.date} />
            </label>
            <label>
              <span className="field-label">Horas</span>
              <input className="field-control" min="0.25" onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))} step="0.25" type="number" value={form.hours} />
            </label>
          </div>
          <label className="modal-form-row">
            <span className="field-label">Motivo</span>
            <input className="field-control" onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Ej. cierre de cocina" value={form.reason} />
          </label>
          <div className="calculation-preview">
            <span>Pago estimado</span>
            <strong>{money(preview, state.settings.currency)}</strong>
            <small>{money(chosen?.hourlyRate || 0, state.settings.currency)}/h · {state.settings.overtimeMultiplier}×</small>
          </div>
          <div className="modal__actions">
            <Button onClick={() => setModalOpen(false)} type="button" variant="ghost">Cancelar</Button>
            <Button type="submit">Guardar solicitud</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
