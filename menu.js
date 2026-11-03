import { db } from "./firebase.js";
import {
    collection,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const menuFilters = document.getElementById("menuFilters");
const menuGrid = document.getElementById("menuGrid");
const menuMessage = document.getElementById("menuMessage");
const menuSearch = document.getElementById("menuSearch");

let menuItems = null;
let activeCategories = null;
let selectedCategory = "all";
let menuLoadError = false;
let categoriesLoadError = false;

const demoCategories = [
    { id: "demo-burgers", name: "Burgers", sortOrder: 10 },
    { id: "demo-appetizers", name: "Appetizers", sortOrder: 11 },
    { id: "demo-soup", name: "Soup", sortOrder: 12 },
    { id: "demo-dessert", name: "Dessert", sortOrder: 13 },
    { id: "demo-main-course", name: "Main Course", sortOrder: 14 },
    { id: "demo-drinks", name: "Drinks", sortOrder: 15 }
];

const demoMenuItems = demoCategories.flatMap(category =>
    [1, 2, 3, 4].map(number => ({
        id: `${category.id}-item-${number}`,
        name: `Food Name ${String(number).padStart(2, "0")}`,
        description: "Demo placeholder item; awaiting restaurant confirmation.",
        categoryId: category.id,
        price: null,
        available: true
    }))
);

function renderMenu() {
    menuGrid.replaceChildren();

    if (menuLoadError || categoriesLoadError) {
        menuMessage.textContent =
            "The live menu is temporarily unavailable. Please try again later.";
        return;
    }

    if (menuItems === null || activeCategories === null) {
        menuMessage.textContent = "Loading live menu...";
        return;
    }

    const activeCategoryIds = new Set(
        activeCategories.map(category => category.id)
    );

    const searchTerm = menuSearch.value.trim().toLocaleLowerCase("en-IN");
    const visibleItems = menuItems.filter(item => {
        if (
            item.available !== true ||
            !activeCategoryIds.has(item.categoryId) ||
            (selectedCategory !== "all" && item.categoryId !== selectedCategory)
        ) return false;

        if (!searchTerm) return true;
        const category = activeCategories.find(entry => entry.id === item.categoryId);
        const searchableText = [item.name, item.description, category?.name]
            .filter(value => typeof value === "string")
            .join(" ")
            .toLocaleLowerCase("en-IN");
        return searchableText.includes(searchTerm);
    });

    if (visibleItems.length === 0) {
        menuMessage.textContent = searchTerm
            ? "No dishes match your search. Try another term or category."
            : selectedCategory !== "all"
                ? "No available dishes in this category right now."
                : "No menu items are currently available.";
        return;
    }

    menuMessage.textContent = "";
    visibleItems.forEach(renderMenuItem);
}

function renderCategoryFilters() {
    menuFilters.replaceChildren();

    const categories = [
        { id: "all", name: "All Items" },
        ...activeCategories
    ];

    categories.forEach(category => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-btn";
        button.dataset.category = category.id;
        button.textContent = category.name;
        button.classList.toggle(
            "active",
            category.id === selectedCategory
        );
        menuFilters.append(button);
    });
}

function renderMenuItem(item) {
    const category = activeCategories.find(
        entry => entry.id === item.categoryId
    );

    const card = document.createElement("article");
    card.className = "menu-card";

    if (typeof item.imageUrl === "string" && item.imageUrl.trim()) {
        const image = document.createElement("img");
        image.className = "menu-image";
        image.src = item.imageUrl.trim();
        image.alt = item.name || "Menu item";
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove(), { once: true });
        card.append(image);
    }

    const info = document.createElement("div");
    info.className = "menu-info";

    const categoryLabel = document.createElement("span");
    categoryLabel.className = "food-category";
    categoryLabel.textContent = `SAMPLE · ${category.name.toUpperCase()}`;

    const name = document.createElement("h3");
    name.textContent = item.name || "Menu item";

    const description = document.createElement("p");
    description.textContent = item.description || "";

    const price = document.createElement("div");
    price.className = "menu-price";
    const numericPrice = Number(item.price);
    price.textContent = item.price !== null &&
        item.price !== "" &&
        Number.isFinite(numericPrice)
        ? `Sample price · ${new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(numericPrice)}`
        : "Sample price · awaiting confirmation";

    info.append(categoryLabel, name, description, price);
    card.append(info);
    menuGrid.append(card);
}

menuFilters.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(".filter-btn");
    if (!button || !menuFilters.contains(button)) return;

    selectedCategory = button.dataset.category;
    menuFilters.querySelectorAll(".filter-btn").forEach(filterButton => {
        filterButton.classList.toggle(
            "active",
            filterButton.dataset.category === selectedCategory
        );
    });
    renderMenu();
});

menuSearch.addEventListener("input", renderMenu);

const unsubscribeCategories = onSnapshot(
    query(collection(db, "categories"), where("active", "==", true)),
    snapshot => {
        categoriesLoadError = false;
        const firestoreCategories = snapshot.docs
            .map(categoryDoc => ({
                id: categoryDoc.id,
                ...categoryDoc.data()
            }))
            .filter(category =>
                typeof category.name === "string" &&
                category.name.trim()
            );
        activeCategories = [...firestoreCategories, ...demoCategories]
            .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
        if (
            selectedCategory !== "all" &&
            !activeCategories.some(category => category.id === selectedCategory)
        ) {
            selectedCategory = "all";
        }
        renderCategoryFilters();
        renderMenu();
    },
    error => {
        console.error("Could not load menu categories:", error);
        categoriesLoadError = true;
        renderMenu();
    }
);

const unsubscribeMenu = onSnapshot(
    query(collection(db, "menuItems"), where("available", "==", true)),
    snapshot => {
        menuLoadError = false;
        const firestoreItems = snapshot.docs.map(menuDoc => ({
            id: menuDoc.id,
            ...menuDoc.data()
        })).filter(item => item.available === true);
        menuItems = [...firestoreItems, ...demoMenuItems];
        renderMenu();
    },
    error => {
        console.error("Could not load menu items:", error);
        menuLoadError = true;
        renderMenu();
    }
);

window.addEventListener("pagehide", () => {
    unsubscribeCategories();
    unsubscribeMenu();
});
