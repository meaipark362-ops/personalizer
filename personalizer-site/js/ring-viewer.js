/**
 * PERSONALIZER — Real-time 3D Ring Interactive Viewer
 * Architecture: Three.js (r128) + GLTFLoader
 * Model: assets/ring.glb (Single Source of Truth)
 *
 * Capabilities:
 *  - Procedural HDR Studio Environment via PMREMGenerator for authentic liquid-metal reflections
 *  - Auto bounding-box centering and responsive scale normalization
 *  - Multi-point studio lighting (Key, Fill, dual Rim lights, floor bounce)
 *  - Grounded contact shadow with radial soft falloff
 *  - Unified Pointer Events (mouse & touch drag) with velocity inertia damping
 *  - Smooth mouse parallax tilt & ambient floating breathing motion
 *  - Cinematic scroll-coupled rotation & depth translation
 *  - Luxury Finishes: Liquid Chrome (Silver) & Graphite Obsidian (Dark)
 *  - IntersectionObserver GPU throttle when hero section is out of viewport
 *  - Seamless graceful fallback to high-res picture if WebGL is unavailable or model load fails
 */

(function () {
  'use strict';

  // 1. WebGL Availability Check
  function isWebGLAvailable() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable() || typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
    return;
  }

  var container = document.getElementById('hero3dStage');
  if (!container) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Scene & Camera Setup
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  // 3. Renderer with ACES Filmic Tone Mapping & sRGB
  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // 4. Procedural Studio Environment Map for Liquid Metal Reflections
  function createStudioEnvironment(targetRenderer) {
    try {
      var pmrem = new THREE.PMREMGenerator(targetRenderer);
      pmrem.compileEquirectangularShader();

      var canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      var ctx = canvas.getContext('2d');

      // Studio background gradient (dark obsidian to slate gray)
      var bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#090a0d');
      bgGrad.addColorStop(0.5, '#14171d');
      bgGrad.addColorStop(1, '#060708');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Key overhead softbox strip (crisp white specular highlight on chamfer)
      var sb1 = ctx.createLinearGradient(0, 70, 0, 220);
      sb1.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sb1.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      sb1.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sb1;
      ctx.fillRect(180, 70, 520, 150);

      // Cool rim softbox on left (subtle blue-gray tint)
      var sb2 = ctx.createRadialGradient(160, 260, 20, 160, 260, 170);
      sb2.addColorStop(0, 'rgba(225, 238, 255, 0.88)');
      sb2.addColorStop(0.6, 'rgba(145, 175, 210, 0.30)');
      sb2.addColorStop(1, 'rgba(10, 15, 25, 0)');
      ctx.fillStyle = sb2;
      ctx.beginPath();
      ctx.arc(160, 260, 170, 0, Math.PI * 2);
      ctx.fill();

      // Sharp accent reflector on right (neutral silver)
      var sb3 = ctx.createRadialGradient(860, 230, 15, 860, 230, 190);
      sb3.addColorStop(0, 'rgba(250, 250, 255, 0.82)');
      sb3.addColorStop(0.7, 'rgba(165, 180, 200, 0.20)');
      sb3.addColorStop(1, 'rgba(5, 6, 8, 0)');
      ctx.fillStyle = sb3;
      ctx.beginPath();
      ctx.arc(860, 230, 190, 0, Math.PI * 2);
      ctx.fill();

      // Floor bounce soft reflection
      var sb4 = ctx.createLinearGradient(0, 380, 0, canvas.height);
      sb4.addColorStop(0, 'rgba(30, 35, 45, 0)');
      sb4.addColorStop(1, 'rgba(50, 60, 75, 0.40)');
      ctx.fillStyle = sb4;
      ctx.fillRect(0, 380, canvas.width, canvas.height - 380);

      var tex = new THREE.CanvasTexture(canvas);
      var env = pmrem.fromEquirectangular(tex).texture;
      pmrem.dispose();
      tex.dispose();
      return env;
    } catch (err) {
      console.warn('[Personalizer 3D] Procedural environment generation fallback.', err);
      return null;
    }
  }

  var studioEnv = createStudioEnvironment(renderer);
  if (studioEnv) {
    scene.environment = studioEnv;
  }

  // 5. Studio Directional & Ambient Lights (Calibrated for nuanced contrast without clipping)
  var ambientLight = new THREE.AmbientLight(0x22262c, 1.4);
  scene.add(ambientLight);

  // Key light: main top-right illumination
  var keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
  keyLight.position.set(5, 7, 6);
  scene.add(keyLight);

  // Fill light: opposite cool slate
  var fillLight = new THREE.DirectionalLight(0xa0b4c8, 1.3);
  fillLight.position.set(-6, -2, 4);
  scene.add(fillLight);

  // Rim light 1: crisp edge glints from top-left rear
  var rimLight1 = new THREE.DirectionalLight(0xffffff, 3.2);
  rimLight1.position.set(-4, 5, -5);
  scene.add(rimLight1);

  // Rim light 2: bottom-right metallic separation
  var rimLight2 = new THREE.DirectionalLight(0xcfd8e3, 2.2);
  rimLight2.position.set(4, -4, -4);
  scene.add(rimLight2);

  // Subtle floor bounce
  var bounceLight = new THREE.DirectionalLight(0x1e2025, 0.9);
  bounceLight.position.set(0, -6, 2);
  scene.add(bounceLight);

  // 6. Root & Model Pivot Groups
  var ringRoot = new THREE.Group();
  scene.add(ringRoot);

  var modelPivot = null;
  var ringMeshes = [];
  var isModelLoaded = false;
  var isVisible = true;

  // 7. Ground Contact Shadow
  var shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  var sCtx = shadowCanvas.getContext('2d');
  var sGrad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  sGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.42)');
  sGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.08)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 256, 256);

  var shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  var shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
  var shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });
  var shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -1.35, 0);
  ringRoot.add(shadowMesh);

  // 8. Luxury Finish Presets (Refined Silver Titanium & Graphite Obsidian)
  var FINISHES = {
    silver: {
      color: 0xe2e6ee,
      metalness: 0.97,
      roughness: 0.16,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5
    },
    graphite: {
      color: 0x1e2025,
      metalness: 0.95,
      roughness: 0.22,
      clearcoat: 0.35,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.2
    }
  };
  var currentFinishKey = 'silver';

  function applyFinish(key) {
    if (!FINISHES[key]) return;
    currentFinishKey = key;
    var preset = FINISHES[key];
    ringMeshes.forEach(function (mesh) {
      if (mesh.material) {
        mesh.material.color.setHex(preset.color);
        mesh.material.metalness = preset.metalness;
        mesh.material.roughness = preset.roughness;
        mesh.material.clearcoat = preset.clearcoat;
        mesh.material.clearcoatRoughness = preset.clearcoatRoughness;
        mesh.material.envMapIntensity = preset.envMapIntensity;
        mesh.material.needsUpdate = true;
      }
    });

    // Update finish toggle buttons if present in DOM
    var buttons = document.querySelectorAll('.finish-btn');
    buttons.forEach(function (btn) {
      var active = btn.getAttribute('data-finish') === key;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  // 9. Interaction & Animation Variables
  var isDragging = false;
  var prevPointerX = 0;
  var prevPointerY = 0;
  var dragVelocityX = 0;
  var dragVelocityY = 0;
  var userRotX = 0;
  var userRotY = 0;

  var mouseX = 0;
  var mouseY = 0;
  var targetMouseX = 0;
  var targetMouseY = 0;
  var scrollProgress = 0;

  // 10. Responsive Layout Calibration
  function updateLayout() {
    var width = container.clientWidth;
    var height = container.clientHeight;
    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    if (!ringRoot) return;

    var surveyWall = document.getElementById('heroSurveyWall');

    // Desktop (> 1100px): hero right-center, balanced luxury scale without clipping
    if (width > 1100) {
      ringRoot.position.set(1.75, 0.02, 0);
      ringRoot.scale.setScalar(1.15);
      if (surveyWall) surveyWall.style.top = '';
    } else if (width > 768) {
      // Tablet (769px ~ 1100px): clean right offset separating from left copy
      ringRoot.position.set(1.35, 0.02, 0);
      ringRoot.scale.setScalar(0.96);
      if (surveyWall) surveyWall.style.top = '';
    } else {
      // Mobile (<= 768px): center inside dedicated hero3dSpacer with calibrated scale to prevent any text overlap
      var spacer = document.getElementById('hero3dSpacer');
      if (spacer) {
        var rect = spacer.getBoundingClientRect();
        var cRect = container.getBoundingClientRect();
        if (rect.height > 0 && cRect.height > 0) {
          var spacerCenterY = (rect.top + rect.bottom) / 2 - cRect.top;
          var visibleHeight = 2 * 7.2 * Math.tan((camera.fov * Math.PI) / 360);
          var targetY = (1 - (spacerCenterY / cRect.height) * 2) * (visibleHeight / 2);
          ringRoot.position.set(0, targetY, 0);

          // Ring model diameter is ~2.35 units. Scale to fit ~76% of spacer height cleanly
          var targetPixelSize = Math.min(rect.height * 0.76, width * 0.62);
          var targetWorldSize = (targetPixelSize / cRect.height) * visibleHeight;
          var mobileScale = Math.max(0.28, Math.min(0.55, targetWorldSize / 2.35));
          ringRoot.scale.setScalar(mobileScale);

          if (surveyWall) {
            surveyWall.style.top = Math.round(spacerCenterY) + 'px';
            surveyWall.style.height = Math.round(rect.height * 1.1) + 'px';
          }
          return;
        }
      }
      // Fallback if spacer measurement not available
      ringRoot.position.set(0, 0.15, 0);
      ringRoot.scale.setScalar(0.40);
    }
  }

  // 11. Load GLB Model
  var loader = new THREE.GLTFLoader();
  var modelPath = 'assets/ring.glb';

  loader.load(
    modelPath,
    function (gltf) {
      modelPivot = new THREE.Group();
      var rawModel = gltf.scene;

      // Auto-compute bounding box and center origin
      var box = new THREE.Box3().setFromObject(rawModel);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z) || 1;

      rawModel.position.sub(center);

      // Normalize model scale so diameter = ~2.35 standard units
      var normScale = 2.35 / maxDim;
      rawModel.scale.setScalar(normScale);
      modelPivot.add(rawModel);

      // Upgrade mesh materials to high-precision Physical PBR
      ringMeshes = [];
      rawModel.traverse(function (child) {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.computeVertexNormals();
          }
          var initialPreset = FINISHES[currentFinishKey];
          var mat = new THREE.MeshPhysicalMaterial({
            color: initialPreset.color,
            metalness: initialPreset.metalness,
            roughness: initialPreset.roughness,
            clearcoat: initialPreset.clearcoat,
            clearcoatRoughness: initialPreset.clearcoatRoughness,
            reflectivity: 1.0,
            envMapIntensity: initialPreset.envMapIntensity,
            side: THREE.DoubleSide
          });
          child.material = mat;
          ringMeshes.push(child);
        }
      });

      // Cinematic initial standing angle revealing cylindrical curvature
      modelPivot.rotation.set(0.24, 1.28, 0.08);

      ringRoot.add(modelPivot);
      isModelLoaded = true;

      updateLayout();

      // Reveal 3D stage and show hint bar
      container.classList.add('is-loaded');
      var heroEl = document.querySelector('.hero');
      if (heroEl) heroEl.classList.add('has-3d-loaded');

      var hintBar = document.getElementById('hero3dBar');
      if (hintBar) hintBar.classList.add('is-visible');
      var legacyHint = document.getElementById('hero3dHint');
      if (legacyHint) legacyHint.classList.add('is-visible');
    },
    undefined,
    function (error) {
      console.warn('[Personalizer 3D] Failed to load GLB model. Falling back to static visual.', error);
    }
  );

  // 12. Pointer Event Handling (Unified Mouse & Touch Drag)
  function onPointerDown(e) {
    if (e.target.closest('a, button, input, label')) return;
    isDragging = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    dragVelocityX = 0;
    dragVelocityY = 0;
    if (container.setPointerCapture && e.pointerId !== undefined) {
      try { container.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }

  function onPointerMove(e) {
    var clientX = e.clientX;
    var clientY = e.clientY;

    // Track mouse for subtle parallax
    var rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      targetMouseX = ((clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((clientY - rect.top) / rect.height - 0.5) * 2;
    }

    if (!isDragging) return;

    var deltaX = clientX - prevPointerX;
    var deltaY = clientY - prevPointerY;

    dragVelocityX = deltaX * 0.0075;
    dragVelocityY = deltaY * 0.0075;

    userRotY += dragVelocityX;
    userRotX += dragVelocityY;

    prevPointerX = clientX;
    prevPointerY = clientY;
  }

  function onPointerUp(e) {
    isDragging = false;
    if (container.releasePointerCapture && e.pointerId !== undefined) {
      try { container.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  }

  // Bind pointer listeners on container
  container.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });

  // 13. Finish Switcher Buttons in DOM
  function initFinishToggle() {
    var buttons = document.querySelectorAll('.finish-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var finish = btn.getAttribute('data-finish');
        if (finish) applyFinish(finish);
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinishToggle);
  } else {
    initFinishToggle();
  }

  // 14. Scroll Parallax Sync
  function onScroll() {
    var heroEl = document.querySelector('.hero');
    if (!heroEl) return;
    var rect = heroEl.getBoundingClientRect();
    var heroHeight = rect.height || window.innerHeight;
    var scrolled = Math.max(0, -rect.top);
    scrollProgress = Math.min(2.0, scrolled / heroHeight);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateLayout, { passive: true });

  // 15. IntersectionObserver: Pause rendering when Hero is out of view
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.02 }
    );
    observer.observe(container);
  }

  // 16. Continuous Animation Loop
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    // Skip render computation when completely scrolled out of viewport
    if (!isVisible) return;

    var elapsedTime = clock.getElapsedTime();

    if (isModelLoaded && modelPivot) {
      // Drag velocity inertia damping
      if (!isDragging) {
        dragVelocityX *= 0.92;
        dragVelocityY *= 0.92;
        userRotY += dragVelocityX;
        userRotX += dragVelocityY;
      }

      // Smooth mouse parallax interpolation
      mouseX += (targetMouseX - mouseX) * 0.055;
      mouseY += (targetMouseY - mouseY) * 0.055;

      // Base auto rotation + breathing float
      var autoRotY = prefersReduced ? 0 : elapsedTime * 0.22;
      var floatOffset = prefersReduced ? 0 : Math.sin(elapsedTime * 1.25) * 0.065;
      var floatTilt = prefersReduced ? 0 : Math.cos(elapsedTime * 0.95) * 0.035;

      // Scroll-coupled kinematics: smoothly rotates and recedes into deep Z space
      var scrollRotX = -scrollProgress * 0.35;
      var scrollRotY = scrollProgress * 0.95;
      var scrollOffsetZ = -scrollProgress * 1.6;
      var scrollOffsetY = scrollProgress * 0.2; // subtle parallax following scroll downward

      // Compound rotation
      modelPivot.rotation.y = 1.22 + autoRotY + userRotY + scrollRotY + mouseX * 0.2;
      modelPivot.rotation.x = 0.28 + floatTilt + userRotX + scrollRotX - mouseY * 0.16;
      modelPivot.rotation.z = 0.1 + Math.sin(elapsedTime * 0.75) * 0.025 + mouseX * 0.08;

      // Compound position (float + scroll recoil)
      modelPivot.position.y = floatOffset + scrollOffsetY;
      modelPivot.position.z = scrollOffsetZ;

      // Dynamic glint motion on rim light
      rimLight1.position.x = -4 + Math.sin(elapsedTime * 0.85) * 2.2;
      rimLight1.position.z = -5 + Math.cos(elapsedTime * 0.85) * 2.2;
    }

    renderer.render(scene, camera);
  }

  // Expose API for external control
  window.PERSONALIZER_3D = {
    applyFinish: applyFinish,
    getFinish: function () { return currentFinishKey; }
  };

  // Kick off & re-calibrate on asset/font load
  updateLayout();
  window.addEventListener('load', updateLayout);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateLayout);
  }
  animate();
})();
