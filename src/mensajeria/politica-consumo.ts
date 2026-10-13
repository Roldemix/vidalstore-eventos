// prefetch(1): un mensaje a la vez. Mantiene el orden y, mientras un mensaje espera
// su reintento, el broker no le entrega otro a este consumidor. prefetch(0) significaría
// sin límite: el broker vacía la cola hacia el consumidor y todo quedaría unacked.
export const PREFETCH = 1;

// Reintento acotado para fallos transitorios: 3 intentos, 2 s entre ellos.
export const REINTENTOS_MAX = 3;
export const ESPERA_REINTENTO_MS = 2000;