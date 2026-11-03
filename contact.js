// Fill these values only after the restaurant confirms them.
// WhatsApp must include the country code, using digits only (example format: 91XXXXXXXXXX).
const restaurantContact = {
    address: "",
    phone: "",
    whatsapp: "",
    openingHours: ""
};

const addressFallback = document.getElementById("contactAddressFallback");
const addressLink = document.getElementById("contactAddress");
const phoneFallback = document.getElementById("contactPhoneFallback");
const phoneLink = document.getElementById("contactPhone");
const hours = document.getElementById("contactHours");
const whatsappButton = document.getElementById("whatsappButton");

if (restaurantContact.address.trim()) {
    addressLink.textContent = restaurantContact.address.trim();
    addressLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantContact.address.trim())}`;
    addressLink.hidden = false;
    addressFallback.hidden = true;
}

const phoneDigits = restaurantContact.phone.replace(/[^\d+]/g, "");
if (/^\+?\d{8,15}$/.test(phoneDigits)) {
    phoneLink.textContent = restaurantContact.phone.trim();
    phoneLink.href = `tel:${phoneDigits}`;
    phoneLink.hidden = false;
    phoneFallback.hidden = true;
}

if (restaurantContact.openingHours.trim()) {
    hours.textContent = restaurantContact.openingHours.trim();
}

const whatsappDigits = restaurantContact.whatsapp.replace(/\D/g, "");
if (/^\d{8,15}$/.test(whatsappDigits)) {
    whatsappButton.href = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hello ALIYAR MANDI, I would like to ask about placing an order.")}`;
    whatsappButton.hidden = false;
}
