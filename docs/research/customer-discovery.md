# Customer Discovery — Guía de Entrevistas B2B

> Este documento es la guía de referencia para el programa de customer discovery de Justly en el ecosistema Stellar.  
> Objetivo: validar si la resolución de disputas descentralizada es un problema suficientemente grande y urgente para los proyectos del ecosistema.

---

## Por qué hacemos esto

Antes de escalar el desarrollo, necesitamos respuestas empíricas a estas preguntas:

1. ¿Las disputas son un problema **real y costoso** para los proyectos del ecosistema?
2. ¿Existe disposición a **integrar un protocolo externo** de resolución?
3. ¿Qué **fricciones o miedos** existen que debemos resolver para ser adoptables?
4. ¿Qué **modelo de precios** tiene sentido para los clientes?
5. ¿Hay señales de que alguien **pagaría hoy** por esto?

---

## A quién entrevistar

### Criterios de selección de targets

Priorizar proyectos que cumplan **dos o más** de estos criterios:

- [ ] Tienen transacciones P2P entre usuarios que no se conocen
- [ ] Manejan escrow o fondos bloqueados
- [ ] Sus transacciones involucran entregables subjetivos (trabajo, servicios, contenido)
- [ ] Ya tienen usuarios activos (no están en idea-stage)
- [ ] Están construidos en Stellar o planean hacerlo

### Lista de targets prioritarios (ecosistema Stellar/SCF)

| # | Proyecto | Tipo | Fit esperado | Link SCF |
|---|----------|------|--------------|----------|
| 1 | **Freelii** | Plataforma freelancers | ⭐⭐⭐ Alto | SCF Projects |
| 2 | **SkillBridge** | Marketplace de servicios | ⭐⭐⭐ Alto | SCF Projects |
| 3 | **Stellar Talent** | Marketplace de talento | ⭐⭐⭐ Alto | SCF Projects |
| 4 | **Reyts** | P2P Fiat DEX (stablecoin) | ⭐⭐ Medio | SCF Projects |
| 5 | **Juntta** | Crowdfunding LATAM | ⭐⭐ Medio | SCF Projects |
| 6 | **GrantFox** | Distribución de grants | ⭐⭐ Medio | SCF Projects |
| 7 | **Gearup** | Marketplace P2P | ⭐⭐⭐ Alto | SCF Projects |
| 8 | **Cartwey** | E-commerce / shopping | ⭐⭐ Medio | SCF Projects |
| 9 | **QuillTip** | Publicación / microtipping | ⭐⭐ Medio | SCF Projects |
| 10 | **Skyhitz** | Música / NFTs creadores | ⭐⭐ Medio | Discord |
| 11 | **Giveth** | Donaciones / charitable | ⭐⭐ Medio | Discord |
| 12 | **Rahat** | Ayuda humanitaria | ⭐⭐ Medio | SCF Projects |

