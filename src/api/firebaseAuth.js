/**
 * Firebase Authentication Helper
 * Funções auxiliares para autenticação com Firebase
 */

import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    updateProfile,
    updatePassword,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/**
 * Login com email e senha
 */
export const loginWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
};

/**
 * Login com Google
 */
export const loginWithGoogle = async () => {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        return userCredential.user;
    } catch (error) {
        console.error('Erro no login com Google:', error);
        throw error;
    }
};

/**
 * Registrar novo usuário
 */
export const registerWithEmail = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Atualizar nome do usuário
        if (displayName) {
            await updateProfile(userCredential.user, { displayName });
        }
        
        return userCredential.user;
    } catch (error) {
        console.error('Erro no registro:', error);
        throw error;
    }
};

/**
 * Logout
 */
export const logout = async () => {
    try {
        await signOut(auth);
        console.log('✅ Logout realizado com sucesso');
    } catch (error) {
        console.error('Erro no logout:', error);
        throw error;
    }
};

/**
 * Atualizar perfil do usuário
 */
export const updateUserProfile = async (displayName, photoURL) => {
    try {
        await updateProfile(auth.currentUser, { displayName, photoURL });
        return auth.currentUser;
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
    }
};

/**
 * Alterar senha
 */
export const changePassword = async (newPassword) => {
    try {
        await updatePassword(auth.currentUser, newPassword);
        console.log('✅ Senha alterada com sucesso');
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        throw error;
    }
};

/**
 * Resetar senha por email
 */
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('✅ Email de reset enviado');
    } catch (error) {
        console.error('Erro ao enviar email de reset:', error);
        throw error;
    }
};

/**
 * Observar mudanças no estado de autenticação
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Obter usuário atual
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

