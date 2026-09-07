// Fuente institucional DEMO para Eventos UBO.
// No representa actividades oficiales ni se conecta a interfaces, servicios o persistencia.

const events = [
  {
    id: "event-data-innovation-2026",
    title: "Encuentro demo de innovación con datos",
    description: "Actividad académica demostrativa sobre proyectos de datos y tecnología.",
    type: "academic",
    date: "2026-09-16",
    startTime: "10:00",
    endTime: "12:00",
    location: "Espacio demo · Edificio académico",
    organizer: "Coordinación académica demo",
    capacity: 60,
    registered: 28,
    registrationOpen: true,
    status: "upcoming"
  },
  {
    id: "event-cultural-encounter-2026",
    title: "Muestra cultural universitaria demo",
    description: "Encuentro cultural demostrativo abierto a la comunidad universitaria.",
    type: "cultural",
    date: "2026-09-24",
    startTime: "16:00",
    endTime: "18:00",
    location: "Patio central demo",
    organizer: "Vida universitaria demo",
    capacity: 40,
    registered: 40,
    registrationOpen: true,
    status: "upcoming"
  },
  {
    id: "event-sports-festival-2026",
    title: "Jornada deportiva interescuelas demo",
    description: "Actividad deportiva demostrativa con disciplinas recreativas.",
    type: "sports",
    date: "2026-10-03",
    startTime: "09:30",
    endTime: "14:00",
    location: "Cancha universitaria demo",
    organizer: "Deportes y bienestar demo",
    capacity: 100,
    registered: 72,
    registrationOpen: true,
    status: "upcoming"
  },
  {
    id: "event-wellbeing-day-2026",
    title: "Jornada de bienestar estudiantil demo",
    description: "Espacio demostrativo de orientación y bienestar para estudiantes.",
    type: "institutional",
    date: "2026-09-07",
    startTime: "09:00",
    endTime: "15:00",
    location: "Centro de apoyo demo",
    organizer: "DAE demo",
    capacity: 80,
    registered: 47,
    registrationOpen: true,
    status: "active"
  },
  {
    id: "event-research-forum-2026",
    title: "Foro de investigación aplicada demo",
    description: "Instancia académica demostrativa finalizada sobre investigación universitaria.",
    type: "academic",
    date: "2026-08-28",
    startTime: "11:00",
    endTime: "13:00",
    location: "Auditorio demo",
    organizer: "Investigación y desarrollo demo",
    capacity: 50,
    registered: 50,
    registrationOpen: false,
    status: "finished"
  }
];

const eventRegistrations = [
  {
    id: "event-registration-sofia-data-innovation",
    eventId: "event-data-innovation-2026",
    userId: "student-sofia-martinez",
    registrationDate: "2026-09-04",
    status: "registered"
  },
  {
    id: "event-registration-carlos-sports-festival",
    eventId: "event-sports-festival-2026",
    userId: "teacher-carlos-perez",
    registrationDate: "2026-09-05",
    status: "registered"
  },
  {
    id: "event-registration-sofia-wellbeing",
    eventId: "event-wellbeing-day-2026",
    userId: "student-sofia-martinez",
    registrationDate: "2026-09-02",
    status: "registered"
  },
  {
    id: "event-registration-sofia-cultural",
    eventId: "event-cultural-encounter-2026",
    userId: "student-sofia-martinez",
    registrationDate: "2026-08-30",
    status: "cancelled"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasAvailableSpots(event) {
  return event.capacity > event.registered;
}

function acceptsRegistrations(event) {
  return event.registrationOpen
    && hasAvailableSpots(event)
    && event.status !== "cancelled"
    && event.status !== "finished";
}

export function getEvents() {
  return clone(events);
}

export function getEventById(eventId) {
  return clone(events.find(event => event.id === eventId) || null);
}

export function getUpcomingEvents() {
  return clone(events.filter(event => event.status === "upcoming"));
}

export function getAvailableEvents() {
  return clone(events.filter(acceptsRegistrations));
}

export function getEventRegistrations() {
  return clone(eventRegistrations);
}

export function getEventRegistrationsByUser(userId) {
  if (!userId) return [];
  return clone(eventRegistrations.filter(registration => registration.userId === userId));
}

export function getEventStatistics() {
  return {
    totalEvents: events.length,
    upcomingEvents: events.filter(event => event.status === "upcoming").length,
    activeEvents: events.filter(event => event.status === "active").length,
    totalRegistrations: eventRegistrations.length,
    availableSpots: events.reduce((total, event) => total + Math.max(0, event.capacity - event.registered), 0)
  };
}
