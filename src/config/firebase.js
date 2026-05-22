import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// NUEVO: Importamos el inicializador de autenticación
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCkHN_NPXdMbSnWA9IcEBGXDhEga8amMCQ",
  authDomain: "finanzasdesafio3.firebaseapp.com",
  projectId: "finanzasdesafio3",
  storageBucket: "finanzasdesafio3.firebasestorage.app",
  messagingSenderId: "472465478521",
  appId: "1:472465478521:web:66782676e046b3878655a8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// NUEVO: Inicializar Auth forzando la persistencia nativa con AsyncStorage (Garantiza el requisito)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Exportamos auth junto a db
export { db, auth };