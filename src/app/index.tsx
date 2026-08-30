import { Text, View, StyleSheet, Image } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>TESTE</Text>
      <Image 
      source={{uri:'https://plus.unsplash.com/premium_photo-1667030474693-6d0632f97029?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}}
      style={{height: 300, width: 300}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
