# Altara · Control de personal

Prototipo funcional para reemplazar el control de ponches, turnos y horas extras que el restaurante lleva en papel.

## Qué incluye

- Terminal de entrada y salida para 25 empleados de ejemplo.
- Vista de quién está en turno, quién falta por entrar y actividad del día.
- Horarios semanales con turnos, días libres, vacaciones y permisos editables.
- Rotaciones por grupos A, B y C.
- Nómina con tarifa por hora, horas regulares, horas extras y total estimado.
- Bitácora de horas extras con registro, aprobación y rechazo.
- Balance de vacaciones, solicitudes y aprobación.
- Reportes de asistencia, horas trabajadas, puntualidad y extras.
- Exportación CSV para nómina y reportes.
- Ajustes de jornada, pausas, redondeo y factor de horas extras.
- Persistencia local en el navegador.
- Diseño adaptable para computadora y teléfono.

## Ejecutar

Desde la carpeta principal del proyecto:

```powershell
pnpm install
pnpm build
pnpm preview --host 127.0.0.1
```

La aplicación estará disponible en `http://127.0.0.1:4173/`.

Para desarrollo:

```powershell
pnpm dev
```

## Datos de demostración

La primera apertura carga 25 empleados, ponches recientes, solicitudes de vacaciones y horas extras de ejemplo. Los cambios se guardan en `localStorage`.

Para una operación real, el siguiente paso técnico es conectar autenticación y una base de datos central para que varios dispositivos compartan la misma información. Las reglas de nómina y vacaciones deben validarse contra la política interna del restaurante y la legislación laboral aplicable.
