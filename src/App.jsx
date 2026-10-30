import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "./components/Icon";
import { PunchModal } from "./components/PunchModal";
import { Avatar, IconButton, Toast } from "./components/ui";
import { defaultState } from "./data/seed";
import { dateLabel, timeInputValue, toISODate } from "./lib/date";
import Dashboard from "./pages/Dashboard";
import Overtime from "./pages/Overtime";
import Payroll from "./pages/Payroll";
import Punch from "./pages/Punch";
import Reports from "./pages/Reports";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import Vacation from "./pages/Vacation";

const STORAGE_KEY = "altara-control-state-v4";

const navigation = [
  { id: "inicio", label: "Inicio", icon: "home" },
  { id: "ponche", label: "Ponche", icon: "clock" },
  { id: "horarios", label: "Horarios", icon: "calendar" },
  { id: "nomina", label: "Nómina", icon: "users" },
  { id: "horas-extras", label: "Horas extras", icon: "timer" },
  { id: "vacaciones", label: "Vacaciones", icon: "sun" },
  { id: "reportes", label: "Reportes", icon: "chart" },
];

const titles = {
  inicio: "Inicio",
  ponche: "Control de ponche",
  horarios: "Horarios",
  nomina: "Nómina",
  "horas-extras": "Horas extras",
  vacaciones: "Vacaciones",
  reportes: "Reportes",
  ajustes: "Ajustes",
};

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    const parsed = JSON.parse(stored);
    return {
      ...defaultState,
      ...parsed,
      settings: { ...defaultState.settings, ...parsed.settings },
    };
  } catch {
    return defaultState;
  }
}

