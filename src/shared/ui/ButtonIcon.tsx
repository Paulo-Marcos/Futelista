import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import { type ComponentProps } from "react";

export function ButtonIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof MaterialIcons>["name"]>) {
  return (
    <MaterialIcons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />
  );
}
