import { set } from "@react-native-firebase/database";
import { createSlice } from "@reduxjs/toolkit";
import constants from "../constants";

const initialState = {
  areas: [],
  indicators: [],
  wasteItems: [],
  municipalities: [],
  constants: [],
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setAreas(state, action) {
      state.areas = action.payload;
    },
    setIndicators(state, action) {
      state.indicators = action.payload;
    },
    setWasteItems(state, action) {
      state.wasteItems = action.payload;
    },
    setMunicipalities(state, action) {
      state.municipalities = action.payload;
    },
    setConstants(state, action) {
      state.constants = action.payload;
    },
    clearData(state) {
      state.areas = [];
      state.indicators = [];
      state.wasteItems = [];
      state.municipalities = [];
      state.constants = [];
    },
  },
});

export const { setAreas, setIndicators, setWasteItems, setMunicipalities, setConstants, clearData } = dataSlice.actions;
export default dataSlice.reducer;
