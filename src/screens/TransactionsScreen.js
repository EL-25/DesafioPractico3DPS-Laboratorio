import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  Modal,
  Dimensions,
  PixelRatio
} from 'react-native';
import { FinanceContext } from '../context/FinanceContext';
import { ThemeContext } from '../context/ThemeContext'; 
import DateTimePicker from '@react-native-community/datetimepicker';

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

const DEFAULT_ACCOUNTS = [
  { id: 'default_efectivo', name: 'Efectivo' },
  { id: 'default_tarjeta', name: 'Tarjeta' },
  { id: 'default_banco', name: 'Cuenta banco' }
];

export default function TransactionsScreen() {
  const { 
    transactions = [], 
    accounts = [], 
    allCategories = [], 
    addTransaction, 
    updateTransaction, 
    deleteTransaction, 
    addAccount,
    deleteAccount,
    addCustomCategory,
    deleteCustomCategory, 
    customCategories = []  
  } = useContext(FinanceContext) || {};

  const { theme, isDarkMode } = useContext(ThemeContext); 

  // --- ESTADOS DEL FORMULARIO DE CAPTURA/EDICIÓN ---
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState('$');
  const [type, setType] = useState('expense'); 
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  
  // --- ESTADOS PARA EL CALENDARIO Y SELECTORES ---
  const [dateObject, setDateObject] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCatSelector, setShowCatSelector] = useState(false);
  const [showFilterCatSelector, setShowFilterCatSelector] = useState(false);

  // --- ESTADO PARA CREAR NUEVOS ELEMENTOS ---
  const [newAccountName, setNewAccountName] = useState('');
  const [newCatName, setNewCatName] = useState('');

  // --- ESTADOS DE FILTROS AVANZADOS ---
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState(''); 
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // --- ESTADOS PARA EL MODAL TICKET ---
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketVisible, setIsTicketVisible] = useState(false);

  const displayAccounts = accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;

  useEffect(() => {
    const initializeDefaultAccounts = async () => {
      if (accounts.length === 0 && typeof addAccount === 'function') {
        try {
          await addAccount('Efectivo');
          await addAccount('Tarjeta');
          await addAccount('Cuenta banco');
        } catch (error) {
          console.log('Error al inicializar cuentas:', error);
        }
      }
    };
    initializeDefaultAccounts();
  }, [accounts.length]);

  useEffect(() => {
    if (displayAccounts.length > 0 && !accountId) {
      setAccountId(displayAccounts[0].id);
    }
  }, [displayAccounts, accountId]);

  // Filtro estricto de texto: Remueve cualquier dígito numérico del string
  const handleTextOnlyChange = (text, setTargetState) => {
    const cleanText = text.replace(/[0-9]/g, '');
    setTargetState(cleanText);
  };

  const handleAmountChange = (text) => {
    if (text === '' || text === '$') {
      setAmount('$');
      return;
    }
    let cleanNumber = text.replace(/[^0-9.]/g, '');
    const parts = cleanNumber.split('.');
    if (parts.length > 2) {
      cleanNumber = parts[0] + '.' + parts.slice(1).join('');
    }
    setAmount(`$${cleanNumber}`);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObject(selectedDate);
    }
  };

  const getDisplayDateString = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getDatabaseDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Incompleto', 'Por favor ingresa un nombre válido para la categoría.');
      return;
    }
    if (typeof addCustomCategory !== 'function') return;
    
    const res = await addCustomCategory(newCatName.trim());
    if (res && res.success) {
      Alert.alert('Éxito', `Categoría "${newCatName.trim()}" guardada.`);
      setCategory(newCatName.trim());
      setNewCatName('');
    } else {
      Alert.alert('Aviso', res?.message || 'No se pudo guardar la categoría.');
    }
  };

  const confirmDeleteCategory = (categoryName) => {
    const foundCategory = customCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!foundCategory) {
      Alert.alert('Aviso', 'Las categorías predeterminadas no se pueden eliminar.');
      return;
    }
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de borrar permanentemente "${categoryName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteCustomCategory(foundCategory.id);
              if (category === categoryName) setCategory('');
              if (filterCategory === categoryName) setFilterCategory('');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la categoría.');
            }
          } 
        }
      ]
    );
  };

  const confirmDeleteAccount = (account) => {
    const protectedNames = ['efectivo', 'tarjeta', 'cuenta banco', 'banco'];
    const currentNameClean = account.name.toLowerCase().trim();
    
    if (account.id.startsWith('default_') || protectedNames.includes(currentNameClean)) {
      Alert.alert('Acceso Denegado', 'Esta cuenta es requerida por el sistema.');
      return;
    }

    Alert.alert(
      'Eliminar Cuenta',
      `¿Estás seguro de borrar "${account.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              if (accountId === account.id) setAccountId('');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta.');
            }
          } 
        }
      ]
    );
  };

  const handleSave = async () => {
    const rawAmount = amount.replace('$', '');
    if (!rawAmount.trim() || !category.trim() || !description.trim() || !accountId) {
      Alert.alert('Campos vacíos', 'Asegúrate de llenar todos los datos.');
      return;
    }
    if (isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un número mayor a cero.');
      return;
    }

    const transactionData = {
      amount: Number(rawAmount),
      type,
      category: category.trim(),
      accountId,
      description: description.trim(),
      date: getDatabaseDateString(dateObject)
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, transactionData);
        Alert.alert('Modificado', 'La transacción fue actualizada.');
      } else {
        await addTransaction(transactionData);
        Alert.alert('Guardado', 'La transacción fue registrada.');
      }
      resetForm();
    } catch (e) {
      Alert.alert('Error', 'Hubo un problema al guardar.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('$');
    setCategory('');
    setDescription('');
    setType('expense');
    if (displayAccounts.length > 0) setAccountId(displayAccounts[0].id);
    setDateObject(new Date());
    setShowCatSelector(false);
  };

  const handleSelectEdit = (item) => {
    setEditingId(item.id);
    setAmount(`$${item.amount}`);
    setType(item.type);
    setCategory(item.category);
    setAccountId(item.accountId);
    setDescription(item.description);
    if (item.date) {
      setDateObject(new Date(`${item.date}T12:00:00`));
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Deseas borrar permanentemente esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteTransaction(id) }
      ]
    );
  };

  const handleOpenTicket = (item) => {
    setSelectedTicket(item);
    setIsTicketVisible(true);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesAccount = filterAccount === 'all' || t.accountId === filterAccount;
    const matchesCategory = filterCategory === '' || (t.category && t.category.toLowerCase() === filterCategory.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    
    let matchesPeriod = true;
    if (filterPeriod === 'current_month') {
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      matchesPeriod = t.date && t.date.startsWith(currentYearMonth);
    } else if (filterPeriod === 'today') {
      const todayStr = getDatabaseDateString(new Date());
      matchesPeriod = t.date === todayStr;
    }
    
    return matchesAccount && matchesCategory && matchesPeriod && matchesType;
  });

  const renderHistoryDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateString;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BLOQUE 1: FORMULARIO DINÁMICO PRINCIPAL */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {editingId ? '✏️ Editando Registro' : '➕ Capturar Transacción'}
          </Text>
          
          <View style={[styles.typeSelectorRow, { backgroundColor: isDarkMode ? theme.background : '#F1F5F9' }]}>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpenseActive]} 
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeBtnText, { color: type === 'expense' ? '#FFFFFF' : theme.textSecondary }]}>Gasto</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]} 
              onPress={() => setType('income')}
            >
              <Text style={[styles.typeBtnText, { color: type === 'income' ? '#FFFFFF' : theme.textSecondary }]}>Ingreso</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: normalize(8) }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Monto</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]} 
                placeholder="$0.00" 
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric" 
                value={amount} 
                onChangeText={handleAmountChange} 
              />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Categoría</Text>
              <TouchableOpacity onPress={() => setShowCatSelector(!showCatSelector)} activeOpacity={0.8}>
                <View style={[
                  styles.customSelectTrigger, 
                  { backgroundColor: theme.background, borderColor: theme.border },
                  category !== '' && { borderColor: theme.accent, borderWidth: 1.5 }
                ]}>
                  <Text style={[
                    styles.selectTriggerText, 
                    { color: theme.textSecondary },
                    category !== '' && { color: theme.textPrimary, fontWeight: '500' }
                  ]} numberOfLines={1}>
                    {category || 'Seleccionar 🔍'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {showCatSelector && (
            <View style={[styles.selectorWrapper, { borderColor: theme.border }]}>
              <Text style={[styles.lblMini, { color: theme.textSecondary }]}>Presiona para elegir / Mantén para borrar:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingVertical: normalize(4) }}>
                {(allCategories || []).map((cat, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.chip, 
                      { backgroundColor: isDarkMode ? theme.background : '#E2E8F0' },
                      category.toLowerCase() === cat.toLowerCase() && { backgroundColor: theme.accent }
                    ]} 
                    onPress={() => { setCategory(cat); setShowCatSelector(false); }}
                    onLongPress={() => confirmDeleteCategory(cat)} 
                    delayLongPress={600}
                  >
                    <Text style={[
                      styles.chipText, 
                      { color: theme.textPrimary },
                      category.toLowerCase() === cat.toLowerCase() && styles.textWhite
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: normalize(8) }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Fecha de Operación</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <View style={[styles.customSelectTrigger, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={{ fontSize: normalize(14), color: theme.textPrimary, fontWeight: '500' }}>{getDisplayDateString(dateObject)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Descripción</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]} 
                placeholder="Ej. Almuerzo, Pago..." 
                placeholderTextColor={theme.textSecondary}
                value={description} 
                onChangeText={(text) => handleTextOnlyChange(text, setDescription)} 
              />
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker value={dateObject} mode="date" display="default" onChange={onDateChange} />
          )}

          <Text style={[styles.sectionInnerLabel, { color: theme.textSecondary }]}>Cuenta Origen/Destino</Text>
          <View style={{ marginBottom: normalize(16) }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {displayAccounts.map(acc => (
                <TouchableOpacity 
                  key={acc.id} 
                  style={[
                    styles.accountChip, 
                    { backgroundColor: isDarkMode ? theme.background : '#E2E8F0', borderColor: theme.border },
                    accountId === acc.id && { backgroundColor: theme.accent }
                  ]} 
                  onPress={() => setAccountId(acc.id)}
                  onLongPress={() => confirmDeleteAccount(acc)}
                  delayLongPress={600}
                >
                  <Text style={[
                    styles.accountChipText, 
                    { color: theme.textPrimary },
                    accountId === acc.id && styles.textWhite
                  ]}>💳 {acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.btnSave, { backgroundColor: theme.accent }, editingId && { backgroundColor: '#F59E0B' }]} 
              onPress={handleSave}
              activeOpacity={0.9}
            >
              <Text style={styles.btnText}>{editingId ? 'Guardar Cambios' : 'Registrar Movimiento'}</Text>
            </TouchableOpacity>
            {editingId && (
              <TouchableOpacity style={[styles.btnCancel, { borderColor: theme.border }]} onPress={resetForm}>
                <Text style={[styles.btnCancelText, { color: theme.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* BLOQUE 2: ADMINISTRACIÓN DE CUENTAS Y CATEGORÍAS */}
        <View style={styles.cardRowLayout}>
          {/* NUEVA CUENTA: Libre (Acepta caracteres alfanuméricos) */}
          <View style={[styles.cardHalf, { marginRight: normalize(10), backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.smallCardTitle, { color: theme.textPrimary }]}>＋ Nueva Cuenta</Text>
            <TextInput 
              style={[styles.smallInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]} 
              placeholder="Ej. Visa 123..." 
              placeholderTextColor={theme.textSecondary}
              value={newAccountName} 
              onChangeText={setNewAccountName} 
              autoCapitalize="sentences"
            />
            <TouchableOpacity style={[styles.smallCardBtn, { backgroundColor: theme.accent }]} onPress={() => {
              if(!newAccountName.trim()) return;
              addAccount(newAccountName.trim());
              setNewAccountName('');
              Alert.alert('Éxito', 'Cuenta creada de forma exitosa.');
            }}>
              <Text style={styles.smallCardBtnText}>Crear</Text>
            </TouchableOpacity>
          </View>

          {/* NUEVA CATEGORÍA: Estrictamente texto (Filtra y remueve números) */}
          <View style={[styles.cardHalf, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.smallCardTitle, { color: theme.textPrimary }]}>🏷️ Nueva Categoría</Text>
            <TextInput 
              style={[styles.smallInput, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]} 
              placeholder="Nombre..." 
              placeholderTextColor={theme.textSecondary}
              value={newCatName} 
              onChangeText={(text) => handleTextOnlyChange(text, setNewCatName)} 
              autoCapitalize="sentences"
            />
            <TouchableOpacity style={[styles.smallCardBtn, { backgroundColor: '#6366F1' }]} onPress={handleCreateCategory}>
              <Text style={styles.smallCardBtnText}>Añadir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BLOQUE 3: FILTROS AVANZADOS */}
        <View style={[styles.filterCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.filterCardTitle, { color: theme.textPrimary }]}>🔍 Filtros Avanzados</Text>
          
          <View style={{ marginBottom: normalize(12) }}>
            <Text style={[styles.lblMini, { color: theme.textSecondary }]}>Filtrar por Categoría:</Text>
            <TouchableOpacity onPress={() => setShowFilterCatSelector(!showFilterCatSelector)} activeOpacity={0.8}>
              <View style={[
                styles.customSelectTrigger, 
                { backgroundColor: theme.background, borderColor: theme.border, marginBottom: normalize(4) },
                filterCategory !== '' && { borderColor: theme.accent, borderWidth: 1.5 }
              ]}>
                <Text style={[
                  styles.selectTriggerText, 
                  { color: theme.textSecondary },
                  filterCategory !== '' && { color: theme.textPrimary, fontWeight: '500' }
                ]} numberOfLines={1}>
                  {filterCategory || 'Todas las categorías 🔍'}
                </Text>
              </View>
            </TouchableOpacity>
            
            {filterCategory !== '' && (
              <TouchableOpacity onPress={() => setFilterCategory('')} style={{ alignSelf: 'flex-end', marginTop: normalize(2) }}>
                <Text style={{ fontSize: normalize(11), color: theme.danger, fontWeight: '600' }}>✖ Quitar Filtro</Text>
              </TouchableOpacity>
            )}
          </View>

          {showFilterCatSelector && (
            <View style={[styles.selectorWrapper, { borderColor: theme.border, marginBottom: normalize(12) }]}>
              <Text style={[styles.lblMini, { color: theme.textSecondary }]}>Selecciona una categoría para filtrar:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingVertical: normalize(4) }}>
                <TouchableOpacity 
                  style={[
                    styles.chip, 
                    { backgroundColor: isDarkMode ? theme.background : '#E2E8F0' },
                    filterCategory === '' && { backgroundColor: theme.accent }
                  ]} 
                  onPress={() => { setFilterCategory(''); setShowFilterCatSelector(false); }}
                >
                  <Text style={[styles.chipText, { color: theme.textPrimary }, filterCategory === '' && styles.textWhite]}>Todas</Text>
                </TouchableOpacity>
                {(allCategories || []).map((cat, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.chip, 
                      { backgroundColor: isDarkMode ? theme.background : '#E2E8F0' },
                      filterCategory.toLowerCase() === cat.toLowerCase() && { backgroundColor: theme.accent }
                    ]} 
                    onPress={() => { setFilterCategory(cat); setShowFilterCatSelector(false); }}
                  >
                    <Text style={[
                      styles.chipText, 
                      { color: theme.textPrimary },
                      filterCategory.toLowerCase() === cat.toLowerCase() && styles.textWhite
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ marginBottom: normalize(10) }}>
            <Text style={[styles.lblMini, { color: theme.textSecondary }]}>Tipo de Movimiento:</Text>
            <View style={styles.filterMiniRow}>
              {['all', 'expense', 'income'].map((t) => (
                <TouchableOpacity 
                  key={t}
                  style={[
                    styles.filterMiniBtn, 
                    { backgroundColor: isDarkMode ? theme.background : '#F1F5F9' },
                    filterType === t && { backgroundColor: theme.accent }
                  ]} 
                  onPress={() => setFilterType(t)}
                >
                  <Text style={[
                    styles.filterMiniText, 
                    { color: theme.textSecondary },
                    filterType === t && styles.textWhite
                  ]}>
                    {t === 'all' ? 'Todos' : t === 'expense' ? 'Gastos' : 'Ingresos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: normalize(6) }}>
              <Text style={[styles.lblMini, { color: theme.textSecondary }]}>Periodo:</Text>
              <View style={styles.filterMiniRow}>
                {['all', 'today', 'current_month'].map((p) => (
                  <TouchableOpacity 
                    key={p}
                    style={[
                      styles.filterMiniBtn, 
                      { backgroundColor: isDarkMode ? theme.background : '#F1F5F9' },
                      filterPeriod === p && { backgroundColor: theme.accent }
                    ]} 
                    onPress={() => setFilterPeriod(p)}
                  >
                    <Text style={[
                      styles.filterMiniText, 
                      { color: theme.textSecondary },
                      filterPeriod === p && styles.textWhite
                    ]}>
                      {p === 'all' ? 'Todo' : p === 'today' ? 'Hoy' : 'Mes'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flex: 1.2 }}>
              <Text style={[styles.lblMini, { color: theme.textSecondary }]}>Cuenta:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterMiniRow}>
                <TouchableOpacity 
                  style={[
                    styles.filterMiniBtn, 
                    { backgroundColor: isDarkMode ? theme.background : '#F1F5F9' },
                    filterAccount === 'all' && { backgroundColor: theme.accent }
                  ]} 
                  onPress={() => setFilterAccount('all')}
                >
                  <Text style={[styles.filterMiniText, { color: theme.textSecondary }, filterAccount === 'all' && styles.textWhite]}>Todas</Text>
                </TouchableOpacity>
                {displayAccounts.map(acc => (
                  <TouchableOpacity 
                    key={acc.id} 
                    style={[
                      styles.filterMiniBtn, 
                      { backgroundColor: isDarkMode ? theme.background : '#F1F5F9' },
                      filterAccount === acc.id && { backgroundColor: theme.accent }
                    ]} 
                    onPress={() => setFilterAccount(acc.id)}
                  >
                    <Text style={[styles.filterMiniText, { color: theme.textSecondary }, filterAccount === acc.id && styles.textWhite]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* BLOQUE 4: HISTORIAL DE MOVIMIENTOS */}
        <View style={styles.historySectionHeader}>
          <Text style={[styles.listHeaderTitle, { color: theme.textPrimary }]}>Historial de Movimientos</Text>
          <Text style={[styles.listHeaderSubtitle, { color: theme.textSecondary }]}>Presiona el registro para ver el recibo</Text>
        </View>
        
        <View style={[styles.historyListContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {filteredTransactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No se encontraron movimientos registrados.</Text>
          ) : (
            filteredTransactions.map((item, index) => {
              const currentAccountName = displayAccounts.find(a => a.id === item.accountId)?.name || 'Cuenta General';
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.txCard, 
                    { borderColor: theme.border },
                    index === filteredTransactions.length - 1 && { borderBottomWidth: 0 }
                  ]} 
                  onPress={() => handleOpenTicket(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, paddingRight: normalize(8) }}>
                    <View style={styles.txMetaLine}>
                      <Text style={[styles.txCategoryTitle, { color: theme.textPrimary }]} numberOfLines={1}>{item.category}</Text>
                      <View style={[styles.txAccountBadge, { backgroundColor: isDarkMode ? theme.background : '#F1F5F9' }]}>
                        <Text style={[styles.txAccountBadgeText, { color: theme.textSecondary }]} numberOfLines={1}>{currentAccountName}</Text>
                      </View>
                    </View>
                    {item.description ? <Text style={[styles.txDesc, { color: theme.textSecondary }]} numberOfLines={1}>{item.description}</Text> : null}
                    <Text style={[styles.txDate, { color: theme.textSecondary }]}>📆 {renderHistoryDate(item.date)}</Text>
                  </View>
                  
                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={[styles.txAmount, { color: item.type === 'income' ? theme.success : theme.danger }]} numberOfLines={1}>
                      {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                    </Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]} 
                        onPress={() => handleSelectEdit(item)}
                      >
                        <Text style={{ color: isDarkMode ? '#93C5FD' : '#3B82F6', fontSize: normalize(11), fontWeight: '600' }}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEF2F2', marginLeft: normalize(6) }]} 
                        onPress={() => confirmDelete(item.id)}
                      >
                        <Text style={{ color: isDarkMode ? '#FCA5A5' : '#EF4444', fontSize: normalize(11), fontWeight: '600' }}>Borrar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: normalize(60) }} />
      </ScrollView>

      {/* MODAL COMPONENTE: RECIBO MINIMALISTA ESTILO TICKET */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isTicketVisible}
        onRequestClose={() => setIsTicketVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.ticketContainer, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[styles.ticketBrand, { color: '#0F172A' }]}>COMPROBANTE</Text>
            <Text style={[styles.ticketSubtitle, { color: '#64748B' }]}>Control de Finanzas Personales</Text>
            <Text style={[styles.ticketDivider, { color: '#CBD5E1' }]}>------------------------------------------</Text>
            
            {selectedTicket && (
              <View style={styles.ticketBody}>
                <View style={styles.ticketRow}>
                  <Text style={[styles.ticketLabel, { color: '#64748B' }]}>ID TRANSACCIÓN:</Text>
                  <Text style={[styles.ticketValue, { color: '#0F172A' }]}>#{selectedTicket.id?.slice(0, 8).toUpperCase()}</Text>
                </View>
                
                <View style={styles.ticketRow}>
                  <Text style={[styles.ticketLabel, { color: '#64748B' }]}>FECHA:</Text>
                  <Text style={[styles.ticketValue, { color: '#0F172A' }]}>{renderHistoryDate(selectedTicket.date)}</Text>
                </View>

                <View style={styles.ticketRow}>
                  <Text style={[styles.ticketLabel, { color: '#64748B' }]}>TIPO:</Text>
                  <Text style={[styles.ticketValue, { color: selectedTicket.type === 'income' ? '#10B981' : '#EF4444', fontWeight: 'bold' }]}>
                    {selectedTicket.type === 'income' ? 'INGRESO' : 'GASTO'}
                  </Text>
                </View>

                <View style={styles.ticketRow}>
                  <Text style={[styles.ticketLabel, { color: '#64748B' }]}>CATEGORÍA:</Text>
                  <Text style={[styles.ticketValue, { color: '#0F172A' }]}>{selectedTicket.category.toUpperCase()}</Text>
                </View>

                <View style={styles.ticketRow}>
                  <Text style={[styles.ticketLabel, { color: '#64748B' }]}>CUENTA:</Text>
                  <Text style={[styles.ticketValue, { color: '#0F172A' }]}>
                    {(displayAccounts.find(a => a.id === selectedTicket.accountId)?.name || 'General').toUpperCase()}
                  </Text>
                </View>

                <View style={[styles.ticketRow, { marginTop: normalize(6) }]}>
                  <Text style={[styles.ticketLabel, { color: '#64748B' }]}>DESCRIPCIÓN:</Text>
                  <Text style={[styles.ticketValue, { color: '#334155', flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {selectedTicket.description}
                  </Text>
                </View>

                <Text style={[styles.ticketDivider, { color: '#CBD5E1' }]}>------------------------------------------</Text>
                
                <View style={[styles.ticketRow, { marginTop: normalize(4) }]}>
                  <Text style={{ fontSize: normalize(16), fontWeight: 'bold', color: '#0F172A' }}>TOTAL:</Text>
                  <Text style={{ fontSize: normalize(18), fontWeight: 'bold', color: selectedTicket.type === 'income' ? '#10B981' : '#EF4444' }}>
                    ${selectedTicket.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.ticketCloseBtn} onPress={() => setIsTicketVisible(false)}>
              <Text style={styles.ticketCloseBtnText}>CERRAR RECIBO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// --- HOJA DE ESTILOS LIMPIA Y OPTIMIZADA ---
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: normalize(14), paddingTop: normalize(10) },
  card: { borderRadius: 12, padding: normalize(14), borderWidth: 1, marginBottom: normalize(12), elevation: 2, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: normalize(15), fontWeight: '700', marginBottom: normalize(12), textAlign: 'center' },
  typeSelectorRow: { flexDirection: 'row', borderRadius: 8, padding: 4, marginBottom: normalize(14) },
  typeBtn: { flex: 1, paddingVertical: normalize(8), alignItems: 'center', borderRadius: 6 },
  typeBtnExpenseActive: { backgroundColor: '#EF4444' },
  typeBtnIncomeActive: { backgroundColor: '#10B981' },
  typeBtnText: { fontSize: normalize(13), fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: normalize(10), alignItems: 'flex-end' },
  inputLabel: { fontSize: normalize(11), fontWeight: '600', marginBottom: 4 },
  sectionInnerLabel: { fontSize: normalize(11), fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: normalize(10), height: normalize(38), fontSize: normalize(13) },
  customSelectTrigger: { borderWidth: 1, borderRadius: 8, paddingHorizontal: normalize(10), height: normalize(38), justifyContent: 'center' },
  selectTriggerText: { fontSize: normalize(13) },
  selectorWrapper: { borderWidth: 1, borderRadius: 8, padding: normalize(8), marginBottom: normalize(10), borderStyle: 'dashed' },
  lblMini: { fontSize: normalize(10), fontWeight: '500', marginBottom: 4 },
  chip: { paddingHorizontal: normalize(10), paddingVertical: normalize(5), borderRadius: 16, marginRight: normalize(6) },
  chipText: { fontSize: normalize(11), fontWeight: '500' },
  accountChip: { paddingHorizontal: normalize(10), paddingVertical: normalize(6), borderRadius: 8, marginRight: normalize(6), borderWidth: 1 },
  accountChipText: { fontSize: normalize(11), fontWeight: '600' },
  textWhite: { color: '#FFFFFF' },
  btnSave: { flex: 2, height: normalize(40), borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: normalize(13), fontWeight: '700' },
  btnCancel: { flex: 1, marginLeft: normalize(8), height: normalize(40), borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { fontSize: normalize(13), fontWeight: '600' },
  
  // Grid layout de mini-módulos corporativos
  cardRowLayout: { flexDirection: 'row', marginBottom: normalize(12) },
  cardHalf: { flex: 1, borderRadius: 12, padding: normalize(10), borderWidth: 1, elevation: 1 },
  smallCardTitle: { fontSize: normalize(12), fontWeight: '700', marginBottom: normalize(6) },
  smallInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, height: normalize(32), fontSize: normalize(12), marginBottom: normalize(6) },
  smallCardBtn: { height: normalize(28), borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  smallCardBtnText: { color: '#FFFFFF', fontSize: normalize(11), fontWeight: '700' },
  
  // Filtros Avanzados
  filterCard: { borderRadius: 12, padding: normalize(12), borderWidth: 1, marginBottom: normalize(14) },
  filterCardTitle: { fontSize: normalize(13), fontWeight: '700', marginBottom: normalize(8) },
  filterMiniRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  filterMiniBtn: { paddingHorizontal: normalize(8), paddingVertical: normalize(4), borderRadius: 6, marginRight: normalize(4), marginBottom: normalize(4) },
  filterMiniText: { fontSize: normalize(10), fontWeight: '600' },
  
  // Listas de Historial
  historySectionHeader: { marginBottom: normalize(6), paddingHorizontal: 2 },
  listHeaderTitle: { fontSize: normalize(14), fontWeight: '700' },
  listHeaderSubtitle: { fontSize: normalize(10), marginTop: 1 },
  historyListContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: normalize(10) },
  emptyText: { textAlign: 'center', padding: normalize(20), fontSize: normalize(12) },
  txCard: { flexDirection: 'row', padding: normalize(10), borderBottomWidth: 1, justifyContent: 'space-between' },
  txMetaLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' },
  txCategoryTitle: { fontSize: normalize(13), fontWeight: '700', marginRight: normalize(4) },
  txAccountBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  txAccountBadgeText: { fontSize: normalize(9), fontWeight: '700' },
  txDesc: { fontSize: normalize(11), marginBottom: 2 },
  txDate: { fontSize: normalize(10) },
  txAmount: { fontSize: normalize(14), fontWeight: '700', marginBottom: normalize(4) },
  actionRow: { flexDirection: 'row' },
  actionBtn: { paddingHorizontal: normalize(8), paddingVertical: normalize(3), borderRadius: 4 },
  
  // Modal de Ticket Recibo
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: normalize(20) },
  ticketContainer: { width: '85%', borderRadius: 4, padding: normalize(16), alignItems: 'center', elevation: 5 },
  ticketBrand: { fontSize: normalize(14), fontWeight: '900', letterSpacing: 2 },
  ticketSubtitle: { fontSize: normalize(10), marginTop: 2 },
  ticketDivider: { fontSize: normalize(12), marginVertical: normalize(4), letterSpacing: 1 },
  ticketBody: { width: '100%', marginVertical: normalize(4) },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: normalize(4) },
  ticketLabel: { fontSize: normalize(10), fontWeight: '500' },
  ticketValue: { fontSize: normalize(10), fontWeight: '700' },
  ticketCloseBtn: { marginTop: normalize(14), borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', width: '100%', paddingTop: normalize(10), alignItems: 'center' },
  ticketCloseBtnText: { fontSize: normalize(11), fontWeight: '800', color: '#475569', letterSpacing: 1 }
});