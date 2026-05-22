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
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* SECCIÓN CREAR / CONFIGURAR */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Configurar Límite Mensual</Text>
        
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Categoría seleccionada</Text>
        <View style={[
          styles.customSelectTrigger, 
          { backgroundColor: isDarkMode ? '#0F172A' : '#F0F2F5', borderColor: theme.border },
          category !== '' && { borderColor: theme.accent, borderWidth: 1.5, backgroundColor: theme.card }
        ]}>
          <Text style={[
            styles.selectTriggerText, 
            { color: theme.textSecondary },
            category !== '' && { color: theme.textPrimary, fontWeight: '500' }
          ]} numberOfLines={1}>
            {category || 'Toca una categoría de la lista de abajo'}
          </Text>
        </View>

        <Text style={[styles.lblMini, { color: theme.textSecondary }]}>Categorías disponibles</Text>
        <View style={styles.scrollChipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {allCategories.map((cat, index) => {
              const isSelected = category.trim().toLowerCase() === cat.trim().toLowerCase();
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.chip, 
                    { backgroundColor: isDarkMode ? '#1E293B' : '#F0F2F5', borderColor: theme.border },
                    isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }
                  ]} 
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.chipText, 
                    { color: isDarkMode ? '#94A3B8' : '#486581' },
                    isSelected && styles.textWhite
                  ]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Monto del presupuesto</Text>
        <View style={[
          styles.currencyInputContainer, 
          { backgroundColor: isDarkMode ? '#0F172A' : '#F0F2F5', borderColor: theme.border },
          (limit !== '' || isLimitFocused) && { borderColor: theme.accent, borderWidth: 1.5, backgroundColor: theme.card }
        ]}>
          <Text style={[
            styles.currencySymbol, 
            { color: theme.textPrimary }, 
            (limit !== '' || isLimitFocused) && { color: theme.accent }
          ]}>$</Text>
          <TextInput 
            style={[styles.currencyInput, { color: theme.textPrimary }]} 
            placeholder="0.00" 
            keyboardType="decimal-pad" 
            value={limit} 
            onChangeText={setLimit} 
            placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
            onFocus={() => setIsLimitFocused(true)}
            onBlur={() => setIsLimitFocused(false)}
          />
        </View>
        
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={handleSave} activeOpacity={0.9}>
          <Text style={styles.btnText}>Establecer Presupuesto</Text>
        </TouchableOpacity>
      </View>

      {/* SECCIÓN LISTADO / CONTROL */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Estado de Presupuestos</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Límites asignados y consumo del mes actual</Text>
      </View>
      
      <FlatList
        data={budgets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const catKey = item.category ? item.category.trim().toLowerCase() : '';
          const spent = spentByCategory[catKey] || 0;

          return (
            <View style={[styles.budgetListItem, { borderColor: theme.border }]}>
              <View style={styles.budgetMainRow}>
                <View style={{ flex: 1, paddingRight: normalize(4) }}>
                  <BudgetProgressBar 
                    category={item.category} 
                    spent={spent} 
                    limit={Number(item.monthlyLimit || 0)} 
                  />
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.rowDeleteBtn, 
                    isDarkMode && { backgroundColor: '#311C1C', borderColor: '#552222' }
                  ]}
                  onPress={() => handleDelete(item.id, item.category)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rowDeleteBtnText, isDarkMode && { color: '#F87171' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.empty, { color: theme.textSecondary }]}>No has definido presupuestos para este período.</Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContainerStyle, 
          { backgroundColor: theme.card, borderColor: theme.border },
          budgets.length === 0 && { backgroundColor: 'transparent', borderWidth: 0 }
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: normalize(16) 
  },
  card: { 
    padding: normalize(20), 
    borderRadius: normalize(16), 
    borderWidth: 1, 
    marginBottom: normalize(24) 
  },
  cardTitle: { 
    fontSize: normalize(16), 
    fontWeight: '700', 
    marginBottom: normalize(18) 
  },
  inputLabel: { 
    fontSize: normalize(11), 
    fontWeight: '600', 
    marginBottom: normalize(6), 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(12),
    borderWidth: 1,
    marginBottom: normalize(16),
    paddingLeft: normalize(16),
    height: normalize(48)
  },
  currencySymbol: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginRight: normalize(2)
  },
  currencyInput: {
    flex: 1,
    paddingVertical: normalize(10),
    paddingRight: normalize(16),
    fontSize: normalize(15),
    fontWeight: '500'
  },
  customSelectTrigger: { 
    paddingHorizontal: normalize(16), 
    borderRadius: normalize(12), 
    marginBottom: normalize(16), 
    borderWidth: 1, 
    justifyContent: 'center', 
    height: normalize(48) 
  },
  selectTriggerText: { 
    fontSize: normalize(14)
  },
  btn: { 
    padding: normalize(14), 
    borderRadius: normalize(12), 
    alignItems: 'center', 
    justifyContent: 'center',
    height: normalize(48),
    marginTop: normalize(4) 
  },
  btnText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: normalize(15) 
  },
  sectionHeader: { 
    marginBottom: normalize(14) 
  },
  sectionTitle: { 
    fontSize: normalize(16), 
    fontWeight: '700' 
  },
  sectionSubtitle: { 
    fontSize: normalize(12), 
    marginTop: normalize(2) 
  },
  lblMini: { 
    fontSize: normalize(11), 
    fontWeight: '600', 
    marginBottom: normalize(8), 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  scrollChipsWrapper: {
    height: normalize(38), 
    marginBottom: normalize(16)
  },
  chipContainer: { 
    flexDirection: 'row' 
  },
  chip: { 
    paddingVertical: normalize(6), 
    paddingHorizontal: normalize(14), 
    borderRadius: normalize(20), 
    marginRight: normalize(8), 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: normalize(32) 
  },
  chipText: { 
    fontSize: normalize(12), 
    fontWeight: '500' 
  },
  listContainerStyle: { 
    borderRadius: normalize(16), 
    borderWidth: 1, 
    overflow: 'hidden' 
  },
  budgetListItem: { 
    padding: normalize(16), 
    borderBottomWidth: 1
  },
  budgetMainRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  rowDeleteBtn: { 
    backgroundColor: '#FFF5F5', 
    paddingVertical: normalize(8), 
    paddingHorizontal: normalize(12), 
    borderRadius: normalize(10), 
    marginLeft: normalize(12),
    borderWidth: 1,
    borderColor: '#FFE3E3',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rowDeleteBtnText: { 
    color: '#E53E3E', 
    fontSize: normalize(12), 
    fontWeight: '600' 
  },
  emptyContainer: { 
    paddingVertical: normalize(40), 
    paddingHorizontal: normalize(16) 
  },
  empty: { 
    textAlign: 'center', 
    fontSize: normalize(14), 
    fontStyle: 'italic' 
  },
  textWhite: { 
    color: '#FFFFFF', 
    fontWeight: '600' 
  }
});