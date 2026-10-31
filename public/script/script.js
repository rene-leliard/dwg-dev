document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    if (themeToggle) {
        const savedTheme = localStorage.getItem("theme");
        // Le site est sombre par défaut pour coller au hero.
        if (savedTheme === "light-mode") {
            body.classList.add("light-mode");
            themeToggle.innerHTML = '<i class="bi bi-moon"></i>';
        } else {
            body.classList.remove("light-mode");
            themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
        }

        themeToggle.addEventListener("click", () => {
            const isLight = body.classList.toggle("light-mode");
            themeToggle.innerHTML = isLight
                ? '<i class="bi bi-moon"></i>'
                : '<i class="bi bi-sun"></i>';
            localStorage.setItem("theme", isLight ? "light-mode" : "dark-mode");
        });
    }

    initHeroCanvas();
    initHeroIntro();
    initHeroPointer();
    initScrollReveals();
});

function initHeroCanvas() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let points = [];
    let pulses = [];
    let rafId = 0;
    let t = 0;

    const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cols = Math.max(9, Math.floor(width / 78));
        const rows = Math.max(6, Math.floor(height / 78));
        points = [];
        for (let y = 0; y <= rows; y += 1) {
            for (let x = 0; x <= cols; x += 1) {
                points.push({
                    x: (x / cols) * width,
                    y: (y / rows) * height,
                    ox: (x / cols) * width,
                    oy: (y / rows) * height,
                    phase: Math.random() * Math.PI * 2,
                    pulse: Math.random(),
                });
            }
        }
    };

    const spawnPulse = () => {
        if (points.length < 2) return;
        const start = points[Math.floor(Math.random() * points.length)];
        let end = points[Math.floor(Math.random() * points.length)];
        let guard = 0;
        while (end === start && guard < 8) {
            end = points[Math.floor(Math.random() * points.length)];
            guard += 1;
        }
        pulses.push({
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            life: 0,
            max: 55 + Math.random() * 35,
        });
        if (pulses.length > 6) pulses.shift();
    };

    let pulseTimer = 0;

    const draw = () => {
        t += 0.01;
        pulseTimer += 1;
        if (!reduceMotion && pulseTimer % 48 === 0) spawnPulse();

        ctx.clearRect(0, 0, width, height);

        points.forEach((p) => {
            p.x = p.ox + Math.sin(t + p.phase) * 14;
            p.y = p.oy + Math.cos(t * 0.85 + p.phase) * 11;
        });

        ctx.lineWidth = 1.1;
        for (let i = 0; i < points.length; i += 1) {
            const a = points[i];
            for (let j = i + 1; j < points.length; j += 1) {
                const b = points[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 135) {
                    ctx.globalAlpha = (1 - dist / 135) * 0.7;
                    ctx.strokeStyle = "rgba(153, 246, 228, 0.55)";
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;

        pulses.forEach((pulse) => {
            pulse.life += 1;
            const p = pulse.life / pulse.max;
            if (p >= 1) return;
            const x = pulse.x1 + (pulse.x2 - pulse.x1) * p;
            const y = pulse.y1 + (pulse.y2 - pulse.y1) * p;
            ctx.beginPath();
            ctx.fillStyle = `rgba(251, 191, 36, ${1 - p})`;
            ctx.arc(x, y, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - p) * 0.45})`;
            ctx.lineWidth = 1.5;
            ctx.moveTo(pulse.x1, pulse.y1);
            ctx.lineTo(x, y);
            ctx.stroke();
        });
        pulses = pulses.filter((pulse) => pulse.life < pulse.max);

        points.forEach((p) => {
            const glow = 0.45 + Math.sin(t * 2 + p.phase) * 0.25;
            ctx.beginPath();
            ctx.fillStyle = `rgba(253, 230, 138, ${0.35 + glow * 0.35})`;
            ctx.arc(p.x, p.y, 1.7 + glow, 0, Math.PI * 2);
            ctx.fill();
        });

        if (!reduceMotion) {
            rafId = requestAnimationFrame(draw);
        }
    };

    resize();
    draw();
    window.addEventListener("resize", () => {
        cancelAnimationFrame(rafId);
        resize();
        draw();
    });
}

function dismissHeroCurtain(curtain) {
    if (!curtain) return;
    curtain.classList.add("is-done");
}

function initHeroIntro() {
    const hero = document.querySelector(".hero");
    const curtain = document.getElementById("hero-curtain");
    if (!hero) return;

    const letters = hero.querySelectorAll(".hero-brand__letter");
    const title = hero.querySelector(".hero-title");
    const subtitle = hero.querySelector(".hero-subtitle");
    const actions = hero.querySelector(".hero-actions");
    const stage = hero.querySelector(".hero-stage");
    const brandLine = hero.querySelector(".hero-brand-line");
    const orbs = hero.querySelectorAll(".hero-orb");
    const mediaImage = hero.querySelector(".hero-media__image");
    const leftPanel = curtain?.querySelector(".hero-curtain__panel--left");
    const rightPanel = curtain?.querySelector(".hero-curtain__panel--right");
    const slash = curtain?.querySelector(".hero-curtain__slash");
    const mark = curtain?.querySelector(".hero-curtain__mark");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Filet de sécurité : le rideau ne doit jamais rester bloqué.
    window.setTimeout(() => dismissHeroCurtain(curtain), 2500);

    if (typeof gsap === "undefined" || reduceMotion) {
        if (brandLine) brandLine.style.width = "7.5rem";
        dismissHeroCurtain(curtain);
        return;
    }

    gsap.set(letters, { y: 56, rotateX: -28, scale: 0.92 });
    gsap.set([title, subtitle, actions].filter(Boolean), { y: 28, opacity: 0.2 });
    if (brandLine) gsap.set(brandLine, { width: 0, opacity: 1 });
    if (stage) gsap.set(stage, { scale: 1.08 });
    if (orbs.length) gsap.set(orbs, { scale: 0.85, opacity: 0.45 });
    if (mediaImage) gsap.set(mediaImage, { scale: 1.16 });
    if (slash) gsap.set(slash, { width: 0, opacity: 1 });
    if (mark) gsap.set(mark, { opacity: 0, scale: 0.92 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (curtain && leftPanel && rightPanel && slash && mark) {
        tl.to(mark, { opacity: 1, scale: 1, duration: 0.45 }, 0.05)
            .to(slash, { width: "min(42vw, 280px)", duration: 0.55 }, 0.15)
            .to(leftPanel, { xPercent: -102, duration: 0.85, ease: "power4.inOut" }, 0.55)
            .to(rightPanel, { xPercent: 102, duration: 0.85, ease: "power4.inOut" }, 0.55)
            .to([mark, slash], { opacity: 0, duration: 0.25 }, 0.95)
            .add(() => dismissHeroCurtain(curtain), 1.35);
    }

    const contentStart = curtain ? 0.85 : 0;
    if (stage) tl.to(stage, { scale: 1, duration: 1.4 }, contentStart);
    if (mediaImage) {
        tl.to(mediaImage, { scale: 1.08, duration: 1.6, ease: "power2.out" }, contentStart);
        tl.to(
            mediaImage,
            {
                scale: 1.02,
                xPercent: -1.5,
                yPercent: -1,
                duration: 12,
                ease: "none",
                repeat: -1,
                yoyo: true,
            },
            contentStart + 1.5
        );
    }
    if (orbs.length) tl.to(orbs, { scale: 1, opacity: 1, duration: 1.2, stagger: 0.12 }, contentStart);
    if (letters.length) {
        tl.to(
            letters,
            {
                y: 0,
                rotateX: 0,
                scale: 1,
                duration: 0.9,
                stagger: 0.12,
            },
            contentStart + 0.15
        );
    }
    if (brandLine) tl.to(brandLine, { width: "7.5rem", duration: 0.7, ease: "power2.out" }, "-=0.35");
    if (title) tl.to(title, { y: 0, opacity: 1, duration: 0.75 }, "-=0.45");
    if (subtitle) tl.to(subtitle, { y: 0, opacity: 1, duration: 0.7 }, "-=0.45");
    if (actions) tl.to(actions, { y: 0, opacity: 1, duration: 0.7 }, "-=0.4");

    if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to(stage, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: true,
            },
        });
    }
}

function initHeroPointer() {
    const hero = document.querySelector(".hero");
    const spotlight = document.getElementById("hero-spotlight");
    const content = document.querySelector(".hero-content");
    if (!hero || !spotlight) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let targetX = hero.clientWidth * 0.7;
    let targetY = hero.clientHeight * 0.35;
    let currentX = targetX;
    let currentY = targetY;
    let rafId = 0;

    const tick = () => {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        spotlight.style.left = `${currentX}px`;
        spotlight.style.top = `${currentY}px`;

        if (content && typeof gsap !== "undefined") {
            const nx = (currentX / hero.clientWidth - 0.5) * 12;
            const ny = (currentY / hero.clientHeight - 0.5) * 8;
            gsap.set(content, { x: nx, y: ny });
        }

        rafId = requestAnimationFrame(tick);
    };

    hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        targetX = event.clientX - rect.left;
        targetY = event.clientY - rect.top;
    });

    hero.addEventListener("pointerleave", () => {
        targetX = hero.clientWidth * 0.7;
        targetY = hero.clientHeight * 0.35;
    });

    rafId = requestAnimationFrame(tick);
    window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
}

function initScrollReveals() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".section").forEach((section) => {
        const targets = section.querySelectorAll(
            ".section-heading, .stat-card, .service-card, .case-row, .cta-band"
        );
        if (!targets.length) return;

        gsap.from(targets, {
            y: 28,
            opacity: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                once: true,
            },
        });
    });
}
