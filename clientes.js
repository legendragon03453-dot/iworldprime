document.addEventListener('DOMContentLoaded', () => {
    const products = [
        {
            title: "iPhone 17 Pro Max",
            desc: "O iPhone mais avançado, com chip A18 Pro e câmera de 48MP. Original, lacrado e com nota fiscal.",
            img: "/IPHONE%206.webp",
            price: "12.432 BRL"
        },
        {
            title: "iPhone 16 Pro",
            desc: "The ultimate tool for creators. Stunning performance and battery life.",
            img: "/IPHONE%206.webp",
            price: "10.150 BRL"
        },
        {
            title: "iPhone 15",
            desc: "Experience the standard of excellence with an amazing new design.",
            img: "/IPHONE%206.webp",
            price: "7.890 BRL"
        },
        {
            title: "iPhone 14 Plus",
            desc: "Big screen, big battery. Perfect for all your daily needs.",
            img: "/IPHONE%206.webp",
            price: "6.200 BRL"
        }
    ];

    const container = document.getElementById('dashboardCards');
    let currentIndex = 0;

    function renderCards() {
        if(!container) return;

        // Get current 2 products
        const p1 = products[currentIndex % products.length];
        const p2 = products[(currentIndex + 1) % products.length];

        const cardsHTML = `
            <a href="detalhes.html" class="product-col-card theme-light dashboard-card transition-card" style="text-decoration: none;">
                <div class="card-inner">
                    <h3 class="card-title">${p1.title}</h3>
                    <p class="card-desc">${p1.desc}</p>
                    <img src="${p1.img}" alt="${p1.title}" class="card-img">
                    <div class="card-price">${p1.price}</div>
                </div>
            </a>
            <a href="detalhes.html" class="product-col-card theme-light dashboard-card transition-card" style="text-decoration: none;">
                <div class="card-inner">
                    <h3 class="card-title">${p2.title}</h3>
                    <p class="card-desc">${p2.desc}</p>
                    <img src="${p2.img}" alt="${p2.title}" class="card-img">
                    <div class="card-price">${p2.price}</div>
                </div>
            </a>
        `;

        // Apply blur/fade out to existing cards first
        const existingCards = container.querySelectorAll('.dashboard-card');
        if (existingCards.length > 0) {
            existingCards.forEach(card => card.classList.add('blur-out'));
            
            setTimeout(() => {
                container.innerHTML = cardsHTML;
                // Add class to trigger fade-in
                setTimeout(() => {
                    const newCards = container.querySelectorAll('.dashboard-card');
                    newCards.forEach(card => card.classList.add('blur-in'));
                }, 50);
            }, 500); // 500ms transition time
        } else {
            // Initial render
            container.innerHTML = cardsHTML;
            setTimeout(() => {
                const newCards = container.querySelectorAll('.dashboard-card');
                newCards.forEach(card => card.classList.add('blur-in'));
            }, 50);
        }

        currentIndex += 2; // Move by 2
    }

    // Initial call
    renderCards();

    // Cycle every 3 seconds
    setInterval(renderCards, 3500); // 3.5s to account for transition
});
