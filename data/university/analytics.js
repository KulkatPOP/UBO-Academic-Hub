// Métricas institucionales DEMO para futura analítica administrativa.
// Fuente aislada, sin backend, persistencia ni conexión con interfaces actuales.

const usageStatistics = {
  source: "demo",
  modules: [
    { module: "Ramos", uses: 842 },
    { module: "Calendario", uses: 716 },
    { module: "Biblioteca", uses: 408 }
  ]
};

const trafficStatistics = {
  source: "demo",
  periods: [
    { period: "08:00 - 10:00", accesses: 312 },
    { period: "18:00 - 20:00", accesses: 268 }
  ]
};

const applicationErrors = {
  source: "demo",
  records: [
    { category: "Aplicación", count: 0, status: "Sin errores demo reportados" }
  ]
};

const libraryStatistics = {
  source: "demo",
  consultations: 408
};

const casinoStatistics = {
  source: "demo",
  consultations: 0,
  status: "Servicio demo aún no integrado"
};

const requestStatistics = {
  source: "demo",
  pending: 17,
  resolved: 86
};

const eventStatistics = {
  source: "demo",
  active: 8,
  registered: 214
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getUsageStatistics() {
  return clone(usageStatistics);
}

export function getTrafficStatistics() {
  return clone(trafficStatistics);
}

export function getApplicationErrors() {
  return clone(applicationErrors);
}

export function getLibraryStatistics() {
  return clone(libraryStatistics);
}

export function getCasinoStatistics() {
  return clone(casinoStatistics);
}

export function getRequestStatistics() {
  return clone(requestStatistics);
}

export function getEventStatistics() {
  return clone(eventStatistics);
}
