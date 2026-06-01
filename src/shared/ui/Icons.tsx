import {
  AntDesign,
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import React, { ComponentProps } from "react";

interface IconProps {
  name: string;
  size: number;
  color: string;
  type: string;
}

export default function Icon({ name, size, color, type }: IconProps) {
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
