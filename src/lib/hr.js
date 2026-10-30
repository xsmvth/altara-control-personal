import { toISODate, timeToMinutes } from "./date";

export function getEmployee(employees, employeeId) {
  return employees.find((employee) => employee.id === employeeId);
}

export function getShiftForDate(weekSchedule, employeeId, date) {
  return weekSchedule[employeeId]?.[date.getDay()] || null;
}

export function getOpenPunch(punches, employeeId, date = new Date()) {
  return punches.find(
    (punch) =>
      punch.employeeId === employeeId && punch.date === toISODate(date) && punch.status === "open",
  );
}

export function minutesForPunch(punch) {
  if (!punch?.clockIn) return 0;
  const start = timeToMinutes(punch.clockIn);
  let end = punch.clockOut ? timeToMinutes(punch.clockOut) : timeToMinutes("23:59");
  if (end < start) end += 24 * 60;
  return Math.max(0, end - start - (punch.breakMinutes || 0));
}

export function overtimeHoursForPunch(punch) {
  const minutes = minutesForPunch(punch);
  return Math.max(0, (minutes - 8 * 60) / 60);
}

export function overtimePay(overtime, employee) {
  if (!employee) return 0;
  return overtime.hours * employee.hourlyRate * overtime.multiplier;
}

export function regularHoursForPunch(punch) {
  return Math.min(minutesForPunch(punch), 8 * 60) / 60;
}

export function getTodayShift(weekSchedule, employeeId) {
  return getShiftForDate(weekSchedule, employeeId, new Date());
}

export function isScheduledToday(weekSchedule, employeeId) {
  return getTodayShift(weekSchedule, employeeId)?.status === "scheduled";
}

export function to12Hour(time) {
  if (!time) return "—";
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "p. m." : "a. m.";
  const normalized = hour % 12 || 12;
  return `${normalized}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function monthHoursFromPunches(punches) {
  return punches.reduce((total, punch) => total + minutesForPunch(punch) / 60, 0);
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
