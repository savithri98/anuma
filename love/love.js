/* ════════════════════════════════════════════
   💕 LOVE PAGE — JavaScript (Three.js + FX)
════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────
// INTRO SCREEN
// ─────────────────────────────────────────────
(function spawnIntroParticles() {
    const container = document.getElementById('introParticles');
    const emojis = ['💗', '✨', '🌸', '💫', '⭐', '🌹', '💕', '🌟', '🦋'];
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.style.cssText = `
      position:absolute;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      font-size:${0.8 + Math.random() * 1.5}rem;
      opacity:${0.1 + Math.random() * 0.4};
      animation: ff ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 5}s infinite;
      transform-origin: center;
    `;
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        container.appendChild(p);
    }
})();

// Inject keyframe for floating
const ffStyle = document.createElement('style');
ffStyle.textContent = `@keyframes ff {
  0%,100%{transform:translate(0,0) rotate(0deg) scale(1);}
  33%{transform:translate(${10 + Math.random() * 20}px,${-10 - Math.random() * 20}px) rotate(15deg) scale(1.1);}
  66%{transform:translate(${-5 - Math.random() * 15}px,${5 + Math.random() * 15}px) rotate(-10deg) scale(0.9);}
}`;
document.head.appendChild(ffStyle);

document.getElementById('openBtn').addEventListener('click', () => {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main');
    intro.classList.add('exit');
    setTimeout(() => {
        intro.style.display = 'none';
        main.style.display = 'block';
        initMain();
    }, 1300);
});

// ─────────────────────────────────────────────
// INIT MAIN — everything starts here
// ─────────────────────────────────────────────
function initMain() {
    initThreeJS();
    spawnPetals();
    spawnFireflies();
    initScrollObservers();
    initConstelation();
    initReasonCards();
}

// ─────────────────────────────────────────────
// THREE.JS — STARFIELD + 3D HEART
// ─────────────────────────────────────────────
function initThreeJS() {
    const canvas = document.getElementById('threeCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // ── STARFIELD ──
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 200;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        const t = Math.random();
        starColors[i * 3] = 1;
        starColors[i * 3 + 1] = t > 0.5 ? 0.4 + t * 0.4 : 0.5;
        starColors[i * 3 + 2] = t > 0.5 ? 0.6 + t * 0.2 : 0.7 + t * 0.3;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, sizeAttenuation: true });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── 3D HEART built from parametric heart curve ──
    function heartPoint(t) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        return new THREE.Vector2(x / 16, y / 16);
    }

    const heartShape = new THREE.Shape();
    const pts = [];
    for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * Math.PI * 2;
        pts.push(heartPoint(t));
    }
    heartShape.setFromPoints(pts);

    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);

    // Build gradient colors for heart
    const colors = new Float32Array(heartGeo.attributes.position.count * 3);
    const pos = heartGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = (pos.getY(i) + 1) / 2; // normalize 0-1
        // rose to gold gradient
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.2 + y * 0.4;
        colors[i * 3 + 2] = 0.4 - y * 0.2;
    }
    heartGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const heartMat = new THREE.MeshPhongMaterial({
        vertexColors: true,
        shininess: 120,
        emissive: new THREE.Color(0.3, 0.02, 0.1),
        emissiveIntensity: 0.4,
    });

    const heart = new THREE.Mesh(heartGeo, heartMat);
    heart.position.set(0, 0.1, 0);
    heart.rotation.z = Math.PI;
    scene.add(heart);

    // ── HEART PARTICLES (orbiting) ──
    const orbGeo = new THREE.BufferGeometry();
    const orbCount = 400;
    const orbPos = new Float32Array(orbCount * 3);
    const orbCol = new Float32Array(orbCount * 3);
    const orbPhase = new Float32Array(orbCount);
    const orbRadius = new Float32Array(orbCount);
    for (let i = 0; i < orbCount; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI * 2;
        const r = 1.3 + Math.random() * 0.8;
        orbPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        orbPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        orbPos[i * 3 + 2] = r * Math.cos(phi);
        orbPhase[i] = Math.random() * Math.PI * 2;
        orbRadius[i] = r;
        const bright = 0.5 + Math.random() * 0.5;
        orbCol[i * 3] = bright;
        orbCol[i * 3 + 1] = bright * 0.3;
        orbCol[i * 3 + 2] = bright * 0.5;
    }
    orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPos, 3));
    orbGeo.setAttribute('color', new THREE.BufferAttribute(orbCol, 3));
    const orbMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.8 });
    const orbs = new THREE.Points(orbGeo, orbMat);
    orbs.position.set(0, 0.1, 0);
    scene.add(orbs);

    // ── LIGHTS ──
    const ambientLight = new THREE.AmbientLight(0xffeeff, 0.5);
    scene.add(ambientLight);

    const pinkLight = new THREE.PointLight(0xff3e7e, 3, 10);
    pinkLight.position.set(2, 2, 2);
    scene.add(pinkLight);

    const goldLight = new THREE.PointLight(0xffd580, 2, 10);
    goldLight.position.set(-2, -1, 1);
    scene.add(goldLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 5, 3);
    scene.add(rimLight);

    // ── Mouse parallax ──
    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ── Resize ──
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── ANIMATE ──
    let t = 0;
    function animate() {
        requestAnimationFrame(animate);
        t += 0.012;

        // Heart rotation
        heart.rotation.y = Math.sin(t * 0.5) * 0.4 + mouseX * 0.3;
        heart.rotation.x = Math.cos(t * 0.3) * 0.15 + mouseY * 0.15;

        // Heart breathing
        const scale = 1 + Math.sin(t * 1.5) * 0.04;
        heart.scale.set(scale, scale, scale);

        // Orb rotation
        orbs.rotation.y = t * 0.3;
        orbs.rotation.x = t * 0.15;

        // Star slow drift
        stars.rotation.y = t * 0.015;
        stars.rotation.x = t * 0.005;

        // Pulsing lights
        pinkLight.intensity = 3 + Math.sin(t * 1.8) * 1;
        goldLight.intensity = 2 + Math.cos(t * 1.4) * 0.8;
        pinkLight.position.x = 2 * Math.cos(t * 0.5);
        pinkLight.position.z = 2 * Math.sin(t * 0.5);

        // Camera subtle drift
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.04;
        camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.04;

        renderer.render(scene, camera);
    }
    animate();
}

// ─────────────────────────────────────────────
// FALLING PETALS
// ─────────────────────────────────────────────
function spawnPetals() {
    const container = document.getElementById('petalsContainer');
    const petals = ['🌸', '🌺', '🌹', '🏵️', '🌷'];
    let count = 0;
    function createPetal() {
        if (count > 40) return;
        const el = document.createElement('div');
        el.className = 'petal';
        el.textContent = petals[Math.floor(Math.random() * petals.length)];
        const left = Math.random() * 100;
        const dur = 10 + Math.random() * 15;
        const delay = Math.random() * 8;
        el.style.cssText = `left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s;font-size:${0.8 + Math.random() * 1.2}rem;`;
        container.appendChild(el);
        count++;
        // Recycle
        setTimeout(() => {
            el.remove();
            count--;
            createPetal();
        }, (dur + delay) * 1000);
    }
    for (let i = 0; i < 18; i++) setTimeout(createPetal, i * 500);
}

// ─────────────────────────────────────────────
// FIREFLIES
// ─────────────────────────────────────────────
function spawnFireflies() {
    const container = document.getElementById('fireflies');
    for (let i = 0; i < 25; i++) {
        const ff = document.createElement('div');
        ff.className = 'firefly';
        const dx = (Math.random() - 0.5) * 200;
        const dy = (Math.random() - 0.5) * 200;
        ff.style.cssText = `
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      --dx:${dx}px;
      --dy:${dy}px;
      animation-duration:${5 + Math.random() * 8}s;
      animation-delay:${Math.random() * 6}s;
      width:${2 + Math.random() * 3}px;
      height:${2 + Math.random() * 3}px;
    `;
        container.appendChild(ff);
    }
}

// ─────────────────────────────────────────────
// SCROLL OBSERVERS
// ─────────────────────────────────────────────
function initScrollObservers() {
    // Reason cards
    const reasonObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = +entry.target.dataset.delay || 0;
                setTimeout(() => entry.target.classList.add('visible'), delay);
                reasonObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    document.querySelectorAll('.reason-card').forEach(c => reasonObs.observe(c));

    // Promise items
    const promiseObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.promise-item').forEach((item, i) => {
                    setTimeout(() => item.classList.add('visible'), i * 150);
                });
                promiseObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    const promiseSection = document.querySelector('.promise-section');
    if (promiseSection) promiseObs.observe(promiseSection);
}

// ─────────────────────────────────────────────
// REASON CARDS — random appear transitions
// ─────────────────────────────────────────────
function initReasonCards() {
    const style = document.createElement('style');
    style.textContent = `.reason-card.visible { opacity:1!important; transform:translateY(0)!important; }`;
    document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// LOVE LETTER
// ─────────────────────────────────────────────
const letterText = `ಅಮ್ಮು, ನಾನು ಕಣ್ಣು ಮುಚ್ಚಿದಾಗಲೆಲ್ಲ ನಿನ್ನ ಮುಖ ಕಾಣಿಸುತ್ತದೆ.
ಪ್ರತಿ ಹಾಡು ನಿನ್ನ ನಗುವನ್ನು ನೆನಪಿಸುತ್ತದೆ.
ನೀನು ನನಗೆ ಹೇಗೆ ಭಾಸವಾಗುತ್ತೀ ಎಂದು ವಿವರಿಸಲು ಸಾಕಷ್ಟು ಸುಂದರ ಶಬ್ದಗಳನ್ನು ಹುಡುಕಿದ್ದೇನೆ —
ಆದರೆ ಅಂತಹ ಶಬ್ದಗಳೇ ಇಲ್ಲ ಎಂದು ಅರಿತಿದ್ದೇನೆ.

ಅಮ್ಮು, ನೀನು ನನಗೆ ಕಾರಣವಿಲ್ಲದೆ ನಗಿಸಲು ಕಾರಣ.
ನನ್ನ ತಣ್ಣನೆಯ ದಿನಗಳಲ್ಲಿ ಬೆಚ್ಚಗಿನ ಬೆಳಕು,
ನನ್ನ ಕತ್ತಲ ರಾತ್ರಿಗಳಲ್ಲಿ ಒಂದು ದೀಪ,
ಮತ್ತು ನಾನು ಹುಡುಕುತ್ತಿದ್ದೆ ಎಂದು ತಿಳಿಯದ ಮನೆ.

ನಕ್ಷತ್ರಗಳು ರಾತ್ರಿ ಆಕಾಶವನ್ನು ಪ್ರೀತಿಸುವಷ್ಟು ನಾನು ನಿನ್ನನ್ನು ಪ್ರೀತಿಸುತ್ತೇನೆ —
ಅಂತ್ಯವಿಲ್ಲದೆ, ನಂಬಿಕೆಯಿಂದ, ನನ್ನ ಪ್ರತಿ ಹೃದಯ ಬಡಿತದಲ್ಲಿ.

ಅಮ್ಮು, ಈ ಪುಟ್ಟ ಪುಟ ನನ್ನ ಒಂದೇ ಮಾತು:
ನೀನು ಎಲ್ಲವೂ. ಯಾವಾಗಲೂ ನನ್ನವಳಾಗಿ ಇರುತ್ತೀ.`;

const readBtn = document.getElementById('readBtn');
const letterEnvelope = document.getElementById('letterEnvelope');
const letterBody = document.getElementById('letterBody');

let letterOpened = false;
readBtn.addEventListener('click', () => {
    if (letterOpened) return;
    letterOpened = true;
    readBtn.style.opacity = '0.4';
    readBtn.textContent = 'ಓದುತ್ತಿದ್ದೇನೆ...';
    letterEnvelope.style.display = 'block';
    setTimeout(() => letterEnvelope.classList.add('open'), 50);
    typewrite(letterBody, letterText, 28);
});

function typewrite(el, text, speed) {
    let i = 0;
    el.textContent = '';
    const interval = setInterval(() => {
        el.textContent += text[i];
        i++;
        if (i >= text.length) {
            clearInterval(interval);
            readBtn.textContent = '💌 ಪತ್ರ ತೆರೆದಿದೆ';
        }
    }, speed);
}

// ─────────────────────────────────────────────
// CONSTELLATION CANVAS
// ─────────────────────────────────────────────
function initConstelation() {
    const canvas = document.getElementById('constellationCanvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', () => { resize(); drawStatic(); });

    const memories = [
        { label: 'ಮೊದಲ ಭೇಟಿ', x: 0.15, y: 0.3 },
        { label: 'ಮೊದಲ ಡೇಟ್', x: 0.30, y: 0.6 },
        { label: 'ಮೊದಲ ನಗು', x: 0.50, y: 0.25 },
        { label: 'ಮೊದಲ ಮುತ್ತು', x: 0.65, y: 0.55 },
        { label: 'ಸಾಹಸ', x: 0.80, y: 0.3 },
        { label: 'ನಮ್ಮ ಹಾಡು', x: 0.45, y: 0.7 },
        { label: 'ಕನಸಿನ ಪ್ರವಾಸ', x: 0.20, y: 0.75 },
        { label: 'ಇಂದು 💕', x: 0.85, y: 0.7 },
    ];

    const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [3, 7], [4, 7], [2, 5]];

    let phase = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        phase += 0.01;
        const cx = canvas.width, cy = canvas.height;

        // Draw lines
        connections.forEach(([a, b]) => {
            const ma = memories[a], mb = memories[b];
            const grad = ctx.createLinearGradient(ma.x * cx, ma.y * cy, mb.x * cx, mb.y * cy);
            grad.addColorStop(0, 'rgba(255,120,180,0.4)');
            grad.addColorStop(1, 'rgba(255,213,128,0.4)');
            ctx.beginPath();
            ctx.moveTo(ma.x * cx, ma.y * cy);
            ctx.lineTo(mb.x * cx, mb.y * cy);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        });

        // Draw points
        memories.forEach((m, i) => {
            const x = m.x * cx, y = m.y * cy;
            const pulse = 1 + 0.25 * Math.sin(phase + i * 0.8);

            // Glow
            const grd = ctx.createRadialGradient(x, y, 0, x, y, 18 * pulse);
            grd.addColorStop(0, 'rgba(255,120,180,0.5)');
            grd.addColorStop(1, 'rgba(255,120,180,0)');
            ctx.beginPath();
            ctx.arc(x, y, 18 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(x, y, 5 * pulse, 0, Math.PI * 2);
            const isLast = i === memories.length - 1;
            ctx.fillStyle = isLast ? '#ffd580' : '#ff7eb3';
            ctx.fill();

            // Label
            ctx.font = `${isLast ? 600 : 400} ${isLast ? '13px' : '11px'} 'Lato', sans-serif`;
            ctx.fillStyle = isLast ? '#ffd580' : 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'center';
            ctx.fillText(m.label, x, y - 15);
        });

        requestAnimationFrame(draw);
    }

    function drawStatic() { draw(); }
    draw();
}

// ─────────────────────────────────────────────
// HEARTS BURST BUTTON
// ─────────────────────────────────────────────
document.getElementById('heartsBtn').addEventListener('click', function (e) {
    const hearts = ['💖', '💗', '💕', '💓', '💞', '❤️', '🩷', '💝', '🌸', '✨'];
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'heart-burst';
            el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            el.style.cssText = `
        left:${e.clientX + (Math.random() - 0.5) * 200}px;
        top:${e.clientY}px;
        font-size:${1 + Math.random() * 1.5}rem;
        animation-duration:${1.5 + Math.random() * 1.5}s;
        animation-delay:${Math.random() * 0.5}s;
      `;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3000);
        }, i * 50);
    }
});
