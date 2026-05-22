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

