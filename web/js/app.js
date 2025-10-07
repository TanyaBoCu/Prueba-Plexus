// Respetar reduce-motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.querySelectorAll('*').forEach(el => el.style.scrollBehavior = 'auto');
}

// Añade clase al body al hacer scroll
const onScroll = () => {
  if (window.scrollY > 4) document.body.classList.add('scrolled');
  else document.body.classList.remove('scrolled');
};
onScroll();
window.addEventListener('scroll', onScroll, { passive:true });

// Toggle accesible del menú
const btn = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-menu');

if (btn && nav){
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.dataset.open = String(!open);
  });
}

// Carousel Hero
(() => {
  const root  = document.getElementById('hero-carousel');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.slide'));
  const prev   = root.querySelector('.prev');
  const next   = root.querySelector('.next');
  const dotsEl = root.querySelector('.dots');

  let i = 0, timer = null;
  const INTERVAL = 5000;

  slides.forEach((_, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot';
    b.addEventListener('click', () => go(idx, true));
    dotsEl.appendChild(b);
  });
  const dots = Array.from(dotsEl.children);

  function setActive(n){
    slides[i].classList.remove('is-active');
    dots[i]?.classList.remove('is-active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    dots[i]?.classList.add('is-active');
  }
  function nextSlide(){ setActive(i+1); }
  function prevSlide(){ setActive(i-1); }

  function start(){ stop(); timer = setInterval(nextSlide, INTERVAL); }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }
  function go(n, user){ setActive(n); if (user) start(); }

  prev.addEventListener('click', () => { prevSlide(); start(); });
  next.addEventListener('click', () => { nextSlide(); start(); });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  setActive(0);
  start();
})();

