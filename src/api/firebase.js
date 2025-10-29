/**
 * Firebase Configuration and Initialization
 * 
 * Para configurar o Firebase:
 * 
 * 1. Acesse o Firebase Console: https://console.firebase.google.com/
 * 2. Crie um novo projeto ou selecione um existente
 * 3. Vá em "Project Settings" (ícone de engrenagem)
 * 4. Na seção "Your apps", clique em "</>" (Web)
 * 5. Copie as credenciais do Firebase
 * 
 * Opção A - Usar arquivo .env (recomendado):
 * Crie um arquivo .env na raiz do projeto:
 * 
 * VITE_FIREBASE_API_KEY=AIza...
 * VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=seu-projeto-id
 * VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
 * VITE_FIREBASE_APP_ID=1:123456:web:abc123
 * 
 * Opção B - Editar diretamente:
 * Substitua os valores padrão abaixo pelas suas credenciais
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyA0TAi6othrUEuoGvsG1N3n61IE2bSSF5Q",
  authDomain: "quantumleap-akwyh.firebaseapp.com",
  projectId: "quantumleap-akwyh",
  storageBucket: "quantumleap-akwyh.firebasestorage.app",
  messagingSenderId: "547569031304",
  appId: "1:547569031304:web:13166b794e7c00b985673d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Export app instance
export default app;