> Podés agregar más proyectos que encuentres relevantes. Busca en [communityfund.stellar.org/projects](https://communityfund.stellar.org/projects) y en [las rondas activas](https://communityfund.stellar.org/dashboard/award-rounds).

---

## Cómo contactar

1. **Busca al founder o product lead** en X (Twitter), Discord del proyecto, o LinkedIn.
2. **Mensaje de apertura sugerido** (adaptalo según el canal):

> "Hola [nombre], soy [tu nombre], contribuidor de Justly — un protocolo de resolución de disputas descentralizado para el ecosistema Stellar.  
> Estamos en etapa de discovery y me encantaría hacerte algunas preguntas sobre cómo manejan los conflictos entre usuarios en [nombre del proyecto]. No te voy a vender nada todavía — estamos tratando de entender el problema antes de construir más.  
> ¿Tendrías 20-30 minutos esta semana?"

3. **Si no responden en 5 días**, hace follow-up una vez.
4. **La entrevista puede ser**: Zoom/Meet (ideal), Discord (cómodo para crypto founders), o escrita (si no tienen tiempo).

---

## Guía de entrevista

**Duración total**: 30-45 minutos  
**Estructura**: escuchar más que hablar. El 80% del tiempo debe ser el entrevistado hablando.

---

### Bloque 0 — Apertura (2 min)

> "Gracias por el tiempo. Esta es una conversación de investigación, no una demo de ventas. Queremos entender cómo resuelven conflictos hoy, y si el problema es tan relevante como creemos. No hay respuestas correctas o incorrectas."

---

### Bloque 1 — Contexto del proyecto (5 min)

Objetivo: entender en qué etapa están y qué escala tienen.

- ¿Qué hace exactamente la plataforma? ¿Podés contarme en una oración?
- ¿Quiénes son los dos tipos de usuarios que interactúan en ella?
- ¿Están en producción o todavía en desarrollo/testnet?
- ¿Cuántos usuarios activos tienen? ¿Qué volumen de transacciones mensual manejan (en USD o tokens)?

---

### Bloque 2 — El problema de las disputas hoy (10 min)

Objetivo: confirmar si el problema existe y con qué frecuencia.

- ¿Alguna vez tuvieron un conflicto entre dos partes de la plataforma? Contame un ejemplo real.
- ¿Cómo lo resolvieron? ¿Quién tomó la decisión final?
- ¿Tienen hoy algún mecanismo formal para disputas? (escrow, soporte, política de reembolsos, multisig, etc.)
- ¿Cuántas disputas estiman que tienen por mes? ¿Cuántas esperan tener cuando crezcan?
- ¿Qué pasa hoy cuando una disputa no tiene solución? ¿La parte afectada simplemente pierde el dinero?

---

### Bloque 3 — El costo del problema (10 min)

Objetivo: entender si el dolor es suficiente para pagar por una solución.

- ¿Cuánto tiempo del equipo se va en resolver conflictos?
- ¿Hay alguien en el equipo dedicado a esto, aunque sea parcialmente?
- ¿Alguna vez perdieron un usuario, una reputación, o una integración por una disputa mal resuelta?
- ¿Cuánto dinero estimás que han dejado de procesar por falta de confianza entre partes?
- En una escala del 1 al 10, ¿qué tan urgente es este problema para su roadmap?

---

### Bloque 4 — Visión ideal (5 min)

Objetivo: entender qué quieren (sin sesgarlos con nuestra solución todavía).

- Si tuvieran que diseñar la solución perfecta para resolver disputas en su plataforma, ¿cómo sería?
- ¿Preferirían resolverlo internamente o delegarlo a un tercero? ¿Por qué?
- ¿Les importaría que ese tercero sea un protocolo on-chain vs. un servicio centralizado como una empresa de arbitraje?
- ¿Qué información le darían a ese árbitro? ¿Contratos escritos, capturas, código on-chain?

---

### Bloque 5 — Pitch de Justly (5-10 min)

Objetivo: medir reacción genuina. Recién acá explicas qué es Justly.

> **Script sugerido**: "Te cuento qué estamos construyendo. Justly es un protocolo de arbitraje descentralizado que se integra a tu plataforma vía API o smart contract. Cuando dos usuarios tienen un conflicto, Justly selecciona aleatoriamente un panel de jurados — personas independientes que tienen tokens en juego — que revisan la evidencia y votan. El fallo se ejecuta automáticamente on-chain. Vos como plataforma no intervenís en la decisión."

Preguntas de seguimiento:
- ¿Qué te genera esto? ¿Confianza, escepticismo, curiosidad?
- ¿Qué es lo primero que te preocuparía de integrar algo así?
- ¿Qué parte del proceso no entendiste o no te convenció?
- ¿Qué debería tener (o no tener) para que lo adoptaras?

---

### Bloque 6 — Willingness to pay (5 min)

Objetivo: entender si pagarían y cuánto.

- Si esto resolviera el problema, ¿cuánto valdría para su negocio?
- ¿Preferirían pagar por disputa resuelta, por suscripción mensual, o por porcentaje del monto disputado?
- ¿Hay un precio por el que sería "obviamente vale la pena" vs. "demasiado caro"?
- ¿Tienen budget para herramientas de infraestructura? ¿Cuánto gastan en otras herramientas por mes?

---

### Bloque 7 — Decisión de compra (2 min)

Objetivo: mapear el proceso de adopción real.

- ¿Quién en su equipo tomaría la decisión de integrar algo como Justly? ¿Es una decisión técnica, de producto, o estratégica?
- ¿Qué necesitarían ver para convencerse de integrar un protocolo externo para algo tan sensible como resolver disputas?
- ¿Ya usan algún servicio externo para soporte o arbitraje?

---

### Cierre (2 min)

- ¿Hay algo más que quieras agregar que no te pregunté?
- ¿Conocés otros proyectos en el ecosistema que tengan este problema y podría ser útil entrevistar?
- ¿Puedo mandarte actualizaciones sobre Justly a medida que avanzamos?

---

## Cómo documentar los resultados

Crear un archivo en `docs/research/interviews/NombreProyecto.md` para cada entrevista con este formato:

```markdown
# Entrevista: [Nombre del Proyecto]

**Fecha**: [DD/MM/YYYY]  
**Contacto**: [Nombre y Rol]  
**Canal**: [Discord / Zoom / Escrito]  
**Duración**: [X minutos]

---

## Resumen ejecutivo
[2-3 oraciones de lo más importante que aprendiste]

## Contexto del proyecto
- Etapa: [Desarrollo / Testnet / Mainnet / Producción]
- Usuarios activos: [número o estimación]
- Volumen mensual: [USD o tokens]

## Estado actual de disputas
[Cómo las manejan hoy, qué mecanismos tienen]

## Señales de dolor (quotes directos si es posible)
- [Pain point 1]
- [Pain point 2]

## Costo estimado del problema
[Tiempo, dinero, usuarios perdidos — lo que dijeron]

## Reacción al pitch de Justly
[Cómo reaccionaron, qué preguntas hicieron, qué les preocupó]

## Disposición a integrar
**Alta / Media / Baja** — [justificación]

## Willingness to pay
[Modelo preferido y rango de precio si lo mencionaron]

## Quotes destacados
> "[cita textual memorable]"

## Red flags o blockers identificados
- [Algo que podría impedir la adopción]

## Próximos pasos
- [ ] [Algo concreto que quedaron en hacer]
```

---

## Cómo sintetizar los resultados

Al terminar las 10+ entrevistas, crear `docs/research/customer-discovery-summary.md` con:

1. **Tabla de señales por proyecto** (fit / dolor / willingness to pay / blocker principal)
2. **Los 3-5 pain points más frecuentes**
3. **El modelo de pricing preferido** (por disputa / suscripción / porcentaje)
4. **Los 3-5 blockers más frecuentes** para adoptar Justly
5. **Proyectos que querrían avanzar** (leads calientes)
6. **Conclusión**: ¿El problema es suficientemente grande y urgente para construir un startup en esto?

---

## Recursos

- [Visión B2B del producto](../product/b2b-overview.md)
- [Documentación de Justly](https://docs.justly.one)
- [Demo — experiencia del jurado](https://docs.justly.one/overview/live-demo-juror-experience)
- [Cómo integrar Justly en smart contracts](https://docs.justly.one/protocol/implementing-justly-web3-smart-contracts)
- [Proyectos financiados por SCF](https://communityfund.stellar.org/projects)
- [Rondas activas SCF](https://communityfund.stellar.org/dashboard/award-rounds)
