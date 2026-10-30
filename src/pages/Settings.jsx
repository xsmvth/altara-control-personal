import React, { useState } from "react";
import { Button, PageHeader, SectionHeading } from "../components/ui";
import { Icon } from "../components/Icon";

export default function Settings({ state, onSave, notify }) {
  const [form, setForm] = useState(state.settings);

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      overtimeMultiplier: Number(form.overtimeMultiplier),
      weeklyHours: Number(form.weeklyHours),
      roundingMinutes: Number(form.roundingMinutes),
      breakMinutes: Number(form.breakMinutes),
    });
    notify("Ajustes guardados", "Las reglas de cálculo se aplicarán a los próximos registros.");
  }

  return (
    <div className="page settings-page">
      <PageHeader
        meta="Configuración"
        title="Reglas del restaurante"
        description="Ajusta la operación sin tocar fórmulas ni hojas de cálculo."
      />

      <form className="settings-layout" onSubmit={submit}>
        <div className="settings-main">
          <section className="surface settings-section">
            <SectionHeading title="Información del negocio" subtitle="Datos que aparecen en reportes y documentos" />
            <div className="form-grid form-grid--2">
              <label>
                <span className="field-label">Nombre del restaurante</span>
                <input className="field-control" onChange={(event) => setForm((current) => ({ ...current, restaurantName: event.target.value }))} value={form.restaurantName} />
              </label>
              <label>
                <span className="field-label">Teléfono</span>
                <input className="field-control" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
              </label>
              <label>
                <span className="field-label">Dirección</span>
                <input className="field-control" onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} value={form.address} />
              </label>
              <label>
                <span className="field-label">Zona horaria</span>
                <select className="field-control" onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} value={form.timezone}>
                  <option value="America/Santo_Domingo">Santo Domingo (GMT-4)</option>
                </select>
              </label>
            </div>
          </section>

          <section className="surface settings-section">
            <SectionHeading title="Jornada y horas extras" subtitle="Reglas usadas por el cálculo automático" />
            <div className="form-grid form-grid--2">
              <label>
                <span className="field-label">Jornada semanal regular</span>
                <div className="input-suffix"><input className="field-control" min="1" onChange={(event) => setForm((current) => ({ ...current, weeklyHours: event.target.value }))} type="number" value={form.weeklyHours} /><span>horas</span></div>
              </label>
              <label>
                <span className="field-label">Factor de hora extra</span>
                <div className="input-suffix"><input className="field-control" min="1" onChange={(event) => setForm((current) => ({ ...current, overtimeMultiplier: event.target.value }))} step="0.05" type="number" value={form.overtimeMultiplier} /><span>×</span></div>
              </label>
              <label>
                <span className="field-label">Pausa predeterminada</span>
                <select className="field-control" onChange={(event) => setForm((current) => ({ ...current, breakMinutes: event.target.value }))} value={form.breakMinutes}>
                  <option value="0">Sin pausa</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option>
                </select>
              </label>
              <label>
                <span className="field-label">Redondeo del ponche</span>
                <select className="field-control" onChange={(event) => setForm((current) => ({ ...current, roundingMinutes: event.target.value }))} value={form.roundingMinutes}>
                  <option value="0">Minuto exacto</option><option value="5">Cada 5 minutos</option><option value="10">Cada 10 minutos</option><option value="15">Cada 15 minutos</option>
                </select>
              </label>
            </div>
            <label className="settings-full-field">
              <span className="field-label">¿Cuándo comienza la hora extra?</span>
              <select className="field-control" onChange={(event) => setForm((current) => ({ ...current, overtimeMode: event.target.value }))} value={form.overtimeMode}>
                <option>Después del turno programado</option>
                <option>Después de 8 horas diarias</option>
                <option>Después de la jornada semanal</option>
              </select>
            </label>
            <div className="notice notice--soft modal-form-row">
              <Icon name="alert" size={18} />
              <span>El factor actual es {form.overtimeMultiplier}×. Revisa que coincida con tu política interna y la legislación aplicable.</span>
            </div>
          </section>

          <section className="surface settings-section">
            <SectionHeading title="Notificaciones operativas" subtitle="Alertas para administración" />
            <label className="toggle-row">
              <span><strong>Horas extras pendientes</strong><small>Avisar cuando haya solicitudes por aprobar.</small></span>
              <input checked={form.notifyOvertime} onChange={(event) => setForm((current) => ({ ...current, notifyOvertime: event.target.checked }))} type="checkbox" />
              <i />
            </label>
            <label className="toggle-row">
              <span><strong>Ausencias y salidas tempranas</strong><small>Mostrar novedades al inicio del turno.</small></span>
              <input checked={form.notifyAbsences} onChange={(event) => setForm((current) => ({ ...current, notifyAbsences: event.target.checked }))} type="checkbox" />
              <i />
            </label>
          </section>

          <div className="settings-actions">
            <span>Los cambios se guardan en este dispositivo.</span>
            <Button icon="check" type="submit">Guardar ajustes</Button>
          </div>
        </div>

        <aside className="settings-aside">
          <div className="settings-card settings-card--brand">
            <img alt="Altara Bistró" src="/assets/altara-logo.jpg" />
            <span>ALTARA</span>
            <strong>{form.restaurantName}</strong>
            <small>Control de personal</small>
          </div>
          <div className="settings-card">
            <span className="eyebrow">Resumen del sistema</span>
            <div className="settings-fact"><span>Empleados activos</span><strong>{state.employees.filter((employee) => employee.active).length}</strong></div>
            <div className="settings-fact"><span>Áreas</span><strong>4</strong></div>
            <div className="settings-fact"><span>Moneda</span><strong>{form.currency}</strong></div>
            <div className="settings-fact"><span>Datos</span><strong>En este dispositivo</strong></div>
          </div>
          <div className="settings-help">
            <Icon name="alert" size={20} />
            <div><strong>Versión de demostración</strong><p>Los datos se guardan localmente en el navegador. Para uso multiusuario o en varios dispositivos se necesita conectar una base de datos.</p></div>
          </div>
        </aside>
      </form>
    </div>
  );
}
