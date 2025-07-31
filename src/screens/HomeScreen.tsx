import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import Button from '../components/Button';

const HomeScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const handleButtonPress = () => {
    console.log('Button pressed!');
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: isDarkMode ? '#ffffff' : '#000000' },
          ]}
        >
          Welcome Home
        </Text>
        <Text
          style={[
            styles.description,
            { color: isDarkMode ? '#cccccc' : '#666666' },
          ]}
        >
          This is your home screen. Start building your amazing app from here!
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={handleButtonPress}
            variant="primary"
          />
          <Button
            title="Learn More"
            onPress={handleButtonPress}
            variant="secondary"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  secondaryButton: {
    marginTop: 12,
  },
});

export default HomeScreen;
