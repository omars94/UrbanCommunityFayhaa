import { NavigationContainer } from '@react-navigation/native';
import Root from './src/navigation/Root';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from './store';
import { navigationRef } from './src/services/notifications';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <NavigationContainer ref={navigationRef}>
          <Root />
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
