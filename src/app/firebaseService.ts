// src/firebaseService.ts
import * as admin from 'firebase-admin';
import { initializeApp } from "firebase/app";
import 'dotenv/config';
const firebaseConfig = {
  apiKey: "AIzaSyAIkC9pqJFCE0FPVJBeQqyMkM2MjB7xXOI",
  authDomain: "koppo-ai.firebaseapp.com",
  projectId: "koppo-ai",
  storageBucket: "koppo-ai.firebasestorage.app",
  messagingSenderId: "163810851712",
  appId: "1:163810851712:web:eebdc1db4305d345eb1f65",
  measurementId: "G-JY2Y637FHF"
};

// Initialize Firebase
export const firebaseInstance = initializeApp(firebaseConfig);

export class FirebaseService {
    private static instance: FirebaseService;
    public readonly firestore: admin.firestore.Firestore;
    public readonly realtimeDb: admin.database.Database;

    private constructor() {

        // Initialize Firebase Admin SDK if not already initialized
        if (!admin.apps.length) {
            const serviceAccount = require(`${process.env.INIT_CWD}/src/${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: 'https://koppo-ai-default-rtdb.firebaseio.com' // Replace with your Realtime DB URL
            });
        }
        console.log("GOOGLE_APPLICATION_CREDENTIALS", [admin.apps])
        this.firestore = admin.firestore();
        this.realtimeDb = admin.database();
    }

    public static getInstance(): FirebaseService {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }
}
