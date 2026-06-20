# Slice — Visión de Producto B2B

> Este documento explica qué es Slice a nivel de negocio y por qué importa. Es el punto de entrada para cualquier persona que quiera entender el producto más allá del código.

---

## Qué es Slice

Slice es una **capa de resolución de disputas** diseñada para integrarse en plataformas digitales que manejan transacciones entre partes que no se conocen.

No es un producto de consumo. Es **infraestructura B2B**: las plataformas integran Slice para resolver los conflictos de sus propios usuarios sin tener que construir ni operar un sistema de arbitraje propio.

---

## El problema que resolvemos

Cualquier plataforma donde el dinero se mueve entre partes desconocidas tiene el mismo problema latente:

> "¿Qué pasa cuando las cosas salen mal?"

- Un freelancer entrega un trabajo que el cliente rechaza.
- Un comprador dice que el producto no llegó; el vendedor dice que sí.
- Un proyecto de crowdfunding no cumple sus milestones.
- Un jurado de grants discrepa sobre si un entregable califica.

Las plataformas hoy resuelven esto de una de dos formas:

1. **Ignoran el problema**: dejan que las partes se arreglen solas → pérdida de confianza, abandono de usuarios.
2. **Lo resuelven internamente**: soporte humano, moderadores, políticas → caro, lento, no escalable, y con conflicto de interés (la plataforma es juez y parte).

A medida que una plataforma crece, ambos enfoques colapsan.

---

## Nuestra propuesta de valor (B2B)

Slice se integra como árbitro externo neutral. La plataforma no necesita decidir quién tiene la razón — delega ese proceso a un protocolo de jurados descentralizado que:

- **Opera automáticamente**: sin intervención del equipo de la plataforma.
- **Es neutral**: los jurados no tienen relación con la plataforma ni con ninguna de las partes.
- **Es verificable**: todo el proceso queda registrado on-chain.
- **Escala**: el costo por disputa no sube con el volumen.
- **Es rápido**: una disputa se resuelve en horas, no en semanas.

---

## Cómo funciona la integración (resumen técnico)

La integración sigue un patrón `arbitrable/arbitrator`:

1. El contrato de la plataforma llama a `createDispute(...)` cuando detecta un conflicto.
2. Ambas partes fondean su lado de la disputa.
3. Las partes suben evidencia (links a IPFS, contratos, capturas).
4. Slice selecciona jurados aleatoriamente del pool de stakers.
5. Los jurados votan via commit-reveal (sin colusión).
6. El fallo se ejecuta automáticamente on-chain.
7. El contrato de la plataforma recibe el resultado vía callback `rule(disputeId, ruling)`.

Para plataformas que no tienen smart contracts propios, Slice también expone una **API REST** para crear y consultar disputas.

---

## Clientes objetivo

Slice es más valioso para plataformas que tienen **dos o más de estas características**:

| Característica | Por qué importa |
|---------------|-----------------|
| Transacciones P2P entre desconocidos | Mayor probabilidad de disputa |
| Escrow o fondos bloqueados | Necesitan árbitro para liberar |
| Entregables subjetivos (trabajo, servicios) | No hay verdad objetiva → necesitan juicio humano |
| Alta frecuencia de transacciones | Soporte propio no escala |
| Descentralización como valor | No quieren ser juez y parte |
| Ecosistema Stellar/Soroban | Integración nativa disponible |

### Segmentos principales

- **Marketplaces** (e-commerce P2P, servicios, activos digitales)
- **Plataformas de freelancers** (trabajo remoto, contratos digitales)
- **Protocolos DeFi** (escrow, DEX P2P, lending)
- **Crowdfunding y grants** (liberación de fondos por milestones)
- **Plataformas de contenido** (disputas de autoría, comisiones, moderación)

---

## Modelo de negocio (hipótesis actual)

| Modelo | Descripción |
|--------|-------------|
| **Fee por disputa** | La plataforma paga X% del monto disputado como fee de arbitraje |
| **Suscripción mensual** | Para plataformas con volumen predecible |
| **Revenue share** | Una fracción de los fees de penalización a jurados inhonestos |

> **Estado**: hipótesis no validada. Ver `docs/research/` para el programa de customer discovery.

---

## Estado actual del producto

| Componente | Estado |
|-----------|--------|
| Contrato Soroban (core) | Funcional en testnet |
| Pool de jurados + staking | Implementado |
| Sistema de votación commit-reveal | Implementado |
| Envío de evidencia on-chain | Implementado |
| Withdraw de balances acumulados | Implementado |
| Queue de jurados (draw aleatorio) | Implementado |
| Frontend (juror UX) | En progreso |
| API REST para integración sin smart contract | Planeado |
| SDK para integradores | Planeado |
| Contrato desplegado en mainnet | Pendiente |

---

## Lo que Slice no es

- **No es un tribunal legal**: no tiene peso jurídico. Es un mecanismo de coordinación económica.
- **No es un producto B2C de consumo masivo**: los usuarios finales interactúan con Slice a través de la plataforma que lo integra, no directamente con Slice.
- **No es mediación**: no busca compromiso. El protocolo emite un fallo binario (claimer gana / defender gana) ejecutable automáticamente.
- **No reemplaza el soporte**: Slice es para disputas formalizadas donde hay valor bloqueado. El soporte casual sigue siendo responsabilidad de la plataforma.

---

## Recursos

- [Documentación pública de Slice](https://docs.justly.one)
- [Cómo integrar Slice en smart contracts](https://docs.justly.one/protocol/implementing-justly-web3-smart-contracts)
- [Ciclo de vida de una disputa](https://docs.justly.one/how-it-works/dispute-lifecycle)
- [Tiers de disputa](https://docs.justly.one/how-it-works/tiers/dispute-tiers)
- [Customer Discovery — guía de entrevistas](../research/customer-discovery.md)
