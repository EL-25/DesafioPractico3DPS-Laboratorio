import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';

// EXPO FIX: Usamos la librería nativa de Expo para evitar romper las fuentes vectoriales
import Ionicons from '@expo/vector-icons/Ionicons';

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

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'alert-circle'; // Icono por defecto (fallback)

          if (route.name === 'Dashboard') {
            iconName = 'pie-chart';
          } else if (route.name === 'Transacciones') {
            iconName = 'list';
          } else if (route.name === 'Presupuestos') {
            iconName = 'wallet';
          }

          // Retornamos el componente vectorial con escalado responsivo controlado
          return <Ionicons name={iconName} size={normalize(22)} color={color} />;
        },
        // Configuración de la paleta de colores para los estados de selección
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        
        // Estilos adaptativos para la etiqueta de texto inferior
        tabBarLabelStyle: {
          fontSize: normalize(11),
          fontWeight: '500',
          paddingBottom: Platform.OS === 'ios' ? 0 : normalize(4),
        },
        
        // Estilos adaptativos de la estructura del TabBar inferior
        tabBarStyle: {
          height: Platform.OS === 'ios' ? normalize(75) : normalize(60),
          paddingTop: normalize(6),
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },

        // Mantiene visible el encabezado superior automático de React Navigation
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
          // Altura base balanceada para las vistas hijas que no la sobreescriban dinámicamente
          height: Platform.OS === 'ios' ? normalize(90) : normalize(80),
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: normalize(17),
        },
      })}
    >
      {/* Definición de los módulos accesibles desde la barra inferior de navegación */}
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Resumen General' }} 
      />
      <Tab.Screen 
        name="Transacciones" 
        component={TransactionsScreen} 
        options={{ title: 'Historial de Movimientos' }} 
      />
      <Tab.Screen 
        name="Presupuestos" 
        component={BudgetsScreen} 
        options={{ title: 'Límites de Gastos' }} 
      />
    </Tab.Navigator>
  );
}