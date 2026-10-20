/* Progressive enhancement: the complete course stays readable without this script. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const masthead = document.querySelector('.site-masthead');
  const nav = document.querySelector('.nav');
  nav.setAttribute('aria-label', '课程导航');
  masthead.querySelector('.masthead-nav-slot').append(nav);
  function placeLanguage() {
    const control = document.querySelector('.lang-switch');
    if (control && !masthead.contains(control)) {
      control.classList.remove('lang-switch-floating');
      masthead.querySelector('.masthead-language-slot').append(control);
    }
  }
  placeLanguage();
  // The existing language module injects its control after DOMContentLoaded.
  const languageObserver = new MutationObserver(placeLanguage);
  languageObserver.observe(document.body, { childList: true });
  if (!reducedMotion.matches) document.body.classList.add('motion-ready');

  const revealElements = document.querySelectorAll('.card, .howto-card, .about-item');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    revealElements.forEach(el => { el.classList.add('reveal'); revealObserver.observe(el); });
  }

  const stage = document.querySelector('.book-stage');
  const book = document.querySelector('.book-object');
  const entrance = document.querySelector('.book-entrance');
  const hero = document.querySelector('.hero');
  const replay = document.querySelector('.book-replay');
  let introAnimations = [];
  let introRunning = false;
  let introToken = 0;
  function resetBook() {
    book.style.removeProperty('--rx');
    book.style.removeProperty('--ry');
    book.style.removeProperty('--rz');
  }
  stage.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || introRunning) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    book.style.setProperty('--rx', `${1 - y * 9}deg`);
    book.style.setProperty('--ry', `${-9 + x * 16}deg`);
    book.style.setProperty('--rz', `${-3 + x * 2}deg`);
  });
  stage.addEventListener('pointerleave', resetBook);
  stage.addEventListener('pointercancel', resetBook);

  function stopIntro() {
    introToken++;
    introRunning = false;
    introAnimations.forEach(animation => animation.cancel());
    introAnimations = [];
    hero.classList.remove('book-intro-active');
    resetBook();
  }
  async function playBookIntro() {
    stopIntro();
    if (reducedMotion.matches || !entrance.animate) return;
    const heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom < 160 || heroRect.top > innerHeight) return;
    const token = introToken;
    const rect = entrance.getBoundingClientRect();
    const mobile = innerWidth <= 760;
    const dx = mobile ? Math.min(rect.width * .32, innerWidth * .2) : heroRect.left + heroRect.width * .54 - (rect.left + rect.width / 2);
    const dy = mobile ? -14 : heroRect.top + heroRect.height * .5 - (rect.top + rect.height / 2);
    const center = `translate(${dx}px, ${dy}px) scale(${mobile ? .78 : 1.04})`;
    const timing = { duration: 4300, fill: 'both', easing: 'linear' };
    introRunning = true;
    resetBook();
    hero.classList.add('book-intro-active');
    const animate = (element, keyframes) => {
      const animation = element.animate(keyframes, timing);
      introAnimations.push(animation);
      return animation;
    };
    animate(entrance, [
      { transform: 'none', offset: 0 },
      { transform: center, offset: .16, easing: 'ease-in-out' },
      { transform: center, offset: .79, easing: 'cubic-bezier(.2,.7,.2,1)' },
      { transform: 'none', offset: 1 }
    ]);
    animate(document.querySelector('.hero-inner'), [
      { opacity: 1, offset: 0 }, { opacity: mobile ? 1 : .22, offset: .16 },
      { opacity: mobile ? 1 : .22, offset: .78 }, { opacity: 1, offset: 1 }
    ]);
    animate(book, [
      { transform: 'rotateX(1deg) rotateY(-9deg) rotateZ(-3deg)', offset: 0 },
      { transform: 'rotateX(5deg) rotateY(-5deg) rotateZ(0deg)', offset: .16 },
      { transform: 'rotateX(5deg) rotateY(-5deg) rotateZ(0deg)', offset: .79 },
      { transform: 'rotateX(1deg) rotateY(-9deg) rotateZ(-3deg)', offset: 1 }
    ]);
    animate(document.querySelector('.book-front'), [
      { transform: 'translateZ(8px) rotateY(0deg)', offset: 0 },
      { transform: 'translateZ(8px) rotateY(0deg)', offset: .18, easing: 'cubic-bezier(.4,0,.2,1)' },
      { transform: 'translateZ(8px) rotateY(-148deg)', offset: .38 },
      { transform: 'translateZ(8px) rotateY(-148deg)', offset: .62, easing: 'cubic-bezier(.4,0,.2,1)' },
      { transform: 'translateZ(8px) rotateY(0deg)', offset: .79 },
      { transform: 'translateZ(8px) rotateY(0deg)', offset: 1 }
    ]);
    for (const [selector, from, to, z] of [['.leaf-two', .32, .49, 4], ['.leaf-one', .42, .59, 2]]) {
      animate(document.querySelector(selector), [
        { transform: `translateZ(${z}px) rotateY(0deg)`, offset: 0 },
        { transform: `translateZ(${z}px) rotateY(0deg)`, offset: from, easing: 'ease-in-out' },
        { transform: `translateZ(${z}px) rotateY(-145deg)`, offset: to },
        { transform: `translateZ(${z}px) rotateY(-145deg)`, offset: .62, easing: 'ease-in-out' },
        { transform: `translateZ(${z}px) rotateY(0deg)`, offset: .76 },
        { transform: `translateZ(${z}px) rotateY(0deg)`, offset: 1 }
      ]);
    }
    await Promise.allSettled(introAnimations.map(animation => animation.finished));
    if (token === introToken) stopIntro();
  }
  replay.addEventListener('click', playBookIntro);
  window.addEventListener('scroll', () => { if (introRunning) stopIntro(); }, { passive: true });
  window.addEventListener('resize', () => { if (introRunning) stopIntro(); }, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') stopIntro(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopIntro(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stopIntro(); });
  const onLoaded = () => {
    // Layout has settled and the real cover is loaded before the page-turn begins.
    requestAnimationFrame(() => requestAnimationFrame(playBookIntro));
  };
  if (document.readyState === 'complete') onLoaded();
  else window.addEventListener('load', onLoaded, { once: true });

  const canvas = document.querySelector('.hero-dots');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let points = [], width = 0, height = 0, frame = 0, start = 0;
  let assembled = reducedMotion.matches, inView = true;
  const duration = 1700;
  // Deterministic scatter keeps each load's composition consistent.
  const noise = value => {
    const n = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
    return n - Math.floor(n);
  };
  function resize() {
    width = hero.clientWidth; height = hero.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    points = [];
    const step = width < 760 ? 18 : 17;
    for (let y = 10; y < height; y += step) {
      for (let x = width * .26; x < width; x += step) {
        const id = points.length;
        const wave = Math.sin(x / width * 9 + Math.cos(y / height * 5) * 1.8);
        const envelope = Math.sin(y / height * Math.PI);
        points.push({ x, y, sx: x + (noise(id) - .5) * 460, sy: y + (noise(id + 81) - .5) * 330,
          radius: .6 + (wave + 1) * .8 * envelope, alpha: .12 + (wave + 1) * .12,
          delay: noise(id + 22) * .24 });
      }
    }
    if (assembled) draw(1); else requestDraw();
  }
  function draw(progress) {
    ctx.clearRect(0, 0, width, height);
    for (const dot of points) {
      const local = Math.max(0, Math.min(1, (progress - dot.delay) / (1 - dot.delay)));
      const ease = 1 - Math.pow(1 - local, 4);
      const x = dot.sx + (dot.x - dot.sx) * ease;
      const y = dot.sy + (dot.y - dot.sy) * ease;
      ctx.fillStyle = `rgba(37,72,50,${dot.alpha * (.15 + ease * .85)})`;
      ctx.beginPath(); ctx.arc(x, y, dot.radius, 0, Math.PI * 2); ctx.fill();
    }
  }
  function tick(time) {
    frame = 0;
    if (!inView || document.hidden) return;
    if (!start) start = time;
    const progress = Math.min(1, (time - start) / duration);
    draw(progress);
    if (progress < 1) requestDraw(); else assembled = true;
  }
  function requestDraw() {
    if (!frame && inView && !document.hidden && !assembled) frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(resize).observe(hero);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) requestDraw();
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', requestDraw);
  reducedMotion.addEventListener('change', () => {
    resetBook();
    if (reducedMotion.matches) {
      assembled = true;
      cancelAnimationFrame(frame); frame = 0; draw(1);
    }
  });
  resize();
})();
