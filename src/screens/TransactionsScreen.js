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
