import { resources } from "./data/resources.js";

const componentTargets = [
    { selector: "#site-header", file: "../components/header.html" },
    { selector: '[data-component="../components/hero.html"]', file: "../components/hero.html" },
    { selector: '[data-component="../components/resources.html"]', file: "../components/resources.html" },
    { selector: '[data-component="../components/technologies.html"]', file: "../components/technologies.html" },
    { selector: '[data-component="../components/footer.html"]', file: "../components/footer.html" },
    { selector: '[data-component="../components/resource-dialog.html"]', file: "../components/resource-dialog.html" }
];

async function loadComponents() {
    const loadedComponents = await Promise.all(componentTargets.map(async ({ selector, file }) => {
        const response = await fetch(new URL(file, import.meta.url));
        if (!response.ok) {
            throw new Error(`No se pudo cargar ${file}: ${response.status} ${response.statusText}`);
        }

        const markup = await response.text();
        if (!markup.trim()) {
            throw new Error(`El componente ${file} está vacío.`);
        }
        return { selector, markup };
    }));

    for (const { selector, markup } of loadedComponents) {
        const target = document.querySelector(selector);
        if (!target) {
            throw new Error(`No se encontró el contenedor para ${selector}.`);
        }
        target.innerHTML = markup;
    }
}

function initializeResourcePage() {
    const grid = document.querySelector("#resource-grid");
    const searchInput = document.querySelector("#resource-search");
    const count = document.querySelector("#resource-count");
    const emptyState = document.querySelector("#empty-state");
    const dialog = document.querySelector("#resource-dialog");
    let activeFilter = "todos";
    let activeTechnology = "";

    const cardIcon = `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 4.75A1.75 1.75 0 0 1 6.75 3h10.5A1.75 1.75 0 0 1 19 4.75v14.5A1.75 1.75 0 0 1 17.25 21H6.75A1.75 1.75 0 0 1 5 19.25V4.75Z" stroke="currentColor" stroke-width="1.6"/>
            <path d="M8.5 8h7m-7 4h7m-7 4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`;

    function renderResources() {
        const query = searchInput.value.trim().toLocaleLowerCase("es");
        const visibleResources = resources.filter((resource) => {
            const matchesFilter = activeFilter === "todos" || resource.filter === activeFilter;
            const matchesTechnology = !activeTechnology || resource.technologies.some((technology) => technology.toLocaleLowerCase("es") === activeTechnology.toLocaleLowerCase("es"));
            const searchable = `${resource.title} ${resource.description} ${resource.category} ${resource.technologies.join(" ")}`.toLocaleLowerCase("es");
            return matchesFilter && matchesTechnology && searchable.includes(query);
        });

        grid.innerHTML = visibleResources.map((resource, index) => `
            <article class="resource-card col-12 col-md-6 col-lg-4" style="animation-delay: ${index * 45}ms">
                <div class="card-topline">
                    <span class="card-icon">${cardIcon}</span>
                    <span class="category-label">${resource.category}</span>
                </div>
                <h3>${resource.title}</h3>
                <p>${resource.description}</p>
                <div class="card-bottom">
                    <div class="tag-list">${resource.technologies.map((technology) => `<span class="tag">${technology}</span>`).join("")}</div>
                    ${resource.href
                        ? `<a class="card-action" href="${resource.href}" aria-label="Abrir guía: ${resource.title}">Abrir guía <span aria-hidden="true">→</span></a>`
                        : `<button class="card-action" type="button" data-resource="${resource.id}" aria-label="Ver detalles de ${resource.title}">Ver detalles <span aria-hidden="true">→</span></button>`}
                </div>
            </article>
        `).join("");
        count.textContent = String(visibleResources.length).padStart(2, "0");
        emptyState.hidden = visibleResources.length > 0;
    }

    function updateFilterButtons() {
        document.querySelectorAll(".filter-button").forEach((button) => {
            const isSelected = button.dataset.filter === activeFilter;
            button.classList.toggle("selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });
    }

    function showResourceDetails(resource) {
        document.querySelector("#dialog-category").textContent = `${resource.category} · ${resource.format}`;
        document.querySelector("#dialog-title").textContent = resource.title;
        document.querySelector("#dialog-description").textContent = resource.description;
        document.querySelector("#dialog-tags").innerHTML = resource.technologies.map((technology) => `<span class="tag">${technology}</span>`).join("");
        dialog.showModal();
    }

    document.querySelectorAll(".filter-button").forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;
            activeTechnology = "";
            updateFilterButtons();
            document.querySelectorAll(".technology-chip").forEach((chip) => chip.removeAttribute("aria-pressed"));
            renderResources();
        });
    });

    document.querySelectorAll(".technology-chip").forEach((button) => {
        button.addEventListener("click", () => {
            activeTechnology = button.dataset.tech;
            activeFilter = "todos";
            updateFilterButtons();
            document.querySelectorAll(".technology-chip").forEach((chip) => {
                chip.setAttribute("aria-pressed", String(chip === button));
            });
            renderResources();
            document.querySelector("#recursos").scrollIntoView({ behavior: "smooth" });
        });
    });

    searchInput.addEventListener("input", renderResources);
    grid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-resource]");
        if (!button) return;
        const resource = resources.find((item) => item.id === button.dataset.resource);
        if (resource) showResourceDetails(resource);
    });

    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector("#main-nav");
    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        menuToggle.querySelector(".sr-only").textContent = isOpen ? "Abrir menú" : "Cerrar menú";
        mainNav.classList.toggle("open", !isOpen);
    });

    mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            mainNav.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.querySelector(".sr-only").textContent = "Abrir menú";
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && document.activeElement !== searchInput && !dialog.open) {
            event.preventDefault();
            searchInput.focus();
        }
    });

    renderResources();
}

const siteShell = document.querySelector("#site-shell");
const pageContent = document.querySelector("#page-content");
const loadingState = document.querySelector("#loading-state");
const loadError = document.querySelector("#load-error");

loadComponents()
    .then(() => {
        initializeResourcePage();
        loadingState.hidden = true;
        pageContent.hidden = false;
        siteShell.setAttribute("aria-busy", "false");
    })
    .catch((error) => {
        console.error("Error al iniciar la página de recursos:", error);
        loadingState.hidden = true;
        loadError.hidden = false;
        siteShell.setAttribute("aria-busy", "false");
    });
