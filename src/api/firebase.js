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
 * Opção A - Usar arquivo .env (RECOMENDADO e SEGURO):
 * Crie um arquivo .env.local na raiz do projeto:
 * 
 * VITE_FIREBASE_API_KEY=AIza...
 * VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=seu-projeto-id
 * VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
 * VITE_FIREBASE_APP_ID=1:123456:web:abc123
 * 
 * O arquivo .env.local está protegido pelo .gitignore e NÃO será enviado ao GitHub.
 * 
 * Opção B - Configuração padrão (fallback):
 * As credenciais abaixo são usadas como fallback se as variáveis de ambiente não estiverem definidas.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration object
// Usa variáveis de ambiente se disponíveis (recomendado para segurança)
// Caso contrário, usa valores padrão como fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA0TAi6othrUEuoGvsG1N3n61IE2bSSF5Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "quantumleap-akwyh.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quantumleap-akwyh",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "quantumleap-akwyh.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "547569031304",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:547569031304:web:13166b794e7c00b985673d"
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


