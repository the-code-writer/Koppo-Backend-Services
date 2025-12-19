// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDDk4lV92VvfaN0YlmLijf-0YLPVBLkOzY",
    authDomain: "ndutax-bot.firebaseapp.com",
    projectId: "ndutax-bot",
    storageBucket: "ndutax-bot.firebasestorage.app",
    messagingSenderId: "1085254237232",
    appId: "1:1085254237232:web:cc3df3d7064d94f91ec1f5",
    measurementId: "G-FJP733ZHMM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


//npm install firebase

//npm install -g firebase-tools

//firebase login

//firebase init

//firebase deploy

//npm install firebase-admin npm install --save-dev @types/firebase-admin