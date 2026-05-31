import {
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ButtonIcon } from "@/components/ButtonIcon";
import { Link, useNavigation } from "expo-router";
import React, { useState } from "react";
import Icon from "@/components/Icons";
import { useSoccer } from "@/hooks/useSoccer";
import { Player } from "@/src/domain/Player";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { ParamListBase } from "@react-navigation/native";

export default function ListScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [text, onChangeText] = React.useState("");
  // Mensagem de erro inline. Evita Alert.alert(), que falha silenciosamente
  // em React Native Web em algumas versoes.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  let navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const manager = useSoccer();

  const handleAddOnList = () => {
    const nome = text.trim();
    if (!nome) return;
    manager.manager.addPlayer(nome);
    onChangeText("");
    setModalVisible(false);
    setErrorMsg(null);
  };

  const onPress = () => {
    setErrorMsg(null);
    try {
      manager.manager.createTeams();
      navigation.navigate("index2");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[list.tsx] Falha ao montar times:", error);
      setErrorMsg(msg);
    }
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      {modalVisible && (
        <ThemedView>
          <ThemedView
            style={[
              categoryStyles.transactionContainer,
              { backgroundColor: "red" },
            ]}
            // key={String(1)}
          >
            <ThemedView style={categoryStyles.iconNameContainer}>
              <ThemedView>
                <TextInput
                  style={inputStyles.input}
                  onChangeText={onChangeText}
                  value={text}
                  placeholder="Nome do jogador"
                  placeholderTextColor="#aaa"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddOnList}
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={categoryStyles.buttonContainer}>
              <TouchableOpacity
                style={categoryStyles.actionButton}
                onPress={() => handleAddOnList()}
              >
                <Icon
                  name={"add"}
                  size={20}
                  // color={colors.accentGreen}
                  color={"green"}
                  type={"MaterialIcons"}
                />
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}

      <TouchableOpacity onPress={onPress}>
        <ThemedView style={styles.button}>
          <ThemedText>Montar TImes</ThemedText>
        </ThemedView>
      </TouchableOpacity>

      {errorMsg && (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        </ThemedView>
      )}

      {manager.manager.players.map((item: Player, index: number) => (
        <ThemedView
          style={[
            categoryStyles.transactionContainer,
            {
              // backgroundColor: colors.containerColor,
              backgroundColor: "red",
            },
          ]}
          key={String(index)}
        >
          <ThemedView style={categoryStyles.iconNameContainer}>
            <ThemedView
              style={[
                categoryStyles.iconContainer,
                // {backgroundColor: colors.iconContainer},
                { backgroundColor: "green" },
              ]}
            >
              <Icon
                // name={'category.icon'}
                name={"book"}
                size={20}
                // color={category.color}
                color={"blue"}
                type={"MaterialCommunityIcons"}
              />
            </ThemedView>
            <ThemedView>
              {/* <PrimaryText>{category.name}</PrimaryText> */}
              <ThemedText>{item.name}</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={categoryStyles.buttonContainer}>
            <TouchableOpacity
              style={categoryStyles.actionButton}
              // onPress={() =>
              // handleEdit(
              //     String(category._id),
              //     category.name,
              //     category.icon,
              //     category.color,
              // )
              // }
            >
              <Icon
                name={"edit"}
                size={20}
                // color={colors.accentGreen}
                color={"green"}
                type={"MaterialIcons"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={categoryStyles.actionButton}
              // onPress={() => handleDelete(category._id)}
            >
              <Icon
                name={"delete-empty"}
                size={20}
                // color={colors.accentOrange}
                color={"orange"}
                type={"MaterialCommunityIcons"}
              />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      ))}

      <ThemedView style={homeStyles.addButtonContainer}>
        <TouchableOpacity
          style={[
            homeStyles.addButton,
            // { backgroundColor: colors.secondaryBackground },
            { backgroundColor: "green" },
          ]}
          onPress={() => setModalVisible(!modalVisible)}
        >
          <Icon
            name={"shape-plus"}
            size={30}
            // color={colors.primaryText}
            color={"red"}
            type={"MaterialCommunityIcons"}
          />
        </TouchableOpacity>
      </ThemedView>
      {/* <ThemedView style={modalStyles.centeredView}> */}
      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <ThemedView style={modalStyles.centeredView}>
          <ThemedView style={modalStyles.modalView}>
            <TextInput
              style={inputStyles.input}
              onChangeText={onChangeText}
              value={text}
            />
            <Pressable
              style={[modalStyles.button, modalStyles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <ThemedText style={modalStyles.textStyle}>Hide Modal</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal> */}
      {/* </ThemedView> */}
    </ParallaxScrollView>
  );
}

const homeStyles = StyleSheet.create({
  listExpenseContainer: {
    marginTop: "5%",
    marginBottom: "20%",
  },
  cardContainer: {
    marginTop: 10,
    flexDirection: "row",
  },
  transactionListContainer: {
    marginTop: 20,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 15,
    right: 15,
    zIndex: 1,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  button: {
    flexDirection: "row",

    alignItems: "center",
    backgroundColor: "red",
    padding: 10,
  },
  errorBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c92a2a",
    backgroundColor: "#fff5f5",
  },
  errorText: {
    color: "#c92a2a",
    fontWeight: "600",
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});

const categoryStyles = StyleSheet.create({
  transactionContainer: {
    height: 60,
    width: "100%",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 10,
    paddingRight: 5,
    alignItems: "center",
    marginBottom: 5,
  },
  iconContainer: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    marginRight: 10,
  },
  iconNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  descriptionContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flexDirection: "row",
    height: "100%",
  },
  actionButton: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});

const inputStyles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    borderColor: "white",
    padding: 10,
    color: "white",
  },
});
