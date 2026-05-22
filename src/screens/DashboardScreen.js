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
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 360; 

function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === 'android') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export default function DashboardScreen({ navigation }) {
  const { logout, user } = useContext(AuthContext);
  const { getMonthSummary, getAccountBalances, transactions = [] } = useContext(FinanceContext) || {};
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext); // 🚨 CONSUMO DEL TEMA ACTIVADO

  const { income = 0, expense = 0, balance = 0 } = getMonthSummary ? getMonthSummary(transactions) : {};
  const accountBalances = getAccountBalances ? getAccountBalances() : [];

  const categoryTotals = {};
  (transactions || []).filter(t => t && t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
  });

  // Paleta moderna adaptada al brillo del tema activo
  const colorPalette = ['#6366F1', '#10B981', '#F59E0B', '#06B6D4', '#EC4899'];
  const chartData = Object.keys(categoryTotals).map((cat, idx) => ({
    name: cat,
    population: categoryTotals[cat],
    color: colorPalette[idx % colorPalette.length],
    legendFontColor: theme.textSecondary, // Respetando modo oscuro en gráfico
    legendFontSize: normalize(11) 
  }));

  const getShortName = (fullName) => {
    if (!fullName) return 'Estudiante UDB';
    const words = fullName.trim().split(/\s+/);
    if (words.length >= 3) return `${words[0]} ${words[2]}`;
    if (words.length === 2) return `${words[0]} ${words[1]}`;
    return words[0];
  };

  const rawName = user?.displayName ? user.displayName : (user?.email ? user.email.split('@')[0] : 'Estudiante UDB');
  const formattedUserGreeting = getShortName(rawName);

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' },
      ],
      { cancelable: true }
    );
  };
  
  // Sincronización del Header nativo con los colores del tema persistido
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerProfileCard}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.accent }]}>
            <Text style={styles.avatarText}>{getInitials(formattedUserGreeting)}</Text>
          </View>
          <View style={styles.profileInfoContainer}>
            <Text style={[styles.welcomeLabel, { color: theme.textSecondary }]}>Resumen de Cuenta</Text>
            <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>{formattedUserGreeting}</Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {/* 🌓 SWITCH INTERACTIVO DE TEMA (MODO OSCURO / CLARO) */}
          <TouchableOpacity 
            style={[styles.headerIconTouch, { marginRight: normalize(4) }]} 
            onPress={toggleTheme}
            activeOpacity={0.6}
          >
            <Ionicons 
              name={isDarkMode ? "sun-outline" : "moon-outline"} 
              size={normalize(20)} 
              color={isDarkMode ? theme.warning : theme.textPrimary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerLogoutButton} 
            onPress={handleLogoutPress} 
            activeOpacity={0.6}
          >
            <Ionicons name="log-out-outline" size={normalize(20)} color={theme.danger} />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        height: Platform.OS === 'ios' ? normalize(100) : normalize(90), 
        backgroundColor: theme.card, // Fondo dinámico del Header
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      },
      headerShadowVisible: false,
    });
  }, [navigation, formattedUserGreeting, theme, isDarkMode]);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      showsVerticalScrollIndicator={false}
    ></ScrollView>
    
      {/* 💳 CARD PREMIUM: BALANCE GENERAL NETO */}
      <View style={[styles.premiumCard, { backgroundColor: theme.premiumCard }]}>
        <Text style={[styles.premiumLabel, { color: theme.premiumText }]}>BALANCE NETO DISPONIBLE</Text>
        <Text style={[styles.premiumBalance, { color: balance >= 0 ? theme.success : theme.danger }]}>
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        
        <View style={styles.premiumRow}>
          <View style={styles.flowContainer}>
            <View style={[styles.indicatorDot, { backgroundColor: theme.success }]} />
            <View>
              <Text style={[styles.flowLabel, { color: theme.premiumText }]}>Ingresos</Text>
              <Text style={styles.flowValue}>${income.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.flowContainer}>
            <View style={[styles.indicatorDot, { backgroundColor: theme.danger }]} />
            <View>
              <Text style={[styles.flowLabel, { color: theme.premiumText }]}>Gastos</Text>
              <Text style={styles.flowValue}>${expense.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>
       {/* 🏦 SECCIÓN: SALDOS DE CUENTAS */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Tus Cuentas y Saldos</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Distribución líquida actual</Text>
      </View>
      
      <View style={[styles.listCardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {accountBalances.map((acc, index) => (
          <View 
            key={acc.id} 
            style={[
              styles.accountRow, 
              { borderColor: theme.border },
              index === accountBalances.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
            <View style={styles.accountInfoLeft}>
              <View style={[styles.accountIconDummy, { backgroundColor: theme.background }]}>
                <Text style={styles.accountIconText}>💳</Text>
              </View>
              <Text style={[styles.accName, { color: theme.textPrimary }]}>{acc.name}</Text>
            </View>
            <Text style={[styles.accValue, { color: theme.textPrimary }]}>${acc.balance.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* 📊 SECCIÓN: GRÁFICO DE DISTRIBUCIÓN */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Distribución de Gastos</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Análisis proporcional por categorías</Text>
      </View>

      {chartData.length > 0 ? (
        <View style={[styles.chartBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <PieChart
            data={chartData}
            width={SCREEN_WIDTH - normalize(32)}
            height={normalize(180)}
            chartConfig={{
              color: (opacity = 1) => isDarkMode ? `rgba(248, 250, 252, ${opacity})` : `rgba(15, 23, 42, ${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={normalize(8)}
            absolute
          />
        </View>
      ) : (
        <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No hay gastos registrados en este período.</Text>
        </View>
      )}
      
      <View style={{ height: normalize(24) }} />
    </ScrollView>
  );
}