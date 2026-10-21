document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.col-carousel-container');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    
    if (container && btnLeft && btnRight) {
        const scrollAmount = 340; 
        
        btnRight.addEventListener('click', () => {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
        
        btnLeft.addEventListener('click', () => {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        // Drag to scroll logic
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.classList.add('active');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            
            // Prevent default drag behavior of inner images/links so they don't break the swipe
            e.preventDefault();
        });
        
        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.classList.remove('active');
        });
        
        container.addEventListener('mouseup', () => {
            isDown = false;
            container.classList.remove('active');
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            container.scrollLeft = scrollLeft - walk;
        });

        // Prevent dragging on child elements specifically to allow link clicking
        const childrenLinks = container.querySelectorAll('a.product-col-card');
        childrenLinks.forEach(link => {
            link.addEventListener('dragstart', (e) => e.preventDefault());
        });
    }
});
