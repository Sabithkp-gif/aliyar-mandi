
import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
    collection,
    onSnapshot,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Replace with your actual Firebase UIDs
const allowedAdmins = [
    "LpIBPXQZweexUYvbu39CxkBBXJD3"
];

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");

const menuList = document.getElementById("menuList");
const menuMessage = document.getElementById("menuMessage");

const addMenuForm = document.getElementById("addMenuForm");
const foodCategory = document.getElementById("foodCategory");
const formMessage = document.getElementById("formMessage");
const addFoodButton = document.getElementById("addFoodButton");
const foodImageInput = document.getElementById("foodImage");
const foodImagePreview = document.getElementById("foodImagePreview");
const imagePreviewWrap = document.getElementById("imagePreviewWrap");

let unsubscribeMenu = null;
let activeCategories = [];

let allCategories = [];

function isAllowedImageReference(value) {
    const reference = value.trim();
    if (!reference) return true;

    if (/^https:\/\//i.test(reference)) {
        try {
            return new URL(reference).protocol === "https:";
        } catch {
            return false;
        }
    }

    return /^assets\/images\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp|avif)$/i.test(reference);
}

function updateImagePreview() {
    const reference = foodImageInput.value.trim();
    if (!reference || !isAllowedImageReference(reference)) {
        foodImagePreview.removeAttribute("src");
        imagePreviewWrap.hidden = true;
        return;
    }

    foodImagePreview.src = reference;
    imagePreviewWrap.hidden = false;
}

foodImageInput.addEventListener("input", updateImagePreview);
foodImagePreview.addEventListener("error", () => {
    imagePreviewWrap.hidden = true;
});

const categoryForm = document.getElementById("categoryForm");
const categoryList = document.getElementById("categoryList");
const categoryMessage = document.getElementById("categoryMessage");

function getLoginErrorMessage(error) {
    switch (error.code) {
        case "auth/invalid-email":
            return "Enter a valid email address.";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Email or password is incorrect.";
        case "auth/user-disabled":
            return "This account has been disabled. Contact the Firebase project administrator.";
        case "auth/too-many-requests":
            return "Too many sign-in attempts. Wait a while, then try again.";
        case "auth/network-request-failed":
            return "Could not reach Firebase. Check your internet connection and try again.";
        case "auth/operation-not-allowed":
            return "Email/password sign-in is disabled in Firebase Authentication.";
        case "auth/unauthorized-domain":
            return "This website domain is not authorized in Firebase Authentication.";
        case "auth/api-key-not-valid":
            return "Firebase configuration is invalid. Check the project's API key.";
        default:
            return "Sign-in failed. Check Firebase Authentication settings and try again.";
    }
}

// Login
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    loginMessage.textContent = "Signing in...";
    submitButton.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Admin sign-in failed:", error);
        loginMessage.textContent = getLoginErrorMessage(error);
    } finally {
        submitButton.disabled = false;
    }
});

// Load categories into dropdown

async function loadCategories() {
    foodCategory.replaceChildren();
    categoryList.replaceChildren();

    activeCategories = [];
    allCategories = [];

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a category";
    foodCategory.append(placeholder);

    try {
        const snapshot = await getDocs(collection(db, "categories"));

        snapshot.forEach(categoryDoc => {
            const category = {
                id: categoryDoc.id,
                ...categoryDoc.data()
            };

            allCategories.push(category);

            if (category.active === true) {
                activeCategories.push(category);

                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;

                foodCategory.append(option);
            }

            // Category list
            const row = document.createElement("div");
            row.className = "category-row";

            const details = document.createElement("div");

            const name = document.createElement("strong");
            name.textContent = category.name;

            const status = document.createElement("p");
            status.className = "category-status";
            status.textContent = category.active
                ? "Active"
                : "Inactive";

            details.append(name, status);

            const actions = document.createElement("div");
            actions.className = "category-actions";

            const editButton = document.createElement("button");
            editButton.textContent = "Rename";

            editButton.addEventListener("click", () =>
                renameCategory(category)
            );

            const toggleButton = document.createElement("button");
            toggleButton.textContent = category.active
                ? "Deactivate"
                : "Activate";

            toggleButton.addEventListener("click", () =>
                toggleCategory(category)
            );

            actions.append(editButton, toggleButton);
            row.append(details, actions);
            categoryList.append(row);
        });

        if (allCategories.length === 0) {
            categoryList.textContent = "No categories found.";
        }

    } catch (error) {
        console.error("Category loading error:", error);
        categoryMessage.textContent = "Could not load categories.";
    }
}

