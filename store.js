import { configureStore } from '@reduxjs/toolkit';
import complaintsReducer from './src/slices/complaintsSlice';
import dataReducer from './src/slices/dataSlice';
import userReducer from './src/slices/userSlice';
import sectionReducer from './src/slices/sectionsSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    complaints: complaintsReducer,
    data: dataReducer,
    sections: sectionReducer,
  },
});

export default store;
