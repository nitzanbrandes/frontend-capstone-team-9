document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.menu');

    // לחיצה על ההמבורגר
    hamburger.addEventListener('click', () => {
        menu.classList.toggle('active');

        if (menu.classList.contains('active')) {
            hamburger.textContent = 'x';
        } else {
            hamburger.textContent = '☰';
        }
    });

    // סגירת התפריט בלחיצה על קישור
    document.querySelectorAll('.menu a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            hamburger.textContent = '☰';
        });
    });
});
