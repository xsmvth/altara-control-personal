import { addDays, toISODate } from "../lib/date";

const employeeSeed = [
  ["Ana Martínez", "Capitana de salón", "Salón", 310, "2021-03-15"],
  ["Luis Peña", "Mesero", "Salón", 260, "2023-07-10"],
  ["Mariela Santos", "Mesera", "Salón", 255, "2022-11-02"],
  ["Carlos Jiménez", "Mesero", "Salón", 255, "2024-01-22"],
  ["Yamilet Ortiz", "Anfitriona", "Salón", 270, "2023-04-17"],
  ["Johan Reyes", "Mesero", "Salón", 250, "2024-08-05"],
  ["Paola Núñez", "Mesera", "Salón", 250, "2025-02-11"],
  ["Miguel Castro", "Capitán de salón", "Salón", 300, "2020-09-28"],
  ["Rafael Méndez", "Chef ejecutivo", "Cocina", 390, "2019-06-03"],
  ["Luz De León", "Sous chef", "Cocina", 330, "2021-08-16"],
  ["Enmanuel Ruiz", "Cocinero", "Cocina", 275, "2023-01-09"],
  ["Rosmery Paulino", "Cocinera", "Cocina", 270, "2022-05-23"],
  ["Jean Carlos Mora", "Cocinero", "Cocina", 265, "2024-03-18"],
  ["Daniela Pérez", "Pastelera", "Cocina", 285, "2022-10-03"],
  ["José Manuel Díaz", "Ayudante de cocina", "Cocina", 235, "2025-01-13"],
  ["Wanda Batista", "Ayudante de cocina", "Cocina", 235, "2024-06-24"],
  ["Gabriel Soto", "Bartender principal", "Barra", 295, "2021-12-06"],
  ["Kiara Ramírez", "Bartender", "Barra", 265, "2023-09-11"],
  ["Samuel Herrera", "Barback", "Barra", 225, "2024-11-18"],
  ["Nathalie Gómez", "Barista", "Barra", 240, "2025-03-03"],
  ["Andrés Familia", "Bartender", "Barra", 260, "2023-05-29"],
  ["Carolina Almonte", "Gerente general", "Administración", 450, "2018-02-12"],
  ["Laura Medina", "Administradora", "Administración", 335, "2020-07-20"],
  ["Víctor Sánchez", "Encargado de compras", "Administración", 290, "2022-02-07"],
  ["Ruth Villalona", "Contadora", "Administración", 340, "2021-07-05"],
];

export const areaMeta = {
  Salón: { color: "#2f6148", soft: "#dbe7de", icon: "users" },
  Cocina: { color: "#b14b2e", soft: "#f5dfd6", icon: "chef" },
  Barra: { color: "#b78226", soft: "#f3e8cf", icon: "glass" },
  Administración: { color: "#5d6170", soft: "#e4e5e9", icon: "briefcase" },
};

export const employees = employeeSeed.map(([name, role, area, hourlyRate, hireDate], index) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return {
    id: `emp-${index + 1}`,
    name,
    role,
    area,
    hourlyRate,
    hireDate,
    initials,
    phone: `809-555-${String(101 + index).padStart(4, "0")}`,
    weeklyHours: area === "Administración" ? 40 : 44,
    contractType: "Tiempo indefinido",
    rotation: ["A", "B", "C"][index % 3],
    rotationOffset: index % 3,
    active: true,
    vacationAvailable: [2, 8, 5, 10, 3, 6, 0, 7, 4, 9, 1, 6, 3, 0, 5, 2, 7, 4, 2, 0, 5, 12, 8, 6, 3][index],
    status: "active",
  };
});

const schedules = {
  Salón: { start: "14:00", end: "22:00", restDays: [1, 2, 3, 4] },
  Cocina: { start: "09:00", end: "17:00", restDays: [2, 3, 4, 5] },
  Barra: { start: "16:00", end: "00:00", restDays: [3, 4, 5, 0] },
  Administración: { start: "09:00", end: "17:00", restDays: [0, 6] },
};

export function buildWeekSchedule(people = employees) {
  return Object.fromEntries(
    people.map((employee) => {
      const template = schedules[employee.area];
      return [
        employee.id,
        Array.from({ length: 7 }, (_, weekday) => {
          const restDay =
            employee.area === "Administración"
              ? weekday === 0 || weekday === 6
              : template.restDays[employee.rotationOffset % template.restDays.length] === weekday;
          return {
            employeeId: employee.id,
            weekday,
            start: template.start,
            end: template.end,
            status: restDay ? "rest" : "scheduled",
          };
        }),
      ];
    }),
  );
}

const today = new Date();
const iso = (offset) => toISODate(addDays(today, offset));

