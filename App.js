import { NavigationContainer } from '@react-navigation/native';
import Root from './src/navigation/Root';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from './store';
import {
  navigationRef,
  consumePendingNavigation,
} from './src/services/notifications';
import codePush from '@revopush/react-native-code-push';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            const intent = consumePendingNavigation();
            if (intent) {
              navigationRef.current?.navigate(intent.route, intent.params);
            }
          }}
        >
          <Root />
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default codePush(App);
