import { View, Text } from "react-native";
import { colors } from "../constants/theme";

type Props = { rating: number; size?: number };

export function StarRating({ rating, size = 13 }: Props) {
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: size, color: i <= full ? colors.gold : "rgba(35,29,22,0.22)" }}>
          ★
        </Text>
      ))}
    </View>
  );
}