async function renameCategory(category) {
    const nextName = prompt("Category name:", category.name || "");
    if (nextName === null) return;
    const name = nextName.trim();
    if (!name) {
        categoryMessage.textContent = "Enter a category name.";
        return;
    }
    if (allCategories.some(entry => entry.id !== category.id &&
        entry.name.toLowerCase() === name.toLowerCase())) {
        categoryMessage.textContent = "Category already exists.";
        return;
    }
    try {
        categoryMessage.textContent = "Saving category name...";
        await updateDoc(doc(db, "categories", category.id), {
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            updatedAt: serverTimestamp()
        });
        await loadCategories();
        categoryMessage.textContent = "Category renamed successfully.";
    } catch (error) {
        console.error("Category rename error:", error);
        categoryMessage.textContent = "Could not rename category. Check Firestore permissions.";
    }
}

async function toggleCategory(category) {
    const nextActive = category.active !== true;
    try {
        categoryMessage.textContent = nextActive ? "Activating category..." : "Deactivating category...";
        await updateDoc(doc(db, "categories", category.id), {
            active: nextActive,
            updatedAt: serverTimestamp()
        });
        await loadCategories();
        categoryMessage.textContent = nextActive ? "Category activated." : "Category deactivated.";
    } catch (error) {
        console.error("Category status update error:", error);
        categoryMessage.textContent = "Could not update category. Check Firestore permissions.";
    }
}


categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;

    if (!user || !allowedAdmins.includes(user.uid)) {
        categoryMessage.textContent = "Not authorized.";
        return;
    }

    const name = document.getElementById("categoryName")
        .value.trim();

    if (!name) return;

    const duplicate = allCategories.some(
        category => category.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        categoryMessage.textContent = "Category already exists.";
        return;
    }

    try {
        categoryMessage.textContent = "Creating category...";

        await addDoc(collection(db, "categories"), {
            name,
            slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            sortOrder: allCategories.length + 1,
            active: true,
            createdAt: serverTimestamp()
        });

        categoryForm.reset();
        await loadCategories();

        categoryMessage.textContent = "Category created successfully!";

    } catch (error) {
        console.error(error);
        categoryMessage.textContent = "Could not create category.";
    }
});



// Load live menu items
function loadMenuItems() {
    menuMessage.textContent = "Loading menu...";
    menuList.replaceChildren();

    unsubscribeMenu = onSnapshot(
        collection(db, "menuItems"),

        (snapshot) => {
            menuList.replaceChildren();

            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            document.getElementById("totalItems").textContent =
                items.length;

            document.getElementById("availableItems").textContent =
                items.filter(item => item.available === true).length;

            if (items.length === 0) {
                menuMessage.textContent = "No menu items found.";
                return;
            }

            menuMessage.textContent = "";


items.forEach(item => {
    const card = document.createElement("div");
    card.className = "menu-item";

    const img = document.createElement("img");
    img.alt = item.name || "Food item";

    if (item.imageUrl) {
        img.src = item.imageUrl;
    } else {
        img.style.display = "none";
    }

    img.onerror = () => {
        img.style.display = "none";
    };

    const info = document.createElement("div");
    info.className = "menu-item-info";

    const name = document.createElement("h3");
    name.textContent = item.name || "Unnamed item";

    const description = document.createElement("p");
    description.textContent = item.description || "No description";

    const category = document.createElement("p");
    category.textContent = getCategoryName(item.categoryId);

    const price = document.createElement("p");
    price.className = "menu-price";
    price.textContent =
        "₹" + Number(item.price || 0).toLocaleString("en-IN");

    const availability = document.createElement("p");
    availability.textContent =
        item.available ? "Available" : "Unavailable";

    const actions = document.createElement("div");
    actions.className = "menu-item-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editMenuItem(item));

    const availabilityButton = document.createElement("button");
    availabilityButton.className = "availability-button";
    availabilityButton.textContent =
        item.available ? "Mark Unavailable" : "Mark Available";

    availabilityButton.addEventListener("click", () =>
        toggleAvailability(item)
    );

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () =>
        deleteMenuItem(item)
    );

    actions.append(editButton, availabilityButton, deleteButton);

    info.append(
        name,
        description,
        category,
        price,
        availability,
        actions
    );

    card.append(img, info);
    menuList.append(card);
});

        },

        (error) => {
            console.error("Firestore error:", error);
            menuMessage.textContent =
                "Could not load menu. Check Firestore permissions.";
        }
    );
}

