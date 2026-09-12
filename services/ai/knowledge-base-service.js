// Base de conocimiento académica DEMO, local y de solo lectura.
// No usa red, almacenamiento local ni datos académicos oficiales.

const freezeKnowledgeBase = records => Object.freeze(records.map(document => Object.freeze({ ...document, keywords: Object.freeze([...document.keywords]) })));

export const uboDemoKnowledgeBase = freezeKnowledgeBase([
  { id: "kb-db-001", courseId: "course-db-2026-1", title: "Modelo relacional", topic: "Modelo relacional", content: "El modelo relacional organiza la información en tablas relacionadas mediante atributos y claves.", keywords: ["modelo relacional", "tablas", "relaciones"], difficulty: "basic", source: "Material Unidad 2" },
  { id: "kb-db-002", courseId: "course-db-2026-1", title: "Claves primarias", topic: "Clave primaria", content: "Una clave primaria identifica de manera única cada registro de una tabla y no debe repetirse ni quedar vacía.", keywords: ["clave primaria", "identificador", "registro único"], difficulty: "basic", source: "Material Unidad 2" },
  { id: "kb-db-003", courseId: "course-db-2026-1", title: "Claves foráneas", topic: "Clave foránea", content: "Una clave foránea vincula una tabla con otra al referirse a la clave primaria de la tabla relacionada.", keywords: ["clave foránea", "clave foranea", "relación", "integridad referencial"], difficulty: "medium", source: "Material Unidad 2" },
  { id: "kb-db-004", courseId: "course-db-2026-1", title: "Normalización de bases de datos", topic: "Normalización", content: "La normalización organiza los datos para reducir redundancia y dependencias innecesarias; la tercera forma normal separa atributos que no dependen directamente de la clave.", keywords: ["normalización", "normalizacion", "3FN", "dependencias", "redundancia"], difficulty: "medium", source: "Material Unidad 3" },
  { id: "kb-algebra-001", courseId: "course-algebra-2026-1", title: "Funciones", topic: "Funciones", content: "Una función asigna a cada valor permitido de entrada un único valor de salida.", keywords: ["funciones", "dominio", "rango"], difficulty: "basic", source: "Material Unidad 1" },
  { id: "kb-algebra-002", courseId: "course-algebra-2026-1", title: "Límites", topic: "Límites", content: "Un límite describe el valor al que se aproxima una función cuando la variable se acerca a un punto determinado.", keywords: ["límites", "limites", "aproximación", "aproximacion"], difficulty: "medium", source: "Material Unidad 2" },
  { id: "kb-algebra-003", courseId: "course-algebra-2026-1", title: "Derivadas", topic: "Derivadas", content: "La derivada mide la razón de cambio instantánea de una función respecto de su variable.", keywords: ["derivadas", "razón de cambio", "razon de cambio"], difficulty: "medium", source: "Material Unidad 3" },
  { id: "kb-programming-001", courseId: "course-programming-2026-1", title: "Variables", topic: "Variables", content: "Una variable es un nombre que representa un valor que puede cambiar durante la ejecución de un programa.", keywords: ["variables", "valor", "tipo de dato"], difficulty: "basic", source: "Material Unidad 1" },
  { id: "kb-programming-002", courseId: "course-programming-2026-1", title: "Funciones de programación", topic: "Funciones", content: "Una función agrupa instrucciones reutilizables y puede recibir parámetros y devolver un resultado.", keywords: ["funciones", "parámetros", "parametros", "retorno"], difficulty: "basic", source: "Material Unidad 2" },
  { id: "kb-programming-003", courseId: "course-programming-2026-1", title: "Estructuras de control", topic: "Estructuras de control", content: "Las estructuras condicionales y los ciclos permiten decidir qué instrucciones ejecutar y repetir procesos de forma controlada.", keywords: ["estructuras de control", "condicionales", "ciclos", "if", "while"], difficulty: "medium", source: "Material Unidad 3" }
]);

const clone = value => JSON.parse(JSON.stringify(value));
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const stopWords = new Set(["como", "para", "sobre", "quiero", "necesito", "puedo", "puedes", "explica", "explicame", "que", "una", "uno", "los", "las", "del", "con", "por", "esta", "este", "es"]);
const queryTokens = query => [...new Set(normalize(query).split(/[^a-z0-9]+/).filter(token => token.length > 1 && !stopWords.has(token)))];

function relevanceFor(document, query, tokens) {
  const title = normalize(document.title);
  const topic = normalize(document.topic);
  const content = normalize(document.content);
  const keywords = document.keywords.map(normalize);
  let score = 0;
  if (query && (title.includes(query) || topic.includes(query) || keywords.some(keyword => keyword.includes(query) || query.includes(keyword)))) score += 8;
  tokens.forEach(token => {
    if (title.includes(token)) score += 4;
    if (topic.includes(token)) score += 4;
    if (keywords.some(keyword => keyword.includes(token))) score += 3;
    if (content.includes(token)) score += 1;
  });
  return score;
}

export function getKnowledgeBase() {
  return clone(uboDemoKnowledgeBase);
}

export function searchKnowledge(query, courseId) {
  const normalizedQuery = normalize(query);
  const tokens = queryTokens(query);
  if (!normalizedQuery || !tokens.length) return [];
  const selectedCourse = typeof courseId === "string" ? courseId.trim() : "";
  return uboDemoKnowledgeBase
    .filter(document => !selectedCourse || document.courseId === selectedCourse)
    .map(document => ({ ...document, relevance: relevanceFor(document, normalizedQuery, tokens) }))
    .filter(document => document.relevance > 0)
    .sort((left, right) => right.relevance - left.relevance || left.title.localeCompare(right.title, "es"))
    .map(clone);
}
