# Document-Space Coordinate System

**Datum:** 2026-03-13

## Problém

Lili žila ve viewport souřadnicích (`position:fixed` canvas, `clientX/Y` mouse, `getBoundingClientRect` obstacles). Při scrollování se pohybovala s uživatelem jako sticky overlay — nemohla zůstat na místě na stránce ani se volně pohybovat po celém dokumentu.

## Rozhodnutí

Přechod z viewport souřadnic na **document (page) souřadnice**:

- `lili.pos` = pozice v document space (absolutní na stránce)
- Canvas zůstává `position:fixed` (viewport-sized pro výkon)
- Při renderování se aplikuje `ctx.translate(-scrollOx, -scrollOy)`
- Mouse input: `clientX + scrollX`, `clientY + scrollY`
- Spatial hash: `getBoundingClientRect() + scroll offset` → document coords
- Boundaries: `document.documentElement.scrollWidth/Height` místo `innerWidth/Height`
- Click/tooltip hit detection: viewport→document konverze

## Důvod

Autonomie. Lili má mít svobodu pohybu po celé stránce — může si zalézt dolů pod fold, může zůstat u zajímavého elementu i když uživatel scrolluje pryč. Přesně jako skutečná chobotnice v akváriu — nesedí přilepená na skle, ale pohybuje se po celém prostoru.

## Dopad

- Lili se už nehýbe s viewportem (není sticky)
- Může se pohybovat po celé výšce/šířce dokumentu
- Render culling stále funguje (offscreen skip)
- Spatial hash, senzory, DOM interakce — vše konzistentní v document coords
- Pozice se ukládá v document coords, při restore se clampuje na aktuální document bounds
- `scrollOx`/`scrollOy` se aktualizují každý frame (smooth scrolling)
- `docW`/`docH` se aktualizují při resize a scroll
