// Fuente institucional DEMO para Pagos UBO.
// Los registros son estáticos, no representan pagos reales y no procesan información financiera.

const paymentRecords = [
  {
    id: "payment-demo-001",
    orderId: "casino-order-sofia-001",
    userId: "student-sofia-martinez",
    amount: 5100,
    currency: "CLP",
    status: "paid",
    method: "card",
    createdAt: "2026-09-07T12:15:00-03:00",
    description: "Pago demo asociado a un pedido de Casino."
  },
  {
    id: "payment-demo-002",
    orderId: "casino-order-sofia-002",
    userId: "student-sofia-martinez",
    amount: 6800,
    currency: "CLP",
    status: "pending",
    method: "transfer",
    createdAt: "2026-09-08T11:40:00-03:00",
    description: "Pago demo pendiente asociado a un pedido de Casino."
  },
  {
    id: "payment-demo-003",
    orderId: "casino-order-carlos-001",
    userId: "teacher-carlos-perez",
    amount: 6800,
    currency: "CLP",
    status: "failed",
    method: "card",
    createdAt: "2026-09-07T09:10:00-03:00",
    description: "Intento de pago demo no procesado para pruebas de estado."
  },
  {
    id: "payment-demo-004",
    orderId: "casino-order-admin-001",
    userId: "admin-ubo",
    amount: 5000,
    currency: "CLP",
    status: "cancelled",
    method: "other",
    createdAt: "2026-09-06T16:20:00-03:00",
    description: "Pago demo cancelado asociado a un pedido de Casino."
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getPayments() {
  return clone(paymentRecords);
}

export function getPaymentById(paymentId) {
  if (!paymentId) return null;
  return clone(paymentRecords.find(payment => payment.id === paymentId) || null);
}

export function getPaymentByOrderId(orderId) {
  if (!orderId) return null;
  return clone(paymentRecords.find(payment => payment.orderId === orderId) || null);
}

export function getPaymentsByUser(userId) {
  if (!userId) return [];
  return clone(paymentRecords.filter(payment => payment.userId === userId));
}

export function getPendingPayments() {
  return clone(paymentRecords.filter(payment => payment.status === "pending"));
}

export function getSuccessfulPayments() {
  return clone(paymentRecords.filter(payment => payment.status === "paid"));
}

export function getPaymentStatistics() {
  return {
    totalPayments: paymentRecords.length,
    paidPayments: paymentRecords.filter(payment => payment.status === "paid").length,
    pendingPayments: paymentRecords.filter(payment => payment.status === "pending").length,
    cancelledPayments: paymentRecords.filter(payment => payment.status === "cancelled").length,
    failedPayments: paymentRecords.filter(payment => payment.status === "failed").length,
    totalPaidAmount: paymentRecords
      .filter(payment => payment.status === "paid")
      .reduce((total, payment) => total + payment.amount, 0)
  };
}
