import { NavigationContainer } from '@react-navigation/native';
import Root from './src/navigation/Root';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from './store';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <NavigationContainer>
          <Root />
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
