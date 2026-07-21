import React, { useState, useContext } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";

import { AppContext } from "../../context/AppContext";

export default function NuevoGastoScreen() {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");

  const { agregarGasto, saldo } = useContext(AppContext);

  const guardarGasto = () => {
    if (descripcion.trim() === "" || monto.trim() === "") {
      Alert.alert(
        "Campos incompletos",
        "Ingrese una descripción y un monto."
      );
      return;
    }

    const montoNumero = Number(monto);

    if (isNaN(montoNumero) || montoNumero <= 0) {
      Alert.alert("Error", "Ingrese un monto válido.");
      return;
    }

    if (montoNumero > saldo) {
      Alert.alert(
        "Saldo insuficiente",
        "No tienes suficiente saldo para registrar este gasto."
      );
      return;
    }

    agregarGasto(descripcion, montoNumero);

    // Limpiar los campos
    setDescripcion("");
    setMonto("");

    // Mostrar mensaje y regresar al inicio
    Alert.alert(
      "Éxito",
      "El gasto fue registrado correctamente.",
      [
        {
          text: "Aceptar",
          onPress: () => router.replace("/(tabs)"),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Gasto</Text>

      <View style={styles.cardSaldo}>
        <Text style={styles.saldoTitulo}>Saldo Disponible</Text>
        <Text style={styles.saldo}>Q {saldo.toFixed(2)}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Descripción del gasto"
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <TextInput
        style={styles.input}
        placeholder="Monto"
        keyboardType="numeric"
        value={monto}
        onChangeText={setMonto}
      />

      <Pressable style={styles.button} onPress={guardarGasto}>
        <Text style={styles.buttonText}>Guardar Gasto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1E3A8A",
    marginBottom: 25,
  },

  cardSaldo: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 25,
    elevation: 3,
    alignItems: "center",
  },

  saldoTitulo: {
    fontSize: 16,
    color: "#666",
  },

  saldo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#16A34A",
    marginTop: 5,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#16A34A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});