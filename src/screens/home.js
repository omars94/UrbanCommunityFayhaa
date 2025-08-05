import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import React, { useEffect } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setAreas, setIndicators } from '../../src/slices/dataSlice';
import { clearUser } from '../slices/userSlice';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

// Fetch all complaints
export async function getData(dispatch) {
  console.log('get data');
  console.log('get data2');
  database()
    .ref('/areas')
    .once('value', snapshot => {
      console.log('User data: ', snapshot.val());
      dispatch(setAreas(snapshot.val()));
    });
  database()
    .ref('/indicators')
    .once('value', snapshot => {
      console.log('User data: ', snapshot.val());
      dispatch(setIndicators(snapshot.val()));
    });
}

export default function HomeScreen() {
  const dispatch = useDispatch();
  const signOut = async () => {
    try {
      await auth().signOut();
      dispatch(clearUser());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    getData(dispatch);
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <TouchableOpacity
        style={[styles.fab, { right: 90 }]}
        onPress={() => {
          Linking.openURL('tel:175');
        }}
      >
        <MaterialDesignIcons name="fire-truck" size={32} color="#e67e22" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          signOut();
        }}
      >
        <MaterialDesignIcons name="logout" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2e64e5',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: { color: '#fff', fontSize: 32 },
});
