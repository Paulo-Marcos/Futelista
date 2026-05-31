// // import { Stack, Tabs } from 'expo-router';
// import React from 'react';

// import { TabBarIcon } from '@/components/navigation/TabBarIcon';
// import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import HomeTabs from '@/components/HomeTabs';
// import { NavigationContainer } from '@react-navigation/native';
// import HomeScreen from '.';
// // import HomeScreen from '@/app-example/(tabs)';

// const Stack = createNativeStackNavigator();

// export default function TabLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     // <Stack
//     //   screenOptions={{
//     //     tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
//     //     headerShown: false,
//     //   }}>
//     // <NavigationContainer>
//     <Stack.Navigator
//               screenOptions={{
//                 headerStyle: {
//                   // marginTop:
//                   //   Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
//                 },
//               }}
//             >
//         <Stack.Screen
//                 name="HomeTabs"
//                 component={HomeTabs}
//                 options={{ headerShown: false }}
//               />
//         <Stack.Screen
//         name="index"
//         component={HomeScreen}
//         options={{
//           title: '',
//           // tabBarIcon: ({ color, focused }) => (
//           //   <TabBarIcon name={focused ? 'football' : 'football-outline'} color={color} />
//           // ),
//         }}
//       />
//       {/* <Stack.Screen
//         name="list"
//         options={{
//           title: 'Lista',
//           tabBarIcon: ({ color, focused }) => (
//             <TabBarIcon name={focused ? 'list-circle' : 'list-circle-outline'} color={color} />
//           ),
//         }} */}

//       {/* /> */}

//     </Stack.Navigator>
//     // </NavigationContainer>
//   );
// }

import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import Home from "../screens/Home";
// import Add from "../screens/Add";
// import Settings from "../screens/Settings";
import { Feather, Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import ListScreen from "@/app/(tabs)/list";
import HomeScreen from ".";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import TeamsScreen from "./Teams";
import GameManagerScreen from "./GameManager";
import CurrentGameScreen from "./CurrentGame";
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

// const Tab = createBottomTabNavigator();
// export default function  () {
// //   const { primarycolor } = useContext(DContexts);
// //   const { bgcolor } = useContext(DContexts);
// //   const { cardcolor } = useContext(DContexts);
//   return (
//     <View style={{ backgroundColor: 'red', flex: 1 }}>
//       <Tab.Navigator
//         screenOptions={{
//           headerShown: false,
//           tabBarShowLabel: false,
//           tabBarActiveTintColor: 'blue',
//           tabBarStyle: {
//             position: "absolute",
//             bottom: 25,
//             marginRight: 10,
//             marginLeft: 10,
//             elevation: 10,
//             borderRadius: 15,
//             height: 50,
//             backgroundColor: 'yellow',
//             borderTopWidth: 0,
//           },

//         }}
//       >
//         {/* <Tab.Screen
//           name="Home"
//           component={Home}
//           options={{
//             tabBarLabel: "Home",
//             tabBarIcon: ({ color, size }) => (
//               <Feather name="home" color={color} size={20} />
//             ),
//           }}
//         /> */}
//         <Tab.Screen
//         name="index"
//         component={HomeScreen}
//         options={{
//           title: '',
//           tabBarIcon: ({ color, focused }) => (
//             <TabBarIcon name={focused ? 'football' : 'football-outline'} color={color} />
//           ),
//         }}
//       />
//         <Tab.Screen
//           name="List"
//           component={ListScreen}
//           options={{
//             tabBarLabel: "List",
//             tabBarIcon: ({ size }) => (
//               <View
//                 style={{
//                   top: -30,
//                   width: 50,
//                   height: 50,
//                   borderRadius: 35,
//                   backgroundColor: 'purple',
//                   justifyContent: "center",
//                   alignItems: "center",
//                   elevation: 10,
//                 }}
//               >
//                 <Ionicons name="pencil" color="#ffffff" size={20} />
//               </View>
//             ),
//           }}
//         />
//         <Tab.Screen
//         name="index2"
//         component={TeamsScreen}
//         options={{
//           title: '',
//           tabBarIcon: ({ color, focused }) => (
//             <TabBarIcon name={focused ? 'football' : 'football-outline'} color={color} />
//           ),
//         }}
//       />
//                 {/* <Tab.Screen
//           name="mic"
//           component={Add}
//           options={{
//             tabBarLabel: "Add",
//             tabBarIcon: ({ size }) => (
//               <View
//                 style={{
//                   top: -30,
//                   width: 50,
//                   height: 50,
//                   borderRadius: 35,
//                   backgroundColor: primarycolor,
//                   justifyContent: "center",
//                   alignItems: "center",
//                   elevation: 10,
//                 }}
//               >
//                 <Ionicons name="mic" color="#ffffff" size={20} />
//               </View>
//             ),
//           }}
//         /> */}

//         {/* <Tab.Screen
//           name="settings"
//           component={Settings}
//           options={{
//             tabBarLabel: "Settings",
//             tabBarIcon: ({ color, size }) => (
//               <Feather name="settings" color={color} size={20} />
//             ),
//           }}
//         /> */}
//       </Tab.Navigator>
//     </View>
//   );
// }
