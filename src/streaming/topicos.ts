export const TOPICS = {
  compras: 'vidalstore.compras',
  actividad: 'vidalstore.actividad',
  catalogo: 'vidalstore.catalogo',
} as const;

// Nombres estables: el administrador de Kafka rebobina estos grupos y el .dlt
// lleva x-grupo con exactamente este valor.
export const GRUPOS = {
  panel: 'vidalstore-panel',
  alertas: 'vidalstore-alertas',
  historial: 'vidalstore-historial',
  catalogo: 'vidalstore.catalogo',
} as const;
