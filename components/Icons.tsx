// import React from 'react';
// import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
// import MaterialIconsIcon from 'react-native-vector-icons/MaterialIcons';
// import AntDesignIcon from 'react-native-vector-icons/AntDesign';
// import FeatherIcon from 'react-native-vector-icons/Feather';
// import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
// import IonIcon from 'react-native-vector-icons/Ionicons';

import {
  AntDesign,
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import React, { ComponentProps } from "react";

interface IconProps2 {
  name: string;
  //   ComponentProps<typeof MaterialIcons>['name']  |
  //   ComponentProps<typeof AntDesign>['name'] |
  //   ComponentProps<typeof Feather>['name'] |
  //   ComponentProps<typeof MaterialCommunityIcons>['name'] |
  //   ComponentProps<typeof Ionicons>['name'] |
  //   ComponentProps<typeof FontAwesome>['name'];
  size: number;
  color: string;
  type: string;
}
// IconProps<ComponentProps<typeof MaterialIcons>['name']> &
export default function Icon({ name, size, color, type }: IconProps2) {
  const iconProps = {
    name,
    size,
    color,
  };
  //   size={28} style={[{ marginBottom: -3 }, style]} {...rest}
  switch (type) {
    case "AntDesign":
      return (
        <AntDesign
          name={name as ComponentProps<typeof AntDesign>["name"]}
          size={size}
          color={color}
        />
      );
    case "FontAwesome":
      return (
        <FontAwesome
          name={name as ComponentProps<typeof FontAwesome>["name"]}
          size={size}
          color={color}
        />
      );
    case "MaterialIcons":
      return (
        <MaterialIcons
          name={name as ComponentProps<typeof MaterialIcons>["name"]}
          size={size}
          color={color}
        />
      );
    case "Feather":
      return (
        <Feather
          name={name as ComponentProps<typeof Feather>["name"]}
          size={size}
          color={color}
        />
      );
    case "MaterialCommunityIcons":
      return (
        <MaterialCommunityIcons
          name={name as ComponentProps<typeof MaterialCommunityIcons>["name"]}
          size={size}
          color={color}
        />
      );
    case "IonIcons":
      return (
        <Ionicons
          name={name as ComponentProps<typeof Ionicons>["name"]}
          size={size}
          color={color}
        />
      );
    default:
      return (
        <AntDesign
          name={name as ComponentProps<typeof AntDesign>["name"]}
          size={size}
          color={color}
        />
      );
  }
}

// export default Icon;
