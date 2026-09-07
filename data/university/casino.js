// Fuente institucional DEMO para Casino UBO.
// No representa información oficial ni se conecta a interfaces, servicios o persistencia.

const casinoMenu = [
  {
    id: "casino-bowl-vegetal",
    name: "Bowl vegetal demo",
    description: "Preparación vegetal demostrativa con legumbres y verduras de temporada.",
    category: "vegetariano",
    price: 3900,
    available: true,
    allergens: [],
    mealType: "almuerzo"
  },
  {
    id: "casino-pasta-verduras",
    name: "Pasta de verduras demo",
    description: "Pasta con salsa de verduras para el menú demostrativo.",
    category: "principal",
    price: 4200,
    available: true,
    allergens: ["gluten"],
    mealType: "almuerzo"
  },
  {
    id: "casino-ensalada-fresca",
    name: "Ensalada fresca demo",
    description: "Ensalada de acompañamiento demostrativa.",
    category: "ensalada",
    price: 2600,
    available: true,
    allergens: [],
    mealType: "almuerzo"
  },
  {
    id: "casino-acompanamiento-arroz",
    name: "Arroz integral demo",
    description: "Acompañamiento demostrativo para almuerzo.",
    category: "acompañamiento",
    price: 1500,
    available: true,
    allergens: [],
    mealType: "almuerzo"
  },
  {
    id: "casino-postre-frutal",
    name: "Postre frutal demo",
    description: "Postre demostrativo de fruta y yogur.",
    category: "postre",
    price: 1800,
    available: false,
    allergens: ["lácteos"],
    mealType: "almuerzo"
  },
  {
    id: "casino-bebida-natural",
    name: "Bebida natural demo",
    description: "Bebida sin alcohol para el menú demostrativo.",
    category: "bebida",
    price: 1200,
    available: true,
    allergens: [],
    mealType: "almuerzo"
  },
  {
    id: "casino-desayuno-integral",
    name: "Desayuno integral demo",
    description: "Alternativa demostrativa con pan integral, fruta y bebida caliente.",
    category: "principal",
    price: 2800,
    available: true,
    allergens: ["gluten"],
    mealType: "desayuno"
  },
  {
    id: "casino-sandwich-once",
    name: "Sándwich de once demo",
    description: "Sándwich demostrativo para once o cena.",
    category: "principal",
    price: 3200,
    available: true,
    allergens: ["gluten"],
    mealType: "once-cena"
  }
];

const casinoHours = [
  {
    id: "casino-hours-breakfast-weekday",
    day: "lunes a viernes",
    openingTime: "08:00",
    closingTime: "10:30",
    mealType: "desayuno",
    status: "open"
  },
  {
    id: "casino-hours-lunch-weekday",
    day: "lunes a viernes",
    openingTime: "12:00",
    closingTime: "15:30",
    mealType: "almuerzo",
    status: "open"
  },
  {
    id: "casino-hours-evening-weekday",
    day: "lunes a viernes",
    openingTime: "16:30",
    closingTime: "19:00",
    mealType: "once-cena",
    status: "open"
  },
  {
    id: "casino-hours-saturday",
    day: "sábado",
    openingTime: "11:00",
    closingTime: "15:00",
    mealType: "almuerzo",
    status: "closed"
  }
];

function menuItemPrice(menuItemId) {
  return casinoMenu.find(item => item.id === menuItemId)?.price || 0;
}

function calculateOrderTotal(items) {
  return items.reduce((total, item) => total + menuItemPrice(item.menuItemId) * item.quantity, 0);
}

const casinoOrders = [
  {
    id: "casino-order-sofia-001",
    userId: "student-sofia-martinez",
    items: [
      { menuItemId: "casino-bowl-vegetal", quantity: 1 },
      { menuItemId: "casino-bebida-natural", quantity: 1 }
    ],
    orderDate: "2026-09-07",
    status: "completed"
  },
  {
    id: "casino-order-sofia-002",
    userId: "student-sofia-martinez",
    items: [
      { menuItemId: "casino-pasta-verduras", quantity: 1 },
      { menuItemId: "casino-ensalada-fresca", quantity: 1 }
    ],
    orderDate: "2026-09-08",
    status: "pending"
  },
  {
    id: "casino-order-carlos-001",
    userId: "teacher-carlos-perez",
    items: [
      { menuItemId: "casino-desayuno-integral", quantity: 2 },
      { menuItemId: "casino-bebida-natural", quantity: 1 }
    ],
    orderDate: "2026-09-07",
    status: "confirmed"
  },
  {
    id: "casino-order-admin-001",
    userId: "admin-ubo",
    items: [
      { menuItemId: "casino-sandwich-once", quantity: 1 },
      { menuItemId: "casino-postre-frutal", quantity: 1 }
    ],
    orderDate: "2026-09-06",
    status: "cancelled"
  }
].map(order => ({ ...order, total: calculateOrderTotal(order.items) }));

const casinoConsumption = [
  {
    id: "casino-consumption-sofia-001",
    userId: "student-sofia-martinez",
    orderId: "casino-order-sofia-001",
    date: "2026-09-07",
    mealType: "almuerzo"
  },
  {
    id: "casino-consumption-carlos-001",
    userId: "teacher-carlos-perez",
    orderId: "casino-order-carlos-001",
    date: "2026-09-07",
    mealType: "desayuno"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getCasinoMenu() {
  return clone(casinoMenu);
}

export function getCasinoMenuItemById(itemId) {
  return clone(casinoMenu.find(item => item.id === itemId) || null);
}

export function getAvailableCasinoItems() {
  return clone(casinoMenu.filter(item => item.available));
}

export function getCasinoHours() {
  return clone(casinoHours);
}

export function getCasinoOrders() {
  return clone(casinoOrders);
}

export function getCasinoOrdersByUser(userId) {
  if (!userId) return [];
  return clone(casinoOrders.filter(order => order.userId === userId));
}

export function getCasinoConsumption() {
  return clone(casinoConsumption);
}

export function getCasinoConsumptionByUser(userId) {
  if (!userId) return [];
  return clone(casinoConsumption.filter(record => record.userId === userId));
}

export function getCasinoStatistics() {
  return {
    totalMenuItems: casinoMenu.length,
    availableMenuItems: casinoMenu.filter(item => item.available).length,
    totalOrders: casinoOrders.length,
    activeOrders: casinoOrders.filter(order => ["pending", "confirmed"].includes(order.status)).length,
    totalConsumptionRecords: casinoConsumption.length,
    totalRevenue: casinoOrders
      .filter(order => order.status !== "cancelled")
      .reduce((total, order) => total + calculateOrderTotal(order.items), 0)
  };
}
