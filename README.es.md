# 50 Machines · árbol tecnológico abierto

[English](README.md) · [Español](README.es.md)

[50machines.com](https://50machines.com) es un manual de campo de 50 máquinas, en el orden en que podrías construirlas, desde un horno de barro hasta un ordenador de relés. Cada máquina usa solo lo que fabrican las anteriores.

Las primeras 50 guías las hizo Rolando Zubirán. Este repositorio guarda el formato, las plantillas y dos guías de referencia para que cualquiera pueda proponer la máquina 51 y las que sigan. Las máquinas aceptadas aparecen en el árbol del sitio, marcadas como **community**.

## Qué hay aquí

| Carpeta | Qué guarda |
|---|---|
| `GUIDE_FORMAT.md` | El formato de la guía: archivos, campos, convenios y reglas de verdad y de seguridad. |
| `template/` | Esqueleto vacío para una máquina nueva: `meta.json`, `model.mjs`, `guide.mjs`. |
| `prompts/PROMPT_KIT.md` | Indicaciones para redactar una guía con tu propia IA (Claude u otra) en el formato exacto. |
| `reference/kiln`, `reference/power` | Dos guías publicadas completas (la máquina 1 y la máquina 23) para copiar. |
| `runtime/` | El reproductor compartido de las guías (`guide.js`, `guide.css`). |
| `data/machines.mjs` | Las 50 máquinas, la parte del árbol a la que pertenecen y lo que cada una necesita. |
| `data/hub.es.json` | Las mismas 50 máquinas en español: nombres, líneas y números clave. |
| `scripts/generate.mjs` | Genera una ficha de modelo y una guía descargables para cada máquina. |
| `download/` | Esas fichas, después de ejecutar el generador. Una carpeta por máquina, más un zip. |
| `community/` | Donde se envían las máquinas nuevas, una carpeta cada una. |

## Cómo contribuir una máquina

1. Abre una incidencia con la plantilla **Propose a machine**. Di qué hace, qué máquinas anteriores necesita y tus fuentes.
2. Copia `template/` a `community/<slug>/` y rellénala. Puedes redactar con tu propia IA usando `prompts/PROMPT_KIT.md`. Tú respondes de cada cifra y de cada paso.
3. Abre una pull request. Completa la lista de comprobación.
4. Quien mantiene el repositorio la revisa según `CONTRIBUTING.md` y `SAFETY.md`. Nada se publica en el sitio sin revisión. Si no puedes hacer el dibujo isométrico, lo harán quienes mantienen el repositorio con el kit de anatomía de Ryan (MIT; ver `THIRD_PARTY_NOTICES.md`).
5. Cuando se acepta, aparece en 50machines.com marcada como **community**, con tu nombre.

## Descargar las 50 fichas de modelo

`data/machines.mjs` es el catálogo abierto de las 50 máquinas. Los nombres y las líneas en español están en `data/hub.es.json`. La máquina 1 y la máquina 23 tienen además guías de referencia completas en `reference/kiln` y `reference/power`.

Desde un clon limpio, con Node.js 18 o posterior y sin instalar nada:

```
node scripts/generate.mjs
```

`npm run generate` es el mismo comando. Escribe una carpeta por máquina en `download/machines/`, más `download/index.html` y `download/50-machines.zip`.

Cada carpeta tiene `meta.json`, `model.mjs`, `guide.en.md`, `guide.es.md` y `guide.html`. Las máquinas 1 y 23 incluyen también la guía de referencia y su modelo físico. Las demás fichas llevan el lugar publicado en el árbol, el número clave y la nota de diseño que ya está en el catálogo. No son guías de taller paso a paso, y no añaden cifras que no estén ya en el catálogo. Lee `SAFETY.md` antes de construir nada.

## Licencia

El contenido de este repositorio está bajo Creative Commons Atribución-CompartirIgual 4.0. El código de este repositorio está bajo la licencia MIT.

- **Código** (`runtime/`, `reference/**/*.mjs|js`, scripts): MIT, ver `LICENSE`.
- **Contenido** (texto de las guías, datos, cifras, dibujos y todo lo demás): Creative Commons Atribución-CompartirIgual 4.0, ver `LICENSE-CONTENT`. Crédito: «50 Machines (50machines.com)».

Esas licencias cubren solo este repositorio. No cubren la edición impresa del libro *50 Machines* (© 2026 ASSEMBLR VENTURES, S.L., todos los derechos reservados para esa edición). Tampoco cubren la marca 50machines.com.

Titular de los derechos del material propio de este repositorio: ASSEMBLR VENTURES, S.L. (Madrid, España).

El código de terceros conserva su licencia. Los dibujos isométricos se generan con el kit abierto de anatomía de Ryan (https://github.com/wheresryan22/anatomy), que sigue bajo la licencia MIT, Copyright (c) 2026 Ryan. Ver `THIRD_PARTY_NOTICES.md`. El copyright de `LICENSE` no cubre ese kit.

**Al enviar una pull request certificas que escribiste la contribución o que tienes derecho a enviarla, y aceptas que se licencia bajo CC BY-SA 4.0 (contenido) y MIT (código).** Añade `Signed-off-by: Tu nombre <correo>` a tus commits (`git commit -s`), como en el Developer Certificate of Origin (https://developercertificate.org).

## Seguridad

Son guías para construir máquinas reales. Algunas implican fuego, presión, metal fundido, gases tóxicos o mucha corriente. Lee `SAFETY.md`. Construye bajo tu responsabilidad y conforme a la ley local.
