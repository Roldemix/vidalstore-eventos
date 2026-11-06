export const EXCHANGES = {
  eventos: { nombre: 'vidalstore.eventos', tipo: 'topic' },
  comandos: { nombre: 'vidalstore.comandos', tipo: 'direct' },
  dlx: { nombre: 'vidalstore.dlx', tipo: 'direct' },
} as const;

export const ROUTING_KEYS = {
  compraRealizada: 'compra.realizada',
  licenciaRevocada: 'licencia.revocada',
  juegoPublicado: 'juego.publicado',
  correoEnviar: 'correo.enviar',
} as const;

export interface ParDeColas {
  trabajo: string;
  dlq: string;
  routingKeyDlq: string;
}

export const COLAS: Record<'avisos' | 'auditoria' | 'correos', ParDeColas> = {
  avisos: { trabajo: 'vidalstore.avisos', dlq: 'vidalstore.avisos.dlq', routingKeyDlq: 'avisos.dlq' },
  auditoria: { trabajo: 'vidalstore.auditoria', dlq: 'vidalstore.auditoria.dlq', routingKeyDlq: 'auditoria.dlq' },
  correos: { trabajo: 'vidalstore.correos', dlq: 'vidalstore.correos.dlq', routingKeyDlq: 'correos.dlq' },
};

// Bindings de las colas de trabajo (los de las DLQ se derivan de COLAS).
export const BINDINGS = [
  { exchange: EXCHANGES.eventos.nombre, cola: COLAS.avisos.trabajo, routingKey: ROUTING_KEYS.licenciaRevocada },
  { exchange: EXCHANGES.eventos.nombre, cola: COLAS.avisos.trabajo, routingKey: ROUTING_KEYS.compraRealizada },
  { exchange: EXCHANGES.eventos.nombre, cola: COLAS.auditoria.trabajo, routingKey: '#' },
  { exchange: EXCHANGES.comandos.nombre, cola: COLAS.correos.trabajo, routingKey: ROUTING_KEYS.correoEnviar },
] as const;