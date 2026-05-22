import React, { useState, useContext, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ScrollView,
  Dimensions,
  PixelRatio,
  Platform
} from 'react-native';
import { FinanceContext } from '../context/FinanceContext';
// 1. Importamos el contexto del tema que creaste
import { ThemeContext } from '../context/ThemeContext'; 
import BudgetProgressBar from '../components/BudgetProgressBar';

// --- CONFIGURACIÓN DE RESPONSIVIDAD DINÁMICA ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 360; 

function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === 'android') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export default function BudgetsScreen() {
  // Consumo de datos financieros
  const { 
    budgets = [], 
    transactions = [], 
    allCategories = [], 
    addBudget, 
    deleteBudget 
  } = useContext(FinanceContext) || {};
  // 2. Consumo del tema global (Mismo mecanismo de Dashboard)
  const { theme, isDarkMode } = useContext(ThemeContext) || {};
  
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  
  // Estado para controlar visualmente el enfoque del teclado en el input numérico
  const [isLimitFocused, setIsLimitFocused] = useState(false);
  // OPTIMIZACIÓN: Pre-calcular los gastos mensuales agrupados por categoría
  const spentByCategory = useMemo(() => {
    const currentYearMonth = new Date().toISOString().slice(0, 7); 
    const totals = {};

    transactions.forEach(t => {
      if (
        t && 
        t.type === 'expense' && 
        t.category && 
        t.date && 
        t.date.startsWith(currentYearMonth)
      ) {
        const catKey = t.category.trim().toLowerCase();
        const amount = Number(t.amount || 0);
        totals[catKey] = (totals[catKey] || 0) + amount;
      }
    });

    return totals;
  }, [transactions]);
   const handleSave = async () => {
    const cleanCategory = category.trim();
    const cleanLimit = limit.trim().replace(',', '.');

    if (!cleanCategory || !cleanLimit) {
      Alert.alert('Incompleto', 'Selecciona una categoría e ingresa el límite mensual.');
      return;
    }

    const categoryExists = allCategories.some(
      cat => cat.trim().toLowerCase() === cleanCategory.toLowerCase()
    );

    if (!categoryExists) {
      Alert.alert('Categoría No Permitida', 'Solo puedes asignar presupuestos a las categorías existentes.');
      return;
    }

    const budgetAlreadyExists = budgets.some(
      b => b.category && b.category.trim().toLowerCase() === cleanCategory.toLowerCase()
    );

    if (budgetAlreadyExists) {
      Alert.alert('Presupuesto Duplicado', `Ya definiste un límite para "${cleanCategory}".`);
      return;
    }

    const numericLimit = Number(cleanLimit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      Alert.alert('Monto Inválido', 'Por favor, ingresa un límite numérico mayor a cero.');
      return;
    }

    try {
      await addBudget(cleanCategory, cleanLimit);
      setCategory('');
      setLimit('');
      Alert.alert('Éxito', 'Límite establecido de forma correcta.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el presupuesto.');
    }
  };

  const handleDelete = (id, categoryName) => {
    Alert.alert(
      'Eliminar Presupuesto',
      `¿Deseas quitar el límite de gastos mensual para "${categoryName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteBudget(id);
              Alert.alert('Eliminado', 'El presupuesto fue removido.');
            } catch (error) {
              Alert.alert('Error', 'No se pudo borrar el presupuesto.');
            }
          } 
        }
      ]
    );
  };