export default function App() {
  const [state, setState] = useState(loadInitialState);
  const [page, setPage] = useState("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [punchModal, setPunchModal] = useState({ open: false, employeeId: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const closeToast = useCallback(() => setToast(null), []);
  const notify = useCallback((title, message = "") => setToast({ title, message }), []);

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePunch(payload) {
    const employee = state.employees.find((person) => person.id === payload.employeeId);
    if (!employee) return;

    if (payload.action === "in") {
      const alreadyOpen = state.punches.find(
        (punch) =>
          punch.employeeId === payload.employeeId &&
          punch.date === payload.date &&
          punch.status === "open",
      );
      if (alreadyOpen) {
        notify("Ponche ya registrado", `${employee.name} ya tiene una entrada activa.`);
        return;
      }
      setState((current) => ({
        ...current,
        punches: [
          ...current.punches,
          {
            id: `punch-${Date.now()}`,
            employeeId: payload.employeeId,
            date: payload.date,
            clockIn: payload.time || timeInputValue(),
            clockOut: "",
            breakMinutes: payload.breakMinutes,
            status: "open",
          },
        ],
      }));
      notify("Entrada registrada", `${employee.name} · ${payload.time}`);
      return;
    }

    const openPunch = state.punches.find(
      (punch) =>
        punch.employeeId === payload.employeeId &&
        punch.date === payload.date &&
        punch.status === "open",
    );
    if (!openPunch) {
      notify("No hay entrada activa", `${employee.name} no tiene un turno abierto hoy.`);
      return;
    }
    setState((current) => ({
      ...current,
      punches: current.punches.map((punch) =>
        punch.id === openPunch.id
          ? {
              ...punch,
              clockOut: payload.time || timeInputValue(),
              breakMinutes: payload.breakMinutes,
              status: "closed",
            }
          : punch,
      ),
    }));
    notify("Salida registrada", `${employee.name} · ${payload.time}`);
  }

  function updateSchedule(employeeId, weekday, changes) {
    setState((current) => ({
      ...current,
      weekSchedule: {
        ...current.weekSchedule,
        [employeeId]: current.weekSchedule[employeeId].map((entry) =>
          entry.weekday === weekday ? { ...entry, ...changes } : entry,
        ),
      },
    }));
  }

  function changeOvertimeStatus(id, status) {
    setState((current) => ({
      ...current,
      overtime: current.overtime.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  }

  function addOvertime(item) {
    setState((current) => ({ ...current, overtime: [item, ...current.overtime] }));
  }

  function addVacation(item) {
    setState((current) => ({
      ...current,
      vacationRequests: [item, ...current.vacationRequests],
    }));
  }

  function approveVacation(id) {
    setState((current) => ({
      ...current,
      vacationRequests: current.vacationRequests.map((request) =>
        request.id === id ? { ...request, status: "approved" } : request,
      ),
    }));
  }

  function renderPage() {
    const shared = { state, notify };
    switch (page) {
      case "ponche":
        return <Punch {...shared} onOpenPunch={(employeeId = "") => setPunchModal({ open: true, employeeId })} />;
      case "horarios":
        return <Schedule {...shared} onUpdateSchedule={updateSchedule} />;
      case "nomina":
        return (
          <Payroll
            {...shared}
            onApprovePayroll={() =>
              setState((current) => ({ ...current, payrollApproved: !current.payrollApproved }))
            }
          />
        );
      case "horas-extras":
        return (
          <Overtime
            {...shared}
            onAddOvertime={addOvertime}
            onChangeStatus={changeOvertimeStatus}
          />
        );
      case "vacaciones":
        return (
          <Vacation
            {...shared}
            onAddVacation={addVacation}
            onApproveVacation={approveVacation}
          />
        );
      case "reportes":
        return <Reports {...shared} />;
      case "ajustes":
        return (
          <Settings
            {...shared}
            onSave={(settings) => setState((current) => ({ ...current, settings }))}
          />
        );
      default:
        return (
          <Dashboard
            {...shared}
            onApproveOvertime={(id) => changeOvertimeStatus(id, "approved")}
            onNavigate={navigate}
            onOpenPunch={(employeeId = "") => setPunchModal({ open: true, employeeId })}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <button
        aria-label="Cerrar menú"
        className={`sidebar-scrim ${mobileOpen ? "is-visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand">
          <img alt="Logotipo de Altara Bistró" src="/assets/altara-logo.jpg" />
          <div>
            <strong>ALTARA</strong>
            <span>Control de personal</span>
          </div>
        </div>

        <div className="sidebar__section-label">Operación</div>
        <nav className="sidebar__nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button
              aria-current={page === item.id ? "page" : undefined}
              className={page === item.id ? "is-active" : ""}
              key={item.id}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === "horas-extras" &&
                state.overtime.some((overtime) => overtime.status === "pending") && (
                  <i className="nav-count">
                    {state.overtime.filter((overtime) => overtime.status === "pending").length}
                  </i>
                )}
            </button>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <img alt="" aria-hidden="true" className="sidebar__photo" src="/assets/altara-interior.jpg" />
          <div className="sidebar__bottom-content">
            <span className="sidebar__status"><i /> Sistema activo</span>
            <p>Datos guardados en este dispositivo.</p>
          </div>
          <button
            aria-current={page === "ajustes" ? "page" : undefined}
            className={`sidebar__settings ${page === "ajustes" ? "is-active" : ""}`}
            onClick={() => navigate("ajustes")}
          >
            <Icon name="settings" size={18} />
            Ajustes
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__left">
            <button aria-label="Abrir menú" className="mobile-menu" onClick={() => setMobileOpen(true)}>
              <Icon name="menu" size={21} />
            </button>
            <div className="breadcrumbs">
              <span>Operación</span>
              <Icon name="chevronRight" size={13} />
              <strong>{titles[page]}</strong>
            </div>
          </div>
          <div className="topbar__right">
            <span className="topbar__date">{dateLabel()}</span>
            <span className="topbar__divider" />
            <IconButton icon="bell" label="Notificaciones" onClick={() => notify("Sin alertas nuevas", "Los pendientes aparecen en el inicio.")} />
            <button className="profile-menu" onClick={() => navigate("ajustes")}>
              <Avatar employee={{ initials: "CA" }} size="sm" />
              <span><strong>Carolina</strong><small>Administradora</small></span>
              <Icon name="chevronDown" size={15} />
            </button>
          </div>
        </header>
        <main>{renderPage()}</main>
      </div>

      <PunchModal
        defaultEmployeeId={punchModal.employeeId}
        employees={state.employees}
        onClose={() => setPunchModal({ open: false, employeeId: "" })}
        onSubmit={handlePunch}
        open={punchModal.open}
        punches={state.punches}
      />
      <Toast onClose={closeToast} toast={toast} />
    </div>
  );
}
