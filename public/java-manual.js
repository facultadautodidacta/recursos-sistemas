(function () {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    var links = Array.from(sidebar.querySelectorAll('.nav-link[href^="#"]'));
    var sections = links.map(function (link) {
        return {
            link: link,
            section: document.getElementById(decodeURIComponent(link.hash.slice(1)))
        };
    }).filter(function (item) {
        return item.section;
    });

    if (!sections.length) return;

    function updateActiveLink() {
        var marker = 150;
        var activeSection = sections[0];

        sections.forEach(function (item) {
            if (item.section.getBoundingClientRect().top <= marker) {
                activeSection = item;
            }
        });

        sections.forEach(function (item) {
            var isActive = item === activeSection;
            item.link.classList.toggle('active', isActive);
            if (isActive) {
                item.link.setAttribute('aria-current', 'location');
            } else {
                item.link.removeAttribute('aria-current');
            }
        });
    }

    var scheduled = false;
    window.addEventListener('scroll', function () {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(function () {
            updateActiveLink();
            scheduled = false;
        });
    }, { passive: true });
    window.addEventListener('resize', updateActiveLink);
    window.addEventListener('hashchange', updateActiveLink);
    window.addEventListener('load', updateActiveLink);
    updateActiveLink();
})();
