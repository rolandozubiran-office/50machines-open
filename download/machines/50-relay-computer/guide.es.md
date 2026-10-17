# 50. Ordenador de relés

Ficha generada a partir del catálogo abierto de este repositorio. Recoge el lugar de la máquina en el árbol, su número clave y la nota de modelo que ya está publicada. No añade pasos de construcción ni cifras que no estén en el catálogo.

- **Parte:** V · Señales y cálculo
- **Identificador:** `relay-computer`
- **Dificultad:** 5 de 5
- **Número clave:** Zuse Z3: 5–10 Hz
- **Necesita:** 22. Electroimán; 26. Batería de plomo-ácido; 46. Telégrafo
- **Abre el paso a:** Ninguna máquina posterior la lista.

## Para qué sirve

Miles de relés forman un ordenador programable.

Esta parte del árbol: Imprenta, hora, rumbo; después mensajes por cable y por el aire y, por último, una máquina que calcula.

Doce relés hechos a mano suman dos números de 4 bits, y miles de ellos forman un ordenador programable.

**En el sitio:** Construye un ordenador de relés

## Modelo

Nota de modelo, en inglés, tal como está en `data/machines.mjs`:

A relay adder computer on a rack: a toggle-switch input panel for two 4-bit numbers, a bank of relays (each a coil, armature and contacts) wired as full adders, lamp outputs, a stepping clock and a battery. Run: enter two numbers; relays click through the carry chain (lit as they close), the lamps show the sum in binary and the readout in decimal; the Z3 used ~2,000+ relays at 5–10 Hz.

## Guía completa

La guía paso a paso, con sus comprobaciones, está en el sitio y en el libro. Esta ficha no la sustituye.

Guía ilustrada (inglés): https://50machines.com/guides/relay-computer-guide.html

Sitio en español: https://50machines.com/es/

## Seguridad

Lee `SAFETY.md`. Algunas máquinas usan fuego, presión, metal fundido, gases tóxicos o mucha corriente. Construye bajo tu responsabilidad y conforme a la ley local. Estas fichas no son planos de ingeniería y no certifican nada.
