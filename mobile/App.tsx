import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useStore } from './src/store';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { InterviewScreen } from './src/screens/InterviewScreen';
import { DoneScreen } from './src/screens/DoneScreen';

export default function App() {
  const { currentScreen } = useStore();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'welcome' && <WelcomeScreen />}
      {currentScreen === 'interview' && <InterviewScreen />}
      {currentScreen === 'done' && <DoneScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
