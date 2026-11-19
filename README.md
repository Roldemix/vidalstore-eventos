# vidalstore-eventos

Consumidor de los topics de Kafka de VidalStore: arma el panel en vivo, las
alertas, el historial de ventas y el estado del catálogo.

## Grupos

| Grupo | Topics |
|---|---|
| `vidalstore-panel` | `vidalstore.actividad`, `vidalstore.compras` |
| `vidalstore-alertas` | `vidalstore.actividad` |
| `vidalstore-historial` | `vidalstore.compras` |
| `vidalstore.catalogo` | `vidalstore.catalogo` |

## Manejo de errores (EP3)

El camino común vive en `src/streaming/procesar-mensaje.ts`:

1. `leerEventoKafka` valida el sobre `eventoId`, `tipo`, `version` (debe ser 1) y
   `emitidoEn`, y luego el DTO completo. Los motivos son `json-invalido`,
   `falta-<campo>`, `dto-invalido` y `version-desconocida`.
2. Un inválido se publica en `<topic>.dlt` con el value original, la misma key,
   los headers originales más `x-motivo` y `x-grupo`. Después se confirma el
   offset: un mensaje malo nunca bloquea al grupo.
3. Si el grupo ya procesó el `eventoId` (`eventos.eventos_procesados`), se
   confirma sin volver a escribir.
4. Solo las fallas transitorias de PostgreSQL se reintentan: 3 reintentos con
   1 s, 2 s y 4 s. Si sigue caído, el mensaje va al `.dlt` con
   `x-motivo=postgres-noresponde`.
5. Duplicados `UNIQUE` se tratan como "ya procesado". Cualquier otro error de
   negocio va al `.dlt` con `x-motivo=error-procesamiento`.

`vidalstore.catalogo` no tiene `.dlt`: sus inválidos solo se registran en el log.

## Pruebas

```bash
npm ci
npm run build
npm test
```

Las pruebas cubren validación por motivo, reintentos con espera creciente y la
orquestación del `.dlt` con dobles, sin Kafka ni PostgreSQL.
