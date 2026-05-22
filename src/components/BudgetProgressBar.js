import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BudgetProgressBar({ category, spent, limit }) {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  
  // REQUISITO: Indicador de alerta cuando el gasto supera el 80% o el 100%
  let barColor = '#4CAF50'; // Verde por defecto
  if (percentage >= 100) {
    barColor = '#F44336'; // Rojo si llegó o superó el 100%
  } else if (percentage >= 80) {
    barColor = '#FF9800'; // Naranja/Amarillo si está entre el 80% y 99.9%
  }

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={styles.catName}>{category}</Text>
        <Text style={styles.val}>${spent.toFixed(2)} / ${limit.toFixed(2)}</Text>
      </View>
      
      {/* Contenedor de la barra de progreso */}
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }]} />
      </View>
      
      {percentage >= 80 && (
        <Text style={[styles.warn, { color: barColor }]}>
          {percentage >= 100 ? '🔴 Alerta: Presupuesto Excedido' : '⚠️ Alerta: Has consumido más del 80%'}
        </Text>
      )}
    </View>
  );
}
