import type { ConsumeMessage } from 'amqplib';

export interface MuerteInfo {
  colaOrigen: string;
  routingKey: string | null;
  motivo: string;
  intentos: number;
}

// Nunca lanza: un mensaje sin x-death igual se registra, con valores de respaldo.
export function leerMuerte(msg: ConsumeMessage): MuerteInfo {
  const h = msg.properties.headers ?? {};
  const muertes = Array.isArray(h['x-death']) ? h['x-death'] : [];
  const m = muertes[0] as Record<string, any> | undefined; // la primera es la muerte más reciente
  const claves = (m?.['routing-keys'] ?? []) as string[];
  return {
    colaOrigen: String(m?.queue ?? h['x-first-death-queue'] ?? msg.fields.routingKey),
    routingKey: claves[0] ? String(claves[0]) : null,
    motivo: String(m?.reason ?? h['x-first-death-reason'] ?? 'desconocido'),
    intentos: Number(m?.count ?? 1),
  };
}