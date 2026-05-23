import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile // 1. IMPORTACIÓN OBLIGATORIA: Para guardar nombre y apellido
} from 'firebase/auth';
import { Alert, Dimensions, PixelRatio, Platform } from 'react-native';

export const AuthContext = createContext();

// --- CONFIGURACIÓN DE RESPONSIVIDAD DINÁMICA ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 360; // Base móvil estándar

function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === 'android') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Almacenamos tanto el uid, email como el displayName actualizado
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName 
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. CORRECCIÓN DEL MÉTODO: Ahora recibe firstName y lastName desde RegisterScreen
  const register = async (email, password, firstName, lastName) => {
    try {
      setLoading(true);
      
      // Crea el usuario en Firebase con las credenciales básicas
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Combina los campos de texto del estudiante
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      // Impacta directamente el perfil nativo en los servidores de Firebase
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      // Forzamos la actualización del estado local para que el Dashboard lo renderice inmediatamente
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName
      });

      Alert.alert('Registro Exitoso', 'Tu cuenta UDB ha sido creada e ingresada al sistema.');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Por favor, escribe tu correo electrónico.');
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Correo Enviado', 'Se ha enviado un enlace de restauración a tu correo.');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleAuthError = (error) => {
    switch (error.code) {
      case 'auth/invalid-email':
        Alert.alert('Formato Inválido', 'La estructura del correo electrónico no es correcta.');
        break;
      case 'auth/email-already-in-use':
        Alert.alert('Cuenta Duplicada', 'Este correo ya se encuentra registrado por otro estudiante.');
        break;
      case 'auth/weak-password':
        Alert.alert('Contraseña Débil', 'La seguridad exige un mínimo de 6 caracteres.');
        break;
      default:
        Alert.alert('Error de Servidor', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword, normalize }}>
      {children}
    </AuthContext.Provider>
  );
};