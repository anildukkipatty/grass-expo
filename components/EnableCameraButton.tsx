import {
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type Props = {
  onPress: () => void;
  label?: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

export function EnableCameraButton({
  onPress,
  label = "Enable Camera",
  style,
  textStyle,
}: Props) {
  return (
    <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.8}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}
