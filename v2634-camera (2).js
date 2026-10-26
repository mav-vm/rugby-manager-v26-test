'use strict';
/* v26.3.4-test - acquisizione FIR guidata e rettifica prospettica. */
(function () {
  const CAM = {
    stream: null, video: null, src: null, view: null, points: [],
    zoom: 1, panX: 0, panY: 0, drag: null, source: 'Scansione guidata'
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function closeStream() {
    CAM.stream?.getTracks().forEach(t => t.stop());
    CAM.stream = null;
  }

  function remove() {
    closeStream();
    document.querySelector('#v2634Camera')?.remove();
  }

  function modal(title) {
    remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal" id="v2634Camera">
        <div class="v2634-shell">
          <div class="v2634-head">
            <div><small>V26.3.4-test · Acquisizione FIR</small><h2>${esc(title)}</h2></div>
            <button id="v2634Close" class="outline">ANNULLA</button>
          </div>
          <div class="v2634-stage"></div>
          <div class="v2634-actions"></div>
        </div>
      </div>`);
    document.querySelector('#v2634Close').onclick = remove;
    return document.querySelector('#v2634Camera');
  }

  async function openCamera() {
    const m = modal('Inquadra il foglio FIR');
    const stage = m.querySelector('.v2634-stage');
    const actions = m.querySelector('.v2634-actions');
    stage.innerHTML = '<video playsinline autoplay muted></video><div class="v2634-guide"></div><div class="v2634-tip">Centra tutto il foglio nella cornice</div>';
    actions.innerHTML = '<button id="v2634Gallery" class="outline">SCEGLI FOTO</button><button id="v2634Shot" class="v2634-shutter" aria-label="Scatta"></button><input id="v2634File" type="file" accept="image/*" hidden>';
    CAM.video = stage.querySelector('video');
    try {
      CAM.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 2560 } },
        audio: false
      });
      CAM.video.srcObject = CAM.stream;
      await CAM.video.play();
    } catch (e) {
      console.error(e);
      stage.innerHTML = '<div class="v2634-error"><h3>Fotocamera non disponibile</h3><p>Controlla il permesso della fotocamera oppure scegli una foto già salvata.</p></div>';
    }
    actions.querySelector('#v2634Gallery').onclick = () => actions.querySelector('#v2634File').click();
    actions.querySelector('#v2634File').onchange = e => {
      const f = e.target.files?.[0];
      if (f) loadInput(f, 'Immagine importata');
    };
    actions.querySelector('#v2634Shot').onclick = () => {
      if (!CAM.video?.videoWidth) return toast('Fotocamera non pronta');
      const c = document.createElement('canvas');
      c.width = CAM.video.videoWidth;
      c.height = CAM.video.videoHeight;
      c.getContext('2d').drawImage(CAM.video, 0, 0);
      closeStream();
      openAdjust(c, 'Scansione fotocamera');
    };
  }

  async function loadInput(input, source) {
    try {
      closeStream();
      const c = await v264SourceCanvas(input);
      openAdjust(c, source);
    } catch (e) {
      console.error(e);
      toast('Immagine non leggibile');
    }
  }

  function fitPoints() {
    CAM.points = [{ x: .06, y: .06 }, { x: .94, y: .06 }, { x: .94, y: .94 }, { x: .06, y: .94 }];
  }

  function screenPoint(p, stage) {
    const r = stage.getBoundingClientRect();
    const iw = CAM.src.width, ih = CAM.src.height;
    const s = Math.min(r.width / iw, r.height / ih) * CAM.zoom;
    const w = iw * s, h = ih * s;
    const left = (r.width - w) / 2 + CAM.panX;
    const top = (r.height - h) / 2 + CAM.panY;
    return { x: left + p.x * w, y: top + p.y * h, left, top, w, h };
  }

  function drawOverlay() {
    const stage = document.querySelector('#v2634Camera .v2634-stage');
    if (!stage) return;
    const poly = stage.querySelector('.v2634-poly');
    const pts = CAM.points.map(p => screenPoint(p, stage));
    poly.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));
    stage.querySelectorAll('.v2634-corner').forEach((b, i) => {
      b.style.left = pts[i].x + 'px'; b.style.top = pts[i].y + 'px';
    });
    const c = CAM.view, p0 = screenPoint({ x: 0, y: 0 }, stage);
    c.style.width = p0.w + 'px'; c.style.height = p0.h + 'px';
    c.style.left = p0.left + 'px'; c.style.top = p0.top + 'px';
  }

  function openAdjust(src, source) {
    CAM.src = src; CAM.source = source; CAM.zoom = 1; CAM.panX = CAM.panY = 0; fitPoints();
    const m = modal('Regola i quattro angoli');
    const stage = m.querySelector('.v2634-stage');
    const actions = m.querySelector('.v2634-actions');
    stage.classList.add('adjust');
    stage.innerHTML = '<canvas></canvas><svg class="v2634-poly" width="100%" height="100%"><polygon fill="rgba(250,204,21,.12)" stroke="#facc15" stroke-width="3"/></svg>' + CAM.points.map((_, i) => `<button class="v2634-corner" data-i="${i}" aria-label="Angolo ${i + 1}"></button>`).join('') + '<div class="v2634-tip">Trascina i punti sui quattro angoli del foglio</div>';
    CAM.view = stage.querySelector('canvas');
    CAM.view.width = src.width; CAM.view.height = src.height;
    CAM.view.getContext('2d').drawImage(src, 0, 0);
    actions.innerHTML = '<button id="v2634Retake" class="outline">RIPETI SCATTO</button><div class="v2634-zoom"><button id="v2634Minus" class="outline">−</button><b id="v2634Zoom">100%</b><button id="v2634Plus" class="outline">+</button></div><button id="v2634Reset" class="outline">RIPRISTINA</button><button id="v2634Use" class="btn">RADDRIZZA E CONTINUA</button>';
    const apply = () => { actions.querySelector('#v2634Zoom').textContent = Math.round(CAM.zoom * 100) + '%'; drawOverlay(); };
    actions.querySelector('#v2634Minus').onclick = () => { CAM.zoom = clamp(CAM.zoom - .25, 1, 4); apply(); };
    actions.querySelector('#v2634Plus').onclick = () => { CAM.zoom = clamp(CAM.zoom + .25, 1, 4); apply(); };
    actions.querySelector('#v2634Reset').onclick = () => { CAM.zoom = 1; CAM.panX = CAM.panY = 0; fitPoints(); apply(); };
    actions.querySelector('#v2634Retake').onclick = openCamera;
    actions.querySelector('#v2634Use').onclick = () => { const out = rectify(); remove(); v2626Open(out, CAM.source + ' · prospettiva corretta'); };
    stage.querySelectorAll('.v2634-corner').forEach(b => {
      b.onpointerdown = e => { CAM.drag = { kind: 'corner', i: +b.dataset.i, id: e.pointerId }; b.setPointerCapture(e.pointerId); e.stopPropagation(); };
      b.onpointermove = e => {
        if (CAM.drag?.id !== e.pointerId) return;
        const sp = screenPoint({ x: 0, y: 0 }, stage), r = stage.getBoundingClientRect();
        CAM.points[CAM.drag.i] = { x: clamp((e.clientX - r.left - sp.left) / sp.w, 0, 1), y: clamp((e.clientY - r.top - sp.top) / sp.h, 0, 1) };
        drawOverlay();
      };
      b.onpointerup = b.onpointercancel = () => CAM.drag = null;
    });
    stage.onpointerdown = e => { if (e.target.closest('.v2634-corner')) return; CAM.drag = { kind: 'pan', id: e.pointerId, x: e.clientX, y: e.clientY, px: CAM.panX, py: CAM.panY }; stage.setPointerCapture(e.pointerId); };
    stage.onpointermove = e => { if (CAM.drag?.kind !== 'pan' || CAM.drag.id !== e.pointerId) return; CAM.panX = CAM.drag.px + e.clientX - CAM.drag.x; CAM.panY = CAM.drag.py + e.clientY - CAM.drag.y; drawOverlay(); };
    stage.onpointerup = stage.onpointercancel = () => CAM.drag = null;
    requestAnimationFrame(apply);
    addEventListener('resize', drawOverlay, { once: true });
  }

  function solve(A, b) {
    for (let i = 0; i < A.length; i++) {
      let p = i;
      for (let r = i + 1; r < A.length; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
      let d = A[i][i] || 1e-12;
      for (let j = i; j < A.length; j++) A[i][j] /= d;
      b[i] /= d;
      for (let r = 0; r < A.length; r++) if (r !== i) {
        let f = A[r][i];
        for (let j = i; j < A.length; j++) A[r][j] -= f * A[i][j];
        b[r] -= f * b[i];
      }
    }
    return b;
  }

  function homography(dst, src) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const { x, y } = dst[i], X = src[i].x, Y = src[i].y;
      A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X);
      A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y);
    }
    return solve(A, b);
  }

  function rectify() {
    const p = CAM.points.map(q => ({ x: q.x * CAM.src.width, y: q.y * CAM.src.height }));
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const W = Math.round(Math.max(dist(p[0], p[1]), dist(p[3], p[2])));
    const H = Math.round(Math.max(dist(p[0], p[3]), dist(p[1], p[2])));
    const max = 2400, scale = Math.min(1, max / Math.max(W, H));
    const w = Math.max(600, Math.round(W * scale)), h = Math.max(800, Math.round(H * scale));
    const H8 = homography([{ x: 0, y: 0 }, { x: w - 1, y: 0 }, { x: w - 1, y: h - 1 }, { x: 0, y: h - 1 }], p);
    const src = CAM.src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, CAM.src.width, CAM.src.height);
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const ctx = out.getContext('2d'), im = ctx.createImageData(w, h), sd = src.data, od = im.data, sw = CAM.src.width, sh = CAM.src.height;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const den = H8[6] * x + H8[7] * y + 1;
      const sx = (H8[0] * x + H8[1] * y + H8[2]) / den, sy = (H8[3] * x + H8[4] * y + H8[5]) / den;
      const ix = clamp(Math.round(sx), 0, sw - 1), iy = clamp(Math.round(sy), 0, sh - 1);
      const si = (iy * sw + ix) * 4, di = (y * w + x) * 4;
      od[di] = sd[si]; od[di + 1] = sd[si + 1]; od[di + 2] = sd[si + 2]; od[di + 3] = 255;
    }
    ctx.putImageData(im, 0, 0); return out;
  }

  function decorate() {
    const scan = document.querySelector('#awayScan');
    const img = document.querySelector('#awayImage');
    const manual = document.querySelector('#manualAway');
    const finalStep = document.querySelector('.final-step');

    /* Percorso 2: acquisizione diretta con fotocamera. */
    if (scan && !scan.dataset.v2634) {
      scan.dataset.v2634 = '1';
      const label = scan.closest('label.upload');

      if (label) {
        label.classList.add('v2634-camera-path');
        label.innerHTML = `
          <span class="v2634-path-number">2</span>
          <span class="v2634-photo-icon" aria-hidden="true">📷</span>
          <b>Acquisisci con fotocamera</b>
          <small>Fotocamera guidata con calibrazione e OCR</small>`;
        label.setAttribute('role', 'button');
        label.setAttribute('tabindex', '0');
        label.setAttribute('aria-label', 'Apri la fotocamera per acquisire il foglio FIR');
        label.onclick = e => {
          e.preventDefault();
          openCamera();
        };
        label.onkeydown = e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCamera();
          }
        };
      }
    }

    /* Percorso 3: immagine gia presente sul telefono. */
    if (img && !img.dataset.v2634) {
      img.dataset.v2634 = '1';
      const imageLabel = img.closest('label.upload');
      const imageNumber = imageLabel?.querySelector(':scope > span');
      if (imageNumber) imageNumber.textContent = '3';

      img.onchange = e => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) loadInput(f, 'Immagine importata');
      };
    }

    /* Percorso 4: inserimento manuale. */
    const manualNumber = manual?.querySelector(':scope > span');
    if (manualNumber) manualNumber.textContent = '4';

    /* Il tabellone diventa il passo 5. */
    const finalNumber = finalStep?.querySelector('small');
    if (finalNumber) finalNumber.textContent = 'PASSO 5';
  }

  const baseReport = generateReport;
  generateReport = function (m) { return String(baseReport(m)).replace(/^FAC SIMILE\s*/i, ''); };
  const baseSetup = setup;
  setup = function () { baseSetup(); decorate(); };
  const baseSource = v2626Source;
  v2626Source = async function (input) { if (input instanceof HTMLCanvasElement) return input; return baseSource(input); };
  const oldOpen = v2626Open;
  v2626Open = function (input, source) {
    if (input instanceof HTMLCanvasElement) { V2626.file = input; V2626.source = source; return oldOpen(input, source); }
    return oldOpen(input, source);
  };
  window.V2634_CAMERA = { open: openCamera, adjust: loadInput };
  setup();
})();
