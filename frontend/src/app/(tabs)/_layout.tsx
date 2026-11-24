import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, fonts } from "../../constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function TabsLayout() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.oxblood,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="livros"
        options={{
          title: "Livros",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Protected guard={usuario?.cargo == "admin"}>
        <Tabs.Screen 
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
        />
      </Tabs.Protected>
    </Tabs>
  );
}