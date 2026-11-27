/* =========================================================
   Mercurius Hub – Black Friday scroll animation engine
   Apple-style image sequence: an AI video is exploded into
   frames (ImageBitmaps) and drawn to a canvas, scrubbed by
   scroll (GSAP ScrollTrigger, scrub: true).
   ========================================================= */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);

export function initPage(cfg) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth < 860;

  /* ---------- CTA links with UTM ---------- */
  document.querySelectorAll('[data-cta]').forEach(a => {
    const u = new URL(a.dataset.url || cfg.productUrl);   // data-url: other product (variant cards)
    u.searchParams.set('utm_source', 'bf-landing');
    u.searchParams.set('utm_medium', 'landingpage');
    u.searchParams.set('utm_campaign', 'blackfriday2026');
    u.searchParams.set('utm_content', a.dataset.cta);
    a.href = u.toString();
  });

  /* ---------- variant sliders: prev/next buttons ---------- */
  document.querySelectorAll('[data-slider]').forEach(wrap => {
    const track = wrap.querySelector('.slider');
    const step = () => (track.firstElementChild ? track.firstElementChild.offsetWidth + 16 : 300);
    const prev = wrap.querySelector('[data-prev]'), next = wrap.querySelector('[data-next]');
    const sync = () => {
      if (prev) prev.disabled = track.scrollLeft < 8;
      if (next) next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
      const nav = wrap.querySelector('.slider-nav');
      if (nav) nav.style.visibility = track.scrollWidth > track.clientWidth + 8 ? 'visible' : 'hidden';
    };
    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync); sync();
  });

  /* ---------- countdown ---------- */
  const end = new Date(cfg.dealEnd);
  const cd = document.querySelectorAll('[data-countdown]');
  const tick = () => {
    let ms = Math.max(0, end - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const s = Math.floor(ms / 1e3);
    const p = n => String(n).padStart(2, '0');
    cd.forEach(el => {
      if (el.dataset.countdown === 'short') el.textContent = `${d}d ${p(h)}:${p(m)}:${p(s)}`;
      else el.querySelectorAll('[data-u]').forEach(b => { b.textContent = { d, h: p(h), m: p(m), s: p(s) }[b.dataset.u]; });
    });
  };
  tick(); setInterval(tick, 1000);

  /* ---------- sticky chrome: topbar + header; the stage sits right below ---------- */
  let hdr = 0;
  const measure = () => {
    const tb = document.querySelector('.topbar');
    const hd = document.querySelector('.site-header');
    const t = tb ? tb.offsetHeight : 0;
    hdr = t + (hd ? hd.offsetHeight : 0);
    document.documentElement.style.setProperty('--tb', t + 'px');
    document.documentElement.style.setProperty('--hdr', hdr + 'px');
  };
  measure();
  addEventListener('resize', measure);

  /* ---------- buy bar ---------- */
  const story = document.getElementById('story');
  const bar = document.getElementById('buybar');
  const onScroll = () => {
    const storyEnd = story.offsetTop + story.offsetHeight - innerHeight;
    bar && bar.classList.toggle('show', mobile() ? scrollY > storyEnd : scrollY > innerHeight * 0.85);
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- canvas + frames ---------- */
  const canvas = document.getElementById('seq');
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const loaderPct = document.getElementById('loaderPct');
  const loaderBar = document.getElementById('loaderBar');
  const panels = [...document.querySelectorAll('[data-from]')];
  const progressEl = document.getElementById('storyProgress');
  const frames = [];
  let useVideo = false, video;
  let target = 0, current = 0, lastDrawn = -1;

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    lastDrawn = -1;
  }
  addEventListener('resize', size);
  size();

  // draw "cover", keeping the product (focus point) in view on narrow screens
  function drawCover(src, sw, sh) {
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / sw, ch / sh);
    const dw = sw * scale, dh = sh * scale;
    const fx = mobile() ? (seqFocus ?? cfg.focusX ?? 0.7) : 0.5;
    const fy = mobile() ? cfg.focusY ?? 0.5 : 0.5;
    let dx = cw / 2 - dw * fx, dy = ch / 2 - dh * fy;
    dx = Math.min(0, Math.max(cw - dw, dx));
    dy = Math.min(0, Math.max(ch - dh, dy));
    ctx.drawImage(src, dx, dy, dw, dh);
  }

  function setProgress(p) {
    if (loaderBar) loaderBar.style.width = p + '%';
    if (loaderPct) loaderPct.textContent = Math.round(p) + '%';
  }

  // Preferred path: pre-rendered WebP sequence (cfg.sequence = { d: {count}, m: {count, focusX} }),
  // served from ./frames/d/001.webp … and ./frames/m/001.webp …
  let seqFocus = null;
  async function loadSequence() {
    const key = mobile() ? 'm' : 'd';
    const set = cfg.sequence[key];
    seqFocus = set.focusX ?? null;
    const n = set.count;
    const base = (cfg.sequence.base || 'frames/') + key + '/';
    frames.length = n;
    let done = 0, failed = 0;
    const load = i => new Promise(res => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
          frames[i] = img; done++;
          if (i === 0) { lastDrawn = -1; render(true); }
          setProgress((done / n) * 100); res();
        });
      };
      img.onerror = () => { failed++; done++; res(); };
      img.src = base + String(i + 1).padStart(3, '0') + '.webp';
    });
    await load(0);
    if (!frames[0]) throw new Error('sequence');
    // load the rest with limited concurrency
    let next = 1;
    const worker = async () => { while (next < n) await load(next++); };
    await Promise.all(Array.from({ length: 6 }, worker));
    if (failed > n * 0.2) throw new Error('sequence');
  }

  async function extract() {
    if (cfg.sequence) {
      try { await loadSequence(); return; } catch (e) { frames.length = 0; seqFocus = null; }
    }
    video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.preload = 'auto';
    if (cfg.videoCors) video.crossOrigin = 'anonymous';
    video.src = cfg.video;
    await new Promise((res, rej) => {
      video.addEventListener('loadeddata', res, { once: true });
      video.addEventListener('error', () => rej(new Error('video')), { once: true });
      video.load();
    });
    const n = mobile() ? (cfg.mobileFrames || 72) : (cfg.frames || 120);
    const dur = video.duration || 5;
    const w = Math.min(video.videoWidth, mobile() ? 960 : 1600);
    const h = Math.round(w * video.videoHeight / video.videoWidth);
    for (let i = 0; i < n; i++) {
      video.currentTime = Math.min(dur - 0.04, (dur * i) / (n - 1));
      await new Promise(r => video.addEventListener('seeked', r, { once: true }));
      try {
        frames[i] = await createImageBitmap(video, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
      } catch (e) {
        useVideo = true; break;   // fall back to scrubbing the video element itself
      }
      if (i === 0) { lastDrawn = -1; render(true); }
      setProgress(((i + 1) / n) * 100);
    }
  }

  function render(force) {
    if (useVideo) {
      if (!video || !video.duration) return;
      const t = clamp(current) * (video.duration - 0.05);
      if (Math.abs(video.currentTime - t) > 0.02) video.currentTime = t;
      drawCover(video, video.videoWidth, video.videoHeight);
      return;
    }
    const n = frames.length;
    if (!n) return;
    let idx = Math.min(n - 1, Math.round(clamp(current) * (n - 1)));
    while (idx > 0 && !frames[idx]) idx--;          // nearest loaded frame
    if (!frames[idx] || (idx === lastDrawn && !force)) return;
    const f = frames[idx];
    drawCover(f, f.naturalWidth || f.width, f.naturalHeight || f.height);
    lastDrawn = idx;
  }

  function overlays(p) {
    panels.forEach(el => {
      const a = +el.dataset.from, b = +el.dataset.to, f = 0.04;
      let o = 0;
      if (p >= a - f && p <= b + f) o = p < a ? smooth((p - (a - f)) / f) : p > b ? 1 - smooth((p - b) / f) : 1;
      if (a === 0 && p < a) o = 1;
      if (b >= 1 && p > b) o = 1;
      el.style.opacity = o;
      el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      el.style.translate = `0 ${(1 - o) * (p < a ? 30 : -30)}px`;
    });
    if (progressEl) progressEl.style.transform = `scaleX(${p})`;
    document.documentElement.style.setProperty('--p', p.toFixed(4));
  }

  function storyProgress() {
    const r = story.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp((hdr - r.top) / total) : 0;
  }

  if (reduce) {
    document.body.classList.add('static-story');
    target = current = 1;
  } else if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: story, start: () => `top ${hdr}px`, end: 'bottom bottom', invalidateOnRefresh: true, scrub: true, onUpdate: s => { target = s.progress; } });
  } else {
    addEventListener('scroll', () => { target = storyProgress(); }, { passive: true });
  }
  target = current = reduce ? 1 : storyProgress();

  function loop() {
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.0005) current = target;
    render(false);
    overlays(current);
    requestAnimationFrame(loop);
  }

  extract()
    .catch(() => { useVideo = true; })
    .finally(() => {
      loader && loader.classList.add('done');
      lastDrawn = -1;
      requestAnimationFrame(loop);
    });
  // never block longer than 12s
  setTimeout(() => loader && loader.classList.add('done'), 12000);

  /* ---------- reveals ---------- */
  addEventListener('load', () => {
    if (!window.gsap || reduce) return;
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.from(el, { opacity: 0, y: 36, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
  });
}
