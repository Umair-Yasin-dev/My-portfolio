/* =========================================================
   scene.js — interactive 3D background (Three.js r128)
   · Scroll-driven: core glides right → left across sections
   · NO mouse parallax, NO click pulse
   · Lightweight particles + floating shapes
   ========================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 900;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.02);

  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  var COLORS = { cyan: 0x22d3ee, violet: 0x8b5cf6, pink: 0xff3fa4 };

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x404060, 0.7));

  var lightCyan = new THREE.PointLight(COLORS.cyan, 1.4, 34);
  lightCyan.position.set(6, 4, 6);
  scene.add(lightCyan);

  var lightPink = new THREE.PointLight(COLORS.pink, 1.2, 34);
  lightPink.position.set(-6, -3, 5);
  scene.add(lightPink);

  var lightViolet = new THREE.PointLight(COLORS.violet, 1.2, 34);
  lightViolet.position.set(0, 6, -4);
  scene.add(lightViolet);

  /* ---------- Hero object: core + rings ---------- */
  var rig = new THREE.Group();   // fixed at origin (no mouse parallax)
  scene.add(rig);

  var hero = new THREE.Group();  // scroll-driven position & scale
  hero.scale.setScalar(0.001);   // grows in on load
  rig.add(hero);

  var solid = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.MeshStandardMaterial({
      color: 0x0c1226, metalness: 0.85, roughness: 0.28, flatShading: true,
      emissive: 0x160b36, emissiveIntensity: 0.7
    })
  );
  hero.add(solid);

  var wireInner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.05, 1),
    new THREE.MeshBasicMaterial({ color: COLORS.cyan, wireframe: true, transparent: true, opacity: 0.35 })
  );
  hero.add(wireInner);

  var wireOuter = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.75, 0),
    new THREE.MeshBasicMaterial({ color: COLORS.violet, wireframe: true, transparent: true, opacity: 0.2 })
  );
  hero.add(wireOuter);

  // Orbit rings, each with a glowing satellite
  var rings = [];
  [
    { r: 3.3, tilt: [1.2, 0.2], color: COLORS.cyan, speed: 0.5 },
    { r: 3.9, tilt: [0.4, 1.1], color: COLORS.violet, speed: -0.38 },
    { r: 4.5, tilt: [-0.8, -0.5], color: COLORS.pink, speed: 0.28 }
  ].forEach(function (cfg) {
    var tilt = new THREE.Group();
    tilt.rotation.set(cfg.tilt[0], cfg.tilt[1], 0);
    var spinner = new THREE.Group();
    spinner.add(new THREE.Mesh(
      new THREE.TorusGeometry(cfg.r, 0.012, 8, 180),
      new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.5 })
    ));
    var sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      new THREE.MeshBasicMaterial({ color: cfg.color })
    );
    sat.position.x = cfg.r;
    spinner.add(sat);
    tilt.add(spinner);
    hero.add(tilt);
    rings.push({ spinner: spinner, speed: cfg.speed });
  });

  /* ---------- Floating wireframe shapes ---------- */
  var shapes = new THREE.Group();
  rig.add(shapes);
  var floaters = [];
  var shapeDefs = [
    new THREE.OctahedronGeometry(0.5),
    new THREE.TetrahedronGeometry(0.55),
    new THREE.TorusKnotGeometry(0.32, 0.09, 64, 8),
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.IcosahedronGeometry(0.4, 0),
    new THREE.TorusGeometry(0.38, 0.1, 8, 24),
    new THREE.OctahedronGeometry(0.35),
    new THREE.TetrahedronGeometry(0.4)
  ];
  var palette = [COLORS.cyan, COLORS.violet, COLORS.pink];
  var shapeCount = isMobile ? 5 : shapeDefs.length;

  for (var i = 0; i < shapeCount; i++) {
    var m = new THREE.Mesh(
      shapeDefs[i],
      new THREE.MeshBasicMaterial({ color: palette[i % 3], wireframe: true, transparent: true, opacity: 0.4 })
    );
    var a = (i / shapeCount) * Math.PI * 2 + Math.random() * 0.6;
    var rad = 6.5 + Math.random() * 4;
    m.position.set(Math.cos(a) * rad, (Math.random() - 0.5) * 8, -5 + Math.random() * 7);
    m.userData = {
      y: m.position.y,
      speed: 0.4 + Math.random() * 0.6,
      phase: Math.random() * 6.28,
      rx: (Math.random() - 0.5) * 0.012,
      ry: (Math.random() - 0.5) * 0.016
    };
    shapes.add(m);
    floaters.push(m);
  }

  /* ---------- Particle field ---------- */
  function makeSprite() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  var count = isMobile ? 250 : 500;
  var pos = new Float32Array(count * 3);
  var col = new Float32Array(count * 3);
  var tmp = new THREE.Color();
  for (var p = 0; p < count; p++) {
    var r = 5 + Math.random() * 22;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pos[p * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[p * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[p * 3 + 2] = r * Math.cos(phi);
    tmp.setHex(palette[Math.floor(Math.random() * 3)]);
    tmp.multiplyScalar(0.6 + Math.random() * 0.4);
    col[p * 3] = tmp.r; col[p * 3 + 1] = tmp.g; col[p * 3 + 2] = tmp.b;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  var points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.08, map: makeSprite(), vertexColors: true, transparent: true,
    opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(points);

  /* ---------- Section-aware layout: [x, y, scale] ---------- */
  var LAYOUT = {
    desktop: {
      home:     [ 4.4, 0, 1.00],   // right side
      about:    [ 2.0, 0, 0.85],   // slowly moving left
      skills:   [-2.0, 0, 0.70],   // further left
      projects: [-5.0, 0, 0.60],   // more left
      contact:  [-6.5, 0, 0.55]    // far left
    },
    mobile: {
      home:     [0, 2.7, 0.62],
      about:    [0, 3.3, 0.40],
      skills:   [0, 3.3, 0.40],
      projects: [0, 3.3, 0.40],
      contact:  [0, 3.3, 0.40]
    }
  };

  var sectionEls = ['home', 'about', 'skills', 'projects', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function currentTarget() {
    var probe = window.scrollY + window.innerHeight * 0.5;
    var id = 'home';
    for (var s = 0; s < sectionEls.length; s++) {
      if (sectionEls[s].offsetTop <= probe) id = sectionEls[s].id;
    }
    return (isMobile ? LAYOUT.mobile : LAYOUT.desktop)[id];
  }

  /* ---------- Prevent click / dblclick / right-click ---------- */
  canvas.addEventListener('mousedown', function (e) { e.preventDefault(); });
  canvas.addEventListener('dblclick', function (e) { e.preventDefault(); });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------- Resize ---------- */
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    isMobile = w < 900;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 66 : 55;
    camera.updateProjectionMatrix();
    if (reduceMotion) renderer.render(scene, camera);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- Render loop (fixed camera, scroll-driven hero) ---------- */
  var clock = new THREE.Clock();
  var raf = null;

  function frame() {
    raf = requestAnimationFrame(frame);
    var t = clock.getElapsedTime();

    // Self rotation
    solid.rotation.y = t * 0.25;
    solid.rotation.x = t * 0.12;
    wireInner.rotation.y = -t * 0.18;
    wireInner.rotation.z = t * 0.1;
    wireOuter.rotation.x = t * 0.08;
    wireOuter.rotation.y = t * 0.12;

    for (var r = 0; r < rings.length; r++) {
      rings[r].spinner.rotation.z = t * rings[r].speed;
    }

    for (var f = 0; f < floaters.length; f++) {
      var m = floaters[f], d = m.userData;
      m.position.y = d.y + Math.sin(t * d.speed + d.phase) * 0.45;
      m.rotation.x += d.rx;
      m.rotation.y += d.ry;
    }

    points.rotation.y = t * 0.018;
    points.rotation.x = t * 0.006;

    // Scroll: glide hero from RIGHT → LEFT across sections (slow)
    var target = currentTarget();
    hero.position.x += (target[0] - hero.position.x) * 0.035;   // slower glide
    hero.position.y += (target[1] - hero.position.y) * 0.035;

    var s = hero.scale.x + (target[2] - hero.scale.x) * 0.05;
    hero.scale.setScalar(s);

    // Camera FIXED — no mouse parallax
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Lights FIXED
    lightCyan.position.set(6, 4, 6);
    lightPink.position.set(-6, -3, 5);
    lightViolet.position.set(0, 6, -4);

    renderer.render(scene, camera);
  }

  function start() { if (!raf && !reduceMotion) frame(); }
  function stop() { cancelAnimationFrame(raf); raf = null; }

  if (reduceMotion) {
    hero.scale.setScalar(1);
    hero.position.set(isMobile ? 0 : 4.4, isMobile ? 2.7 : 0, 0);
    renderer.render(scene, camera);
  } else {
    start();
  }

  // Save battery when the tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
})();