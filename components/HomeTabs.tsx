import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import Home from "../screens/Home";
// import Add from "../screens/Add";
// import Settings from "../screens/Settings";
import { Feather, Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import ListScreen from "@/app/(tabs)/list";
// import { DContexts } from "../contexts/DContexts";

const Tab = createBottomTabNavigator();
export default function () {
  //   const { primarycolor } = useContext(DContexts);
  //   const { bgcolor } = useContext(DContexts);
  //   const { cardcolor } = useContext(DContexts);
  return (
    <View style={{ backgroundColor: "red", flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "blue",
          tabBarStyle: {
            position: "absolute",
            bottom: 25,
            marginRight: 10,
            marginLeft: 10,
            elevation: 10,
            borderRadius: 15,
            height: 50,
            backgroundColor: "yellow",
            borderTopWidth: 0,
          },
        }}
      >
        {/* <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" color={color} size={20} />
            ),
          }}
        /> */}
        <Tab.Screen
          name="List"
          component={ListScreen}
          options={{
            tabBarLabel: "List",
            tabBarIcon: ({ size }) => (
              <View
                style={{
                  top: -30,
                  width: 50,
                  height: 50,
                  borderRadius: 35,
                  backgroundColor: "purple",
                  justifyContent: "center",
                  alignItems: "center",
                  elevation: 10,
                }}
              >
                <Ionicons name="pencil" color="#ffffff" size={20} />
              </View>
            ),
          }}
        />
        {/* <Tab.Screen
          name="mic"
          component={Add}
          options={{
            tabBarLabel: "Add",
            tabBarIcon: ({ size }) => (
              <View
                style={{
                  top: -30,
                  width: 50,
                  height: 50,
                  borderRadius: 35,
                  backgroundColor: primarycolor,
                  justifyContent: "center",
                  alignItems: "center",
                  elevation: 10,
                }}
              >
                <Ionicons name="mic" color="#ffffff" size={20} />
              </View>
            ),
          }}
        /> */}

        {/* <Tab.Screen
          name="settings"
          component={Settings}
          options={{
            tabBarLabel: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Feather name="settings" color={color} size={20} />
            ),
          }}
        /> */}
      </Tab.Navigator>
    </View>
  );
}
