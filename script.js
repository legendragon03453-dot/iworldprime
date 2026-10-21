document.addEventListener('mousemove', (e) => {
    // Background layer coordinates
    const x = e.clientX;
    const y = e.clientY;
    
    // Calculate angle for chrome text
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    
    requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${x}px`);
        document.documentElement.style.setProperty('--mouse-y', `${y}px`);
        document.documentElement.style.setProperty('--mouse-angle', `${angle}deg`);
    });
});

// Scroll Animation Logic
window.addEventListener('scroll', () => {
    const scrollSeq = document.getElementById('scroll-sequence');
    if (!scrollSeq) return;
    const maxScroll = scrollSeq.getBoundingClientRect().height - window.innerHeight;
    let scrollY = window.scrollY;
    
    // Garantir os limites numéricos ao dar scroll
    if (scrollY < 0) scrollY = 0;
    if (scrollY > maxScroll) scrollY = maxScroll;

    const progress = scrollY / maxScroll; // Retorna sempre de 0.0 a 1.0

    // 1. Textos da Hero Section desaparecem logo no início (0 a 0.12)
    const heroTexts = document.getElementById('hero-texts');
    if (heroTexts) {
        let textOpacity = 1 - (progress / 0.12);
        heroTexts.style.opacity = Math.max(0, textOpacity);
    }

    // 2. Crescimento/Movimento do iPhone e Parallax do Macbook (0.10 a 0.50)
    const macbookImg = document.getElementById('macbook-img');
    const macbookScreen = document.getElementById('macbook-screen');
    const iphoneImg = document.getElementById('iphone-img');
    
    let scaleProgress = 0;
    if (progress > 0.10) {
        scaleProgress = Math.min(1, (progress - 0.10) / 0.40);
    }
    
    // O iPhone dá um zoom maior e mais imersivo preenchendo a tela
    const scale = 1 + (scaleProgress * 1.15); // Vai até 2.15x de tamanho
    
    let extraTranslateX = 0;
    let extraTranslateY = 0;
    
    // No Desktop joga para a esquerda e centraliza melhor na vertical
    if (window.innerWidth > 900) {
        extraTranslateX = -(scaleProgress * 20); // Posiciona à esquerda
        extraTranslateY = -(scaleProgress * 12); // Menos subida para não ficar muito no topo
    } else {
        extraTranslateY = -(scaleProgress * 10); // Menos subida no mobile
    }
    
    // Aplica a transformação com zoom imersivo ao iPhone
    if (iphoneImg) {
        iphoneImg.style.transform = `translate(calc(-50% + ${extraTranslateX}vw), ${extraTranslateY}vh) scale(${scale})`;
    }
    
    // Parallax 3D do Macbook: encolhe levemente e desliza para baixo para sair da tela
    let frameOpacity = 1 - (scaleProgress * 2.5); 
    if (macbookImg) {
        macbookImg.style.transform = `scale(${1 - scaleProgress * 0.15}) translateY(${scaleProgress * 80}px)`;
        macbookImg.style.opacity = Math.max(0, frameOpacity);
    }
    if (macbookScreen) {
        macbookScreen.style.transform = `scale(${1 - scaleProgress * 0.15}) translateY(${scaleProgress * 80}px)`;
        macbookScreen.style.opacity = Math.max(0, frameOpacity);
    }

    // Fundo da página escurece revelando a cor preta (Sessão 2)
    const bgTransition = document.getElementById('bg-transition');
    if (bgTransition) {
        bgTransition.style.opacity = scaleProgress;
    }

    // 3. Textos e Botão da Sessão 2 aparecem (0.50 a 0.80)
    const section2Content = document.getElementById('section-2-content');
    if (section2Content) {
        let sec2Progress = 0;
        
        if (progress > 0.50) {
            sec2Progress = Math.min(1, (progress - 0.50) / 0.30);
            section2Content.classList.add('active'); // Ativa o botão e ponteiro do rato
        } else {
            section2Content.classList.remove('active');
        }
        
        section2Content.style.opacity = sec2Progress;

        // No mobile o texto fica centralizado sobre o iPhone, então fazemos o
        // iPhone desaparecer conforme o texto da Sessão 2 aparece (evita sobreposição).
        if (iphoneImg) {
            if (window.innerWidth <= 900) {
                iphoneImg.style.opacity = Math.max(0, 1 - sec2Progress * 1.4);
            } else {
                iphoneImg.style.opacity = 1;
            }
        }

        // Transição suave vindo da direita (ou de baixo se estiver num dispositivo mobile)
        if (window.innerWidth > 900) {
            section2Content.style.transform = `translateY(-50%) translateX(${(1 - sec2Progress) * 50}px)`;
        } else {
            section2Content.style.transform = `translate(-50%, calc(-50% + ${(1 - sec2Progress) * 50}px))`;
        }
    }
});

// Fade-in animation observer
document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    // Select elements to animate across the page
    const elementsToAnimate = document.querySelectorAll('h2, h3, p, .s5-card, .product-card, .s4-col-center img, .s6-product-image img, .s6-btn');
    
    elementsToAnimate.forEach(el => {
        // Skip elements that have scroll-bound animations
        if (!el.closest('.navbar') && !el.closest('.hero-section') && !el.closest('.session-2-content')) {
            el.classList.add('fade-in');
            observer.observe(el);
        }
    });
});
