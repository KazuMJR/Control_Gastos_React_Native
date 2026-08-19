import React, { useContext, useState } from "react";
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
  } = useContext(AppContext);

  const [notificaciones, setNotificaciones] = useState(true);

  const [nuevoNombre, setNuevoNombre] = useState(nombre);
  const [nuevoCorreo, setNuevoCorreo] = useState(correo);

  const guardarPerfil = () => {
    if (nuevoNombre.trim() === "" || nuevoCorreo.trim() === "") {
      Alert.alert("Error", "Complete todos los campos.");
      return;
    }

    setNombre(nuevoNombre);
    setCorreo(nuevoCorreo);

    Alert.alert(
      "Perfil actualizado",
      "Los datos fueron guardados correctamente."
    );
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

            Alert.alert(
              "Éxito",
              "La aplicación fue restablecida correctamente."
            );
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
