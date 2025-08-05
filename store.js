import { configureStore } from '@reduxjs/toolkit';
import complaintsReducer from './src/slices/complaintsSlice';
import dataReducer from './src/slices/dataSlice';
import userReducer from './src/slices/userSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    complaints: complaintsReducer,
    data: dataReducer,
  },
});

export default store;
