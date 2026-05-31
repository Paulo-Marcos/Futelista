import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import ListScreen from "@/app/(tabs)/list";
import HomeScreen from ".";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import TeamsScreen from "./Teams";
import GameManagerScreen from "./GameManager";
import CurrentGameScreen from "./CurrentGame";

const Tab = createBottomTabNavigator();

export default function TabLayout() {
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
        <Tab.Screen
          name="index"
          component={HomeScreen}
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "football" : "football-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="List"
          component={ListScreen}
          options={{
            tabBarLabel: "List",
            tabBarIcon: () => (
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
        <Tab.Screen
          name="index2"
          component={TeamsScreen}
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "football" : "football-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Geriamento"
          component={GameManagerScreen}
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "football" : "football-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="currentGame"
          component={CurrentGameScreen}
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "football" : "football-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}
