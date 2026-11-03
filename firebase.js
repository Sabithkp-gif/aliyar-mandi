
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU9_H9Jdj_7C4psA4fkLRC4ao05WPiy-k",
  authDomain: "aliyar-mandi.firebaseapp.com",
  projectId: "aliyar-mandi",
  storageBucket: "aliyar-mandi.firebasestorage.app",
  messagingSenderId: "794519743392",
  appId: "1:794519743392:web:2a16974a9f635ee06852c5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// IMPORTANT: Export all three
export { app, auth, db };
