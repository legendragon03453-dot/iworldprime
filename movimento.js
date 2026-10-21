// movimento.js
// Scroll suave (Lenis) + revelação dos blocos conforme entram na tela.
//
// Regras que valem para tudo aqui:
//   - Nada some sem JS: a classe que esconde é aplicada por script.
//   - prefers-reduced-motion desliga o scroll suave e as revelações.
//   - Falha do Lenis não pode travar a página: o scroll nativo continua.

(function () {
    'use strict';

    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------------------------------------------------------------
    // 1. Scroll suave
    // ---------------------------------------------------------------
    function iniciarScrollSuave() {
        if (semMovimento || typeof window.Lenis !== 'function') return null;

        const lenis = new window.Lenis({
            duration: 1.1,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            // No touch o scroll nativo do sistema é melhor que qualquer
            // interpolação nossa — e não briga com o "puxar para atualizar".
            smoothTouch: false
        });

        function quadro(tempo) {
            lenis.raf(tempo);
            requestAnimationFrame(quadro);
        }
        requestAnimationFrame(quadro);

        // Âncoras internas passam a usar o mesmo easing do scroll.
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            const alvo = a.getAttribute('href');
            if (!alvo || alvo === '#') return;
            a.addEventListener('click', e => {
                const destino = document.querySelector(alvo);
                if (!destino) return;
                e.preventDefault();
                lenis.scrollTo(destino, { offset: -80 });
            });
        });

        return lenis;
    }

    // ---------------------------------------------------------------
    // 2. Revelação ao entrar na tela
    // ---------------------------------------------------------------
    // Blocos que ganham entrada. A hero fica de fora: ela tem a própria
    // animação em CSS e roda no load, não no scroll.
    const ALVOS = [
        '.benefits-bar .benefit-item',
        '.session-3 .product-card',
        '.session-4 .s4-content',
        '.session-5 .s5-title',
        '.session-5 .s5-card',
        '.session-6 .s6-main-title',
        '.session-6 .s6-card',
        '.testimonials-section .testimonials-title',
        '.testimonials-section .testimonial-card',
        '.site-footer .footer-col',
        '.col-hero-card',
        '.col-sidebar-title',
        '.products-grid-4 .product-card'
    ];

    function prepararRevelacao() {
        const vistos = new Set();
        const elementos = [];

        ALVOS.forEach(seletor => {
            document.querySelectorAll(seletor).forEach((el, i) => {
                if (vistos.has(el)) return;
                vistos.add(el);
                el.classList.add('js-revelar');
                // Escalonamento dentro do mesmo grupo, no máximo 5 degraus.
                if (i > 0) el.dataset.atraso = String(Math.min(i, 5));
                elementos.push(el);
            });
        });

        if (semMovimento || !('IntersectionObserver' in window)) {
            elementos.forEach(el => el.classList.add('visivel'));
            return;
        }

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add('visivel');
                observador.unobserve(entrada.target);   // anima uma vez só
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

        elementos.forEach(el => observador.observe(el));

        // Rede de segurança em três tempos. Conteúdo escondido para sempre é
        // pior do que animação nenhuma, então tudo aqui erra para o lado de
        // mostrar: o que já está na tela aparece na hora, e depois de 2,5s
        // todo o resto aparece de qualquer jeito.
        function revelarNoViewport() {
            elementos.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.top < window.innerHeight * 1.1) el.classList.add('visivel');
            });
        }

        requestAnimationFrame(revelarNoViewport);
        window.addEventListener('load', revelarNoViewport);
        setTimeout(revelarNoViewport, 400);

        setTimeout(() => {
            elementos.forEach(el => el.classList.add('visivel'));
        }, 2500);
    }

    // ---------------------------------------------------------------
    // 3. Conteúdo que chega depois (produtos vêm da API)
    // ---------------------------------------------------------------
    window.revelarNovos = function (seletor) {
        document.querySelectorAll(seletor).forEach((el, i) => {
            if (el.classList.contains('js-revelar')) return;
            el.classList.add('js-revelar');
            if (i > 0) el.dataset.atraso = String(Math.min(i, 5));
            requestAnimationFrame(() => el.classList.add('visivel'));
        });
    };

    function iniciar() {
        prepararRevelacao();
        iniciarScrollSuave();
        document.body.classList.add('pagina-pronta');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
