import React, { useContext, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
 Image,
  Switch,
  Pressable,
  Alert,
  StyleSheet,
  TextInput,
} from "react-native";

import { AppContext } from "../../context/AppContext";

export default function PerfilScreen() {
  const {
    nombre,
    correo,
    setNombre,
    setCorreo,
    restablecerAplicacion,
    saldo,
    actualizarSaldo,
  } = useContext(AppContext);

  const [notificaciones, setNotificaciones] = useState(true);

  const [nuevoNombre, setNuevoNombre] = useState(nombre);
  const [nuevoCorreo, setNuevoCorreo] = useState(correo);
  const [nuevoSaldo, setNuevoSaldo] = useState(saldo.toFixed(2));

  const guardarPerfil = () => {
    const saldoNumero = Number(nuevoSaldo.replace(",", "."));

    if (nuevoNombre.trim() === "" || nuevoCorreo.trim() === "") {
      Alert.alert("Error", "Complete nombre y correo.");
      return;
    }

    if (!actualizarSaldo(saldoNumero)) {
      Alert.alert("Saldo no valido", "Ingresa un monto igual o mayor que cero.");
      return;
    }

    setNombre(nuevoNombre);
    setCorreo(nuevoCorreo);

    // Confirma que los datos personales y el saldo fueron actualizados.
    router.push({
      pathname: "/resultado",
      params: {
        title: "Perfil actualizado",
        message: "Tus datos personales y el saldo disponible fueron guardados correctamente.",
        returnTo: "/(tabs)/perfil",
      },
    });
  };

  const confirmarRestablecer = () => {
    Alert.alert(
      "Restablecer aplicación",
      "¿Deseas borrar todos los datos y volver a los valores iniciales?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí",
          style: "destructive",
          onPress: () => {
            restablecerAplicacion();

            setNuevoNombre("Jason");
            setNuevoCorreo("jason@email.com");
            setNuevoSaldo("2500.00");

            // Informa el resultado despues de confirmar el restablecimiento.
            router.push({
              pathname: "/resultado",
              params: {
                title: "Aplicación restablecida",
                message: "Se borraron tus datos y se restauraron los valores iniciales.",
                returnTo: "/(tabs)/perfil",
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        }}
        style={styles.avatar}
      />

      <Text style={styles.title}>Mi Perfil</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nuevoNombre}
        onChangeText={setNuevoNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Saldo disponible en quetzales"
        keyboardType="decimal-pad"
        value={nuevoSaldo}
        onChangeText={setNuevoSaldo}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        value={nuevoCorreo}
        onChangeText={setNuevoCorreo}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>
          Recibir notificaciones
        </Text>

        <Switch
          value={notificaciones}
          onValueChange={setNotificaciones}
        />
      </View>

      <Pressable
        style={styles.button}
        onPress={guardarPerfil}
      >
        <Text style={styles.buttonText}>
          Guardar Cambios
        </Text>
      </Pressable>

      <Pressable
        style={styles.resetButton}
        onPress={confirmarRestablecer}
      >
        <Text style={styles.buttonText}>
          Restablecer Aplicación
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 25,
  },

  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },

  switchContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  switchText: {
    fontSize: 16,
    color: "#333",
  },

  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  resetButton: {
    width: "100%",
    backgroundColor: "#DC2626",
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