export const initialPunches = [
  { id: "p1", employeeId: "emp-1", date: iso(-6), clockIn: "13:56", clockOut: "22:12", breakMinutes: 30, status: "closed" },
  { id: "p2", employeeId: "emp-2", date: iso(-6), clockIn: "14:02", clockOut: "22:05", breakMinutes: 30, status: "closed" },
  { id: "p3", employeeId: "emp-9", date: iso(-5), clockIn: "08:54", clockOut: "17:18", breakMinutes: 30, status: "closed" },
  { id: "p4", employeeId: "emp-11", date: iso(-5), clockIn: "09:01", clockOut: "18:02", breakMinutes: 30, status: "closed" },
  { id: "p5", employeeId: "emp-17", date: iso(-4), clockIn: "15:58", clockOut: "00:24", breakMinutes: 30, status: "closed" },
  { id: "p6", employeeId: "emp-18", date: iso(-4), clockIn: "16:03", clockOut: "23:36", breakMinutes: 30, status: "closed" },
  { id: "p7", employeeId: "emp-1", date: iso(-3), clockIn: "13:58", clockOut: "22:10", breakMinutes: 30, status: "closed" },
  { id: "p8", employeeId: "emp-3", date: iso(-3), clockIn: "14:00", clockOut: "22:08", breakMinutes: 30, status: "closed" },
  { id: "p9", employeeId: "emp-9", date: iso(-2), clockIn: "08:58", clockOut: "17:08", breakMinutes: 30, status: "closed" },
  { id: "p10", employeeId: "emp-12", date: iso(-2), clockIn: "08:59", clockOut: "17:12", breakMinutes: 30, status: "closed" },
  { id: "p11", employeeId: "emp-17", date: iso(-1), clockIn: "15:57", clockOut: "23:44", breakMinutes: 30, status: "closed" },
  { id: "p12", employeeId: "emp-19", date: iso(-1), clockIn: "15:59", clockOut: "23:31", breakMinutes: 30, status: "closed" },
  { id: "p13", employeeId: "emp-2", date: iso(0), clockIn: "13:57", clockOut: "", breakMinutes: 30, status: "open" },
  { id: "p14", employeeId: "emp-3", date: iso(0), clockIn: "14:04", clockOut: "", breakMinutes: 30, status: "open" },
  { id: "p15", employeeId: "emp-5", date: iso(0), clockIn: "13:52", clockOut: "", breakMinutes: 30, status: "open" },
  { id: "p16", employeeId: "emp-9", date: iso(0), clockIn: "08:51", clockOut: "", breakMinutes: 30, status: "open" },
  { id: "p17", employeeId: "emp-10", date: iso(0), clockIn: "08:58", clockOut: "", breakMinutes: 30, status: "open" },
  { id: "p18", employeeId: "emp-17", date: iso(0), clockIn: "15:55", clockOut: "", breakMinutes: 30, status: "open" },
];

export const initialOvertime = [
  {
    id: "ot-1",
    employeeId: "emp-11",
    date: iso(-1),
    hours: 1.25,
    multiplier: 1.35,
    reason: "Cierre de cocina y mise en place",
    status: "pending",
  },
  {
    id: "ot-2",
    employeeId: "emp-17",
    date: iso(-1),
    hours: 0.75,
    multiplier: 1.35,
    reason: "Cierre de barra",
    status: "pending",
  },
  {
    id: "ot-3",
    employeeId: "emp-1",
    date: iso(-3),
    hours: 0.5,
    multiplier: 1.35,
    reason: "Cierre de salón",
    status: "approved",
  },
  {
    id: "ot-4",
    employeeId: "emp-9",
    date: iso(-5),
    hours: 0.5,
    multiplier: 1.35,
    reason: "Producción para evento privado",
    status: "approved",
  },
];

export const initialVacationRequests = [
  {
    id: "vac-1",
    employeeId: "emp-4",
    startDate: iso(9),
    endDate: iso(13),
    days: 4,
    status: "pending",
    note: "Viaje familiar",
  },
  {
    id: "vac-2",
    employeeId: "emp-14",
    startDate: iso(18),
    endDate: iso(21),
    days: 2,
    status: "approved",
    note: "Asunto personal",
  },
];

export const initialAbsences = [
  { id: "abs-1", employeeId: "emp-22", date: iso(0), type: "Permiso", note: "Cita médica", approved: true },
  { id: "abs-2", employeeId: "emp-6", date: iso(0), type: "Llegó más temprano", note: "Salió a las 8:30 p. m.", approved: true },
];

export const initialSettings = {
  restaurantName: "Altara Bistró",
  address: "Emile Boyrie de Moya 339, Santo Domingo",
  phone: "(849) 919-2100",
  timezone: "America/Santo_Domingo",
  currency: "DOP",
  overtimeMultiplier: 1.35,
  weeklyHours: 44,
  roundingMinutes: 5,
  breakMinutes: 30,
  overtimeMode: "Después del turno programado",
  notifyOvertime: true,
  notifyAbsences: true,
};

export const defaultState = {
  employees,
  weekSchedule: buildWeekSchedule(),
  punches: initialPunches,
  overtime: initialOvertime,
  vacationRequests: initialVacationRequests,
  absences: initialAbsences,
  payrollApproved: false,
  settings: initialSettings,
};
