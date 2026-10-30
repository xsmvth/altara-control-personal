import React, { useState } from "react";
import { compactDate, daysBetween, money, toISODate } from "../lib/date";
import { Avatar, Button, Modal, PageHeader, ProgressBar, SectionHeading, StatusPill } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Vacation({ state, onAddVacation, onApproveVacation, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    employeeId: state.employees[0]?.id || "",
    startDate: toISODate(),
    endDate: toISODate(),
    note: "",
  });

  const filtered = state.employees.filter(
    (employee) =>
      employee.active &&
      (!query || employee.name.toLowerCase().includes(query.toLowerCase())),
  );
  const usedDays = (employee) => 14 - employee.vacationAvailable;
  const pending = state.vacationRequests.filter((request) => request.status === "pending");

  function submit(event) {
    event.preventDefault();
    onAddVacation({
      id: `vac-${Date.now()}`,
      employeeId: form.employeeId,
      startDate: form.startDate,
      endDate: form.endDate,
      days: daysBetween(form.startDate, form.endDate),
      note: form.note || "Solicitud de vacaciones",
      status: "pending",
    });
    setModalOpen(false);
    notify("Solicitud creada", "Quedó pendiente de aprobación en el calendario del equipo.");
  }

  return (
    <div className="page vacation-page">
      <PageHeader
        meta="Balance anual"
        title="Vacaciones y días libres"
        description="Consulta balances, aprueba ausencias y evita choques de cobertura."
        actions={<Button icon="plus" onClick={() => setModalOpen(true)}>Solicitar vacaciones</Button>}
      />

      <section className="vacation-overview">
        <div className="vacation-overview__headline">
          <span className="eyebrow eyebrow--light">Equipo Altara</span>
          <strong>Tu equipo tiene</strong>
          <h2>{state.employees.reduce((sum, employee) => sum + employee.vacationAvailable, 0)} días disponibles</h2>
          <p>Un balance claro para planificar la operación sin interrupciones.</p>
        </div>
        <div className="vacation-overview__stat">
          <span>Solicitudes pendientes</span>
          <strong>{pending.length}</strong>
          <small>por revisar</small>
        </div>
        <div className="vacation-overview__stat">
          <span>Vacaciones aprobadas</span>
          <strong>{state.vacationRequests.filter((request) => request.status === "approved").length}</strong>
          <small>próximas</small>
        </div>
      </section>

      <div className="vacation-layout">
        <section className="surface vacation-balances">
          <SectionHeading
            title="Balance por empleado"
            subtitle="Base anual de 14 días · actualización proporcional"
            action={
              <div className="search-field">
                <Icon name="search" size={17} />
                <input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empleado" value={query} />
              </div>
            }
          />
          <div className="vacation-table">
            {filtered.map((employee) => (
              <div className="vacation-row" key={employee.id}>
                <Avatar employee={employee} size="sm" />
                <div className="vacation-row__person">
                  <strong>{employee.name}</strong>
                  <small>{employee.area} · Ingreso {compactDate(employee.hireDate)}</small>
                </div>
                <div className="vacation-row__progress">
                  <span><strong>{employee.vacationAvailable}</strong> / 14 días</span>
                  <ProgressBar value={employee.vacationAvailable} max={14} />
                </div>
                <div className="vacation-row__used">
                  <span>Usados</span>
                  <strong>{usedDays(employee)} días</strong>
                </div>
                <StatusPill tone={employee.vacationAvailable < 3 ? "orange" : "green"}>
                  {employee.vacationAvailable < 3 ? "Balance bajo" : "Disponible"}
                </StatusPill>
              </div>
            ))}
          </div>
        </section>

        <aside className="vacation-side">
          <section className="surface vacation-requests">
            <SectionHeading title="Solicitudes próximas" subtitle="Vacaciones y permisos" />
            <div className="request-list">
              {state.vacationRequests.map((request) => {
                const employee = state.employees.find((person) => person.id === request.employeeId);
                return (
                  <article className="vacation-request" key={request.id}>
                    <div className="vacation-request__head">
                      <Avatar employee={employee} size="sm" />
                      <div><strong>{employee?.name}</strong><small>{request.note}</small></div>
                      <StatusPill tone={request.status === "approved" ? "green" : "orange"}>
                        {request.status === "approved" ? "Aprobada" : "Pendiente"}
                      </StatusPill>
                    </div>
                    <div className="vacation-request__dates">
                      <span><Icon name="calendar" size={16} />{compactDate(request.startDate)} — {compactDate(request.endDate)}</span>
                      <strong>{request.days} días</strong>
                    </div>
                    {request.status === "pending" && (
                      <div className="vacation-request__actions">
                        <Button
                          icon="check"
                          onClick={() => {
                            onApproveVacation(request.id);
                            notify("Solicitud aprobada", `${employee?.name} · ${request.days} días`);
                          }}
                          size="sm"
                          variant="quiet"
                        >
                          Aprobar
                        </Button>
                        <Button size="sm" variant="ghost">Revisar</Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <div className="policy-note">
            <Icon name="sun" size={20} />
            <div>
              <strong>Cálculo de balance</strong>
              <p>La base anual de 14 días se muestra como referencia y puede ajustarse según antigüedad y política interna.</p>
            </div>
          </div>
        </aside>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva solicitud de vacaciones" subtitle="Después de crearla, quedará pendiente de aprobación.">
        <form onSubmit={submit}>
          <label>
            <span className="field-label">Empleado</span>
            <select className="field-control" onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} value={form.employeeId}>
              {state.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.vacationAvailable} días disponibles</option>)}
            </select>
          </label>
          <div className="form-grid form-grid--2 modal-form-row">
            <label>
              <span className="field-label">Desde</span>
              <input className="field-control" onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} type="date" value={form.startDate} />
            </label>
            <label>
              <span className="field-label">Hasta</span>
              <input className="field-control" onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} type="date" value={form.endDate} />
            </label>
          </div>
          <label className="modal-form-row">
            <span className="field-label">Nota para el equipo</span>
            <textarea className="field-control" onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Motivo o notas de cobertura" rows="3" value={form.note} />
          </label>
          <div className="calculation-preview">
            <span>Días solicitados</span>
            <strong>{daysBetween(form.startDate, form.endDate)} días</strong>
            <small>El balance se valida al aprobar</small>
          </div>
          <div className="modal__actions">
            <Button onClick={() => setModalOpen(false)} type="button" variant="ghost">Cancelar</Button>
            <Button type="submit">Crear solicitud</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
