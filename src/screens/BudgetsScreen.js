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