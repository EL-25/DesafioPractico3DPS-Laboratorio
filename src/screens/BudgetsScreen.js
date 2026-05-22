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