// Filtros
(function(){
  const $form = document.querySelector('#filters');
  const $allInfo = document.querySelector('.all-info');
  if(!$form || !$allInfo) return;

  const fmtMoney = (cents, currency='EUR', locale='es-ES') =>
    (cents/100).toLocaleString(locale, { style:'currency', currency });

  const parseIntAttr = (el, name, def=0) => {
    const v = el.getAttribute(name);
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  };

  const getDates = () => {
    const startStr = $form.elements['date-start'].value;
    const endStr   = $form.elements['date-end'].value;
    if(!startStr || !endStr) return { nights:null, start:null, end:null };

    const start = new Date(startStr);
    const end   = new Date(endStr);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    const diffMs = end - start;
    const nights = Math.max(Math.floor(diffMs / (1000*60*60*24)), 0);

    if(diffMs < 0) return { nights: null, start:null, end:null };
    return { nights, start, end };
  };

  const readFilters = () => {
    const destinations = [...$form.querySelectorAll('input[name="destination"]:checked')].map(i => i.value);
    const categories   = [...$form.querySelectorAll('input[name="category"]:checked')].map(i => i.value);
    const stays        = [...$form.querySelectorAll('input[name="stay"]:checked')].map(i => i.value);

    const priceMinStr = $form.elements['price-min']?.value?.trim();
    const priceMaxStr = $form.elements['price-max']?.value?.trim();
    const priceMin = priceMinStr ? Number(priceMinStr) : null;
    const priceMax = priceMaxStr ? Number(priceMaxStr) : null;

    const { nights, start, end } = getDates();

    return { destinations, categories, stays, priceMin, priceMax, nights, start, end };
  };

  const $cards = [...$allInfo.querySelectorAll('.card')];

  function updateDependentCategoryState(selectedDestinations){
    const catInputs = [...$form.querySelectorAll('input[name="category"]')];

    const candidateCards = $cards.filter(card => {
      if(!selectedDestinations.length) return true;
      const cont = (card.getAttribute('data-continent') || '').toLowerCase();
      const region = (card.getAttribute('data-region') || '').toLowerCase();
      return selectedDestinations.includes(cont) || selectedDestinations.includes(region);
    });

    const availableCats = new Set(candidateCards.map(c => (c.getAttribute('data-category')||'').toLowerCase()));

    catInputs.forEach(input => {
      const available = availableCats.has(input.value.toLowerCase());
      input.disabled = !available;
      if(!available && input.checked){
        input.checked = false;
      }
      input.setAttribute('aria-disabled', String(!available));
    });
  }

  function computeCardPriceCents(card, nights){
    const daysDefault = parseIntAttr(card, 'data-days-default', 1);
    const pricePerDay = parseIntAttr(card, 'data-price-per-day', 0);
    const fixedFee    = parseIntAttr(card, 'data-fixed-fee', 0);
    const ivaPct      = Number(card.getAttribute('data-iva') || 0);

    const usedNights = (nights === null || nights <= 0) ? daysDefault : nights;

    const base = (pricePerDay * usedNights) + fixedFee; // céntimos
    const total = Math.round(base * (1 + (ivaPct/100)));
    return { totalCents: total, usedNights };
  }

  function updateCardPriceAndNightsUI(card, nights, start, end){
    const { totalCents, usedNights } = computeCardPriceCents(card, nights);
    const currency = card.getAttribute('data-currency') || 'EUR';

    const priceEl = card.querySelector('[data-price-display]');
    if(priceEl){
      priceEl.textContent = fmtMoney(totalCents, currency);
    }

    const daysEl = card.querySelector('[data-days]');
    if(daysEl){
      daysEl.textContent = String(usedNights);
      const daysLiteralNode = daysEl.parentElement;
      if(daysLiteralNode){
        const num = usedNights;
      }
    }

    const startEl = card.querySelector('[data-date-start]');
    const endEl   = card.querySelector('[data-date-end]');
    if(startEl && endEl){
      const fmt = (d) => d ? d.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' }) : '';
      startEl.textContent = start ? fmt(start) : '';
      endEl.textContent   = end   ? fmt(end)   : '';
      if(start){
        const ymd = start.toISOString().slice(0,10);
        startEl.setAttribute('datetime', ymd);
      }
      if(end){
        const ymd = end.toISOString().slice(0,10);
        endEl.setAttribute('datetime', ymd);
      }
    }

    return totalCents;
  }

  function applyFilters(){
    const { destinations, categories, stays, priceMin, priceMax, nights, start, end } = readFilters();

    updateDependentCategoryState(destinations);

    let anyVisible = false;

    $cards.forEach(card => {
      const cont  = (card.getAttribute('data-continent') || '').toLowerCase();
      const reg   = (card.getAttribute('data-region') || '').toLowerCase();
      const destOk = !destinations.length || destinations.includes(cont) || destinations.includes(reg);

      if(!destOk) { card.closest('.card-item').style.display = 'none'; return; }

      const cat = (card.getAttribute('data-category') || '').toLowerCase();
      const catOk = !categories.length || categories.includes(cat);

      if(!catOk) { card.closest('.card-item').style.display = 'none'; return; }

      const stay = (card.getAttribute('data-stay') || '').toLowerCase();
      const stayOk = !stays.length || (stay && stays.includes(stay));
      if(!stayOk) { card.closest('.card-item').style.display = 'none'; return; }

      const totalCents = updateCardPriceAndNightsUI(card, nights, start, end);
      let priceOk = true;
      if(priceMin !== null) priceOk = priceOk && (totalCents >= Math.round(priceMin * 100));
      if(priceMax !== null) priceOk = priceOk && (totalCents <= Math.round(priceMax * 100));

      if(!priceOk){
        card.closest('.card-item').style.display = 'none';
        return;
      }

      card.closest('.card-item').style.display = '';
      anyVisible = true;
    });

    document.querySelectorAll('.destinations-options').forEach(group => {
      const hasVisible = !![...group.querySelectorAll('.card-item')].find(li => li.style.display !== 'none');
      group.style.display = hasVisible ? '' : 'none';
    });
  }

  $form.addEventListener('change', e => {
    applyFilters();
  });

  ['date-start','date-end','price-min','price-max'].forEach(name => {
    const el = $form.elements[name];
    if(el){
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });

  applyFilters();
})();

// Cuadro desglose de precios
(function(){
  const pop = document.getElementById('price-popover');
  if(!pop) return;
  const panel = pop.querySelector('.price-popover__panel');
  const btnX = pop.querySelector('.price-popover__close');
  const els = {
    dest: pop.querySelector('[data-popover-destination]'),
    reg:  pop.querySelector('[data-popover-region]'),
    days: pop.querySelector('[data-popover-days]'),
    base: pop.querySelector('[data-popover-base]'),
    iva:  pop.querySelector('[data-popover-iva]'),
    total:pop.querySelector('[data-popover-total]')
  };

  const fmtMoney = (cents, currency='EUR', locale='es-ES') =>
    (cents/100).toLocaleString(locale, { style:'currency', currency });

  function getDatesFromFilters(){
    const form = document.querySelector('#filters');

    if(!form) return { nights: null };

    const startStr = form.elements['date-start']?.value || '';
    const endStr   = form.elements['date-end']?.value || '';

    if(!startStr || !endStr) return { nights: null };

    const s = new Date(startStr), e = new Date(endStr);
    s.setHours(0,0,0,0); e.setHours(0,0,0,0);
    const diff = e - s;

    if(diff < 0) return { nights: null };

    const nights = Math.max(Math.floor(diff / 86400000), 0);

    return { nights };
  }

  function computeBreakdown(card){
    const pricePerDay = parseInt(card.getAttribute('data-price-per-day') || '0', 10);
    const fixedFee    = parseInt(card.getAttribute('data-fixed-fee') || '0', 10);
    const ivaPct      = Number(card.getAttribute('data-iva') || '0');
    const currency    = card.getAttribute('data-currency') || 'EUR';
    const includesIVA = (card.getAttribute('data-price-includes-iva') || '').toLowerCase() === 'true';
    const { nights }  = getDatesFromFilters();
    const defaultDays = parseInt(card.getAttribute('data-days-default') || '1', 10);
    const used = (nights === null || nights <= 0) ? defaultDays : nights;
    let base, iva, total;

    if(includesIVA){
      total = (pricePerDay * used) + fixedFee;
      base  = Math.round( total / (1 + ivaPct/100) );
      iva   = total - base;
    }else{
      base  = (pricePerDay * used) + fixedFee;
      iva   = Math.round(base * (ivaPct/100));
      total = base + iva;
    }
    return { used, base, iva, total, currency };
  }

  function fillFromCard(card){
    const country = card.querySelector('[data-country]')?.textContent.trim() || '';
    const region  = card.querySelector('[data-region]')?.textContent.trim() || '';
    const daysTxt = card.querySelector('.days')?.textContent.trim() || '';
    const { used, base, iva, total, currency } = computeBreakdown(card);
    els.dest.textContent = country;
    els.reg.textContent  = region;
    els.days.textContent = daysTxt || (used + (used === 1 ? ' día' : ' días'));
    els.base.textContent  = fmtMoney(base, currency);
    els.iva.textContent   = fmtMoney(iva, currency);
    els.total.textContent = fmtMoney(total, currency);
  }

  function positionNear(anchor){
    const prevDisplay = pop.style.display;
    const prevVis = pop.style.visibility;
    pop.style.display = 'block';
    pop.style.visibility = 'hidden';
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const margin = 8;
    let top  = a.bottom + margin;
    let left = a.left + (a.width/2) - (p.width/2);
    left = Math.max(margin, Math.min(left, window.innerWidth - p.width - margin));

    if (top + p.height > window.innerHeight - margin) {
      top = a.top - p.height - margin;
      pop.style.setProperty('--caret-top', (p.height - 6) + 'px');
    } else {
      pop.style.setProperty('--caret-top', '-6px');
    }

    const caretLeft = (a.left + a.width/2) - left - 6;
    pop.style.setProperty('--caret-left', Math.round(caretLeft) + 'px');
    pop.style.setProperty('--popover-top',  Math.round(top)  + 'px');
    pop.style.setProperty('--popover-left', Math.round(left) + 'px');
    pop.style.visibility = prevVis || '';
    pop.style.display = prevDisplay || '';
  }

  function openForLink(link){
    const card = link.closest('.card');
    if(!card) return;
    fillFromCard(card);
    positionNear(link);
    currentAnchor = link;
    pop.classList.add('is-open');
    pop.setAttribute('aria-hidden','false');
  }

  function closePopover(){
    pop.classList.remove('is-open');
    pop.setAttribute('aria-hidden','true');
    currentAnchor = null;
    clearTimeout(hoverTimer);
  }

  let hoverTimer = null;
  let currentAnchor = null;
  function setupTriggers(){
    const links = document.querySelectorAll('.card a.breakdown');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if(pop.classList.contains('is-open') && currentAnchor === link){
          closePopover();
        } else {
          openForLink(link);
        }
      });
      link.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer);
        openForLink(link);
      });
      link.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => { closePopover(); }, 120);
      });
    });
    panel.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); });
    panel.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => { closePopover(); }, 120);
    });
    btnX.addEventListener('click', closePopover);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closePopover(); });
    pop.addEventListener('click', (e)=>{ if(!panel.contains(e.target)) closePopover(); });
    ['scroll','resize'].forEach(ev => {
      window.addEventListener(ev, () => {
        if(currentAnchor && pop.classList.contains('is-open')) {
          positionNear(currentAnchor);
        }
      }, { passive: true });
    });
  }

  setupTriggers();
})();

// Botón de filtros
(function(){
  const btn=document.querySelector('.filters-toggle');
  const panel=document.getElementById('filters-drawer');
  if(!btn||!panel)return;
  const label=btn.querySelector('.label');
  const closedText=btn.getAttribute('data-closed-text')||'Ver filtros';
  const openText=btn.getAttribute('data-open-text')||'Cerrar filtros';

  function setState(open){
    btn.setAttribute('aria-expanded',String(open));
    panel.dataset.open=String(open);
    if(label)label.textContent=open?openText:closedText;
  }

  btn.addEventListener('click',()=>{
    const open=btn.getAttribute('aria-expanded')==='true';
    setState(!open);
  });
  const closeBtn=panel.querySelector('.filters-close');

  if(closeBtn){
    closeBtn.addEventListener('click',()=>{ setState(false); });
  }
  
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape'&&btn.getAttribute('aria-expanded')==='true'){ setState(false); }
  });
})();


