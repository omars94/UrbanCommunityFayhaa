import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setAreas, setIndicators } from '../../src/slices/dataSlice';
import { clearUser, setUser } from '../slices/userSlice';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import CustomAlert from '../components/customAlert';
import { getUserByFbUID, handlePromotion } from '../api/userApi';
import { ROLES } from '../constants';

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
  const {user} = useSelector(state => state.user);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
    loading: false
  });

  // Custom Alert Functions
  const showCustomAlert = (title, message, buttons = [], loading = false) => {
    setAlertData({ title, message, buttons, loading });
    setAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setAlertVisible(false);
  };

  useEffect(() => {
    const checkInvitation = async () => {
      console.log(user, "IR: ", user?.user?.invite_role);
      
      const roleMessages = {
        [ROLES.MANAGER]: {
          title: 'لقد تمت دعوتك لتصبح مديرا في النظام',
          message: 'هل تقبل الدعوة لتصبح مديراً في النظام؟',
          success: 'تمت الترقية بنجاح'
        },
        [ROLES.WORKER]: {
          title: 'لقد تمت دعوتك لتصبح موظفاً في النظام',
          message: 'هل تقبل الدعوة لتصبح موظفاً في النظام؟',
          success: 'تمت الترقية بنجاح'
        }
      };
  
      const inviteRole = user?.user?.invite_role;
      if (![ROLES.MANAGER, ROLES.WORKER].includes(inviteRole)) return;
  
      const { title, message, success } = roleMessages[inviteRole];
  
      const handleResponse = async (accept) => {
        try {
          if (accept) setLoading(true);
          
          await handlePromotion(
            user.user.id, 
            accept, 
            accept ? inviteRole : user.user.role
          );
          
          if (accept) {
            const updatedUser = await getUserByFbUID(auth().currentUser.uid);
            dispatch(setUser({ user: updatedUser }));
            setLoading(false);
          }
  
          showCustomAlert(
            'نجاح',
            accept ? success : 'تم رفض الترقية بنجاح',
            [{ text: 'حسناً', onPress: hideCustomAlert }]
          );
        } catch (error) {
          setLoading(false);
          showCustomAlert('خطأ', error.message, [
            { text: 'حسناً', onPress: hideCustomAlert }
          ]);
          console.log(error);
        }
      };
  
      showCustomAlert(title, message, [
        {
          text: 'قبول',
          onPress: () => handleResponse(true)
        },
        {
          text: 'رفض',
          style: 'cancel',
          onPress: () => handleResponse(false)
        }
      ]);
    };
  
    checkInvitation();
  }, [user?.user?.invite_role]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d32f2f" />
        <Text style={styles.loadingText}>جاري تحميل ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        buttons={alertData.buttons}
        onClose={hideCustomAlert}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
});
