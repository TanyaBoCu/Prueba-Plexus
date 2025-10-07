# Prueba – Vive tus propias aventuras

Mini sitio **front-end** con un listado de **cards** de destinos y un **panel de filtros**. Permite combinar **destino / aventura / alojamiento**, seleccionar **fechas** para calcular **noches** y **precio**, y abrir un **desglose** con base, IVA y total. En tablet/móvil, los filtros se muestran como un **drawer** lateral.

---

## Instalación y ejecución

### Descarga en ZIP
1. Descarga: https://github.com/TanyaBoCu/Prueba-Plexus/archive/refs/heads/main.zip  
2. Descomprime el ZIP.  
3. Entra en `web/` y abre `index.html` en tu navegador.  
   Si tu navegador limita archivos locales, usa un servidor estático.

### Clonado con Git
```bash
git clone https://github.com/TanyaBoCu/Prueba-Plexus.git
cd Prueba-Plexus/web
# Servidor estático recomendado (elige uno)
npx serve .
# o
python -m http.server 5173
```

---

## Características clave

- **Filtros combinables**: destino (multi), aventura (multi), alojamiento y **rango de precio** (mín/máx sobre el total).
- **Fechas (calendario)**: “Desde / Hasta” → **noches = días seleccionados − 1**. Se actualizan noches y precio en cada card.
- **Desglose de precios**: enlace “Ver desglose” abre un **popover** junto al enlace con **base**, **IVA** y **total**, además de **destino** y **días**.
- **Responsive** con **Flexbox** y **CSS Grid**. En ≤1024px, el filtro funciona como **drawer** desde la izquierda (botón “Ver filtros”, botón “×”, cierre por `Esc` y clic fuera).
- **Dependencias inteligentes**: las aventuras no disponibles para los destinos activos se **deshabilitan** automáticamente (y se desmarcan si lo estaban).

---

## Flujo de uso

1. Marca uno o varios **destinos** (las **aventuras** incompatibles se deshabilitan).
2. Selecciona **fechas** (Desde/Hasta): se recalculan **noches** y **precio** en todas las cards.
3. Ajusta el **rango de precio** para acotar resultados.
4. Pulsa **“Ver desglose”** en una card para ver **base, IVA y total**; cierra con **Esc**, clic fuera o la **×**.

---

## Decisiones técnicas

- **HTML + CSS + JavaScript vanilla** (sin dependencias; ejecutable como sitio estático).
- **Flexbox & CSS Grid** para rejillas y alineaciones fluidas.
- **Variables CSS en `:root`** (colores, espaciados, radios) para coherencia y cambios rápidos.
- **Datos en `data-*` por card** (desacopla UI y cálculo):
  - `data-price-per-day` (céntimos), `data-fixed-fee` (céntimos), `data-iva` (%), `data-days-default`, `data-currency`.
  - **Opcional** `data-price-includes-iva="true"` si el precio/día ya incluye IVA (el popover desglosa hacia atrás).
- **Componentes desacoplados**: drawer (`aria-expanded`, `data-open`) y popover (posicionado al enlace, cierre por `Esc`/clic fuera).

---

## Accesibilidad (A11y) y SEO

- `aria-expanded`, `aria-controls`, `aria-hidden` en toggles y paneles; **cierre por `Esc` y clic fuera**.
- Zonas `aria-live="polite"` para cambios de precio; foco visible.
- HTML semántico; enlaces con texto significativo.
- Imágenes con `alt` y `loading="lazy"`.

---

## Lógica de cálculo (resumen)

**Noches**
```text
Si hay fechas válidas:
  noches = max( floor( (fechaFin − fechaInicio) / 1 día ), 0 )
Si no hay fechas:
  noches = data-days-default (de la card)
```

**Precio por card**
```text
# Caso por defecto (precio SIN IVA en data-price-per-day):
base  = (pricePerDay * noches) + fixedFee
iva   = round(base * (IVA/100))
total = base + iva

# Caso con IVA incluido (data-price-includes-iva="true"):
total = (pricePerDay * noches) + fixedFee
base  = round( total / (1 + IVA/100) )
iva   = total - base
```
Los importes se formatean con `toLocaleString('es-ES', { style: 'currency', currency })`.

**Reglas de filtrado**
- Dentro de cada grupo (destinos / aventuras / alojamientos) → **OR**.  
- Entre grupos → **AND** (destino ∧ aventura ∧ alojamiento ∧ precio).  
- Cambiar destinos **deshabilita** aventuras incompatibles y desmarca las activas.

---

## Estructura

```text
web/
├─ index.html
├─ css/  # estilos del layout, grid de cards, drawer y popover
├─ js/   # lógica de filtros, cálculo de precios, popover y drawer
└─ img/  # imágenes y assets
```

---

## Checklist de verificación

- [ ] Combinar varios **destinos** y **aventuras**; las no disponibles se deshabilitan.
- [ ] Cambiar **fechas** y comprobar que cambian **noches** y **precio** por card.
- [ ] Ajustar **mín/máx** de precio y ver que se ocultan cards fuera de rango.
- [ ] Abrir **“Ver desglose”**: popover alineado al enlace; cerrar con **Esc** y clic fuera.
- [ ] En tablet/móvil: abrir/cerrar el **drawer** (botón “Ver filtros”, **×**, `Esc`) sin desplazar el fondo.

---

## Despliegue (GitHub Pages)

1. Repo → **Settings → Pages**.  
2. *Source*: **Deploy from a branch**.  
3. *Branch*: `main` · *Folder*: `/web`.  
4. **Save** → Demo en `https://tanyabocu.github.io/Prueba-Plexus/`.
5. 