// Add new food item
addMenuForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;

    if (!user || !allowedAdmins.includes(user.uid)) {
        formMessage.textContent = "You are not authorized.";
        return;
    }

    const name = document.getElementById("foodName").value.trim();
    const description =
        document.getElementById("foodDescription").value.trim();
    const price = Number(document.getElementById("foodPrice").value);
    const categoryId = foodCategory.value;
    const imageUrl = document.getElementById("foodImage").value.trim();
    const available = document.getElementById("foodAvailable").checked;

    if (!name || !description || !categoryId ||
        !Number.isFinite(price) || price < 0) {
        formMessage.textContent = "Please enter valid item details.";
        return;
    }

    if (!isAllowedImageReference(imageUrl)) {
        formMessage.textContent = "Use an https:// image link or a valid assets/images/ file path.";
        return;
    }

    addFoodButton.disabled = true;
    formMessage.textContent = "Adding food item...";

    try {
        await addDoc(collection(db, "menuItems"), {
            name,
            description,
            price,
            categoryId,
            imageUrl,
            available,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        addMenuForm.reset();
        document.getElementById("foodAvailable").checked = true;
        updateImagePreview();

        formMessage.textContent = "Food item added successfully!";
    } catch (error) {
        console.error("Add item error:", error);
        formMessage.textContent =
            "Could not add item. Check your Firestore rules.";
    } finally {
        addFoodButton.disabled = false;
    }
});


function getCategoryName(categoryId) {
    const category = activeCategories.find(
        category => category.id === categoryId
    );

    return category ? category.name : "Unknown category";
}

// Edit menu item
async function editMenuItem(item) {
    const name = prompt("Food name:", item.name || "");
    if (name === null) return;

    const description = prompt(
        "Description:",
        item.description || ""
    );
    if (description === null) return;

    const priceInput = prompt(
        "Price in rupees:",
        String(item.price ?? "")
    );
    if (priceInput === null) return;

    const price = Number(priceInput);

    if (
        !name.trim() ||
        !description.trim() ||
        priceInput.trim() === "" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        alert("Please enter valid item details.");
        return;
    }

    const categoryOptions = activeCategories
        .map(category => `${category.id} = ${category.name}`)
        .join("\n");

    const categoryId = prompt(
        "Enter category ID:\n" + categoryOptions,
        item.categoryId || ""
    );

    if (categoryId === null) return;

    if (!activeCategories.some(category => category.id === categoryId)) {
        alert("Please enter a valid active category ID.");
        return;
    }

    const imageUrlInput = prompt(
        "Image https:// URL or assets/images/ path (leave blank for no image):",
        item.imageUrl || ""
    );
    if (imageUrlInput === null) return;
    const imageUrl = imageUrlInput.trim();
    if (!isAllowedImageReference(imageUrl)) {
        alert("Use an https:// image link or a valid assets/images/ file path.");
        return;
    }

    try {
        await updateDoc(doc(db, "menuItems", item.id), {
            name: name.trim(),
            description: description.trim(),
            price,
            categoryId,
            imageUrl,
            updatedAt: serverTimestamp()
        });

        alert("Menu item updated successfully!");
    } catch (error) {
        console.error(error);
        alert("Could not update menu item.");
    }
}

// Toggle availability
async function toggleAvailability(item) {
    try {
        await updateDoc(doc(db, "menuItems", item.id), {
            available: !item.available,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error(error);
        alert("Could not update availability.");
    }
}

// Delete menu item
async function deleteMenuItem(item) {
    const confirmed = confirm(
        `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) return;

    try {
        await deleteDoc(doc(db, "menuItems", item.id));
        alert("Menu item deleted.");
    } catch (error) {
        console.error(error);
        alert("Could not delete menu item.");
    }
}


// Authentication state
onAuthStateChanged(auth, async (user) => {
    if (unsubscribeMenu) {
        unsubscribeMenu();
        unsubscribeMenu = null;
    }

    if (user && allowedAdmins.includes(user.uid)) {
        loginSection.hidden = true;
        dashboardSection.hidden = false;

        await loadCategories();
        loadMenuItems();
    } else {
        loginSection.hidden = false;
        dashboardSection.hidden = true;
        menuList.replaceChildren();

        if (user) {
            loginMessage.textContent =
                `Signed in as ${user.email || "this account"}, but it is not authorized for the dashboard. ` +
                `Add this UID to allowedAdmins in admin.js: ${user.uid}`;
            await signOut(auth);
        }
    }
});

// Logout
logoutButton.addEventListener("click", async () => {
    await signOut(auth);
});
