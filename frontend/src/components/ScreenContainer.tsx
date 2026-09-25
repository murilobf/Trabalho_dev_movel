import { ReactNode } from "react";
import { ScrollView, ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { layout } from "../constants/theme";

type Props = {
  children: ReactNode;
  scrollProps?: ScrollViewProps;
};

// Toda tela nova deve começar envolvendo o conteúdo nisso, em vez de
// reescrever SafeAreaView + ScrollView + estilos em cada arquivo.
export function ScreenContainer({ children, scrollProps }: Props) {
  return (
    <SafeAreaView style={layout.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={layout.content}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
