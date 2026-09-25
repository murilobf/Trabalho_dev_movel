import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Avatar } from "./Avatar";
import { typography } from "../constants/theme";

type Props = {
  userInitials?: string;
  left?: ReactNode;
};

// Barra de topo usada em toda tela. `left` é o slot pra um botão de voltar
// (ou qualquer outra coisa); `userInitials` mostra o avatar só se informado.
export function AppBar({ userInitials, left }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.leftGroup}>
        {left}
        <Text style={typography.logo}>
          book<Text style={typography.logoAccent}>xd</Text>
        </Text>
      </View>
      {userInitials ? <Avatar initials={userInitials} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  leftGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
});
