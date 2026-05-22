import React, { useContext, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  PixelRatio, 
  Platform,
  Alert 
} from 'react-native';
import { FinanceContext } from '../context/FinanceContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext'; // 🚨 IMPORTACIÓN NUEVA
import { PieChart } from 'react-native-chart-kit';
import Ionicons from '@expo/vector-icons/Ionicons';