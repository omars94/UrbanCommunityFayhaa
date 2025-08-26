import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  areas: [],
  indicators: [],
  wasteItems: [],
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
    clearData(state) {
      state.areas = [];
      state.indicators = [];
      state.wasteItems = [];
    },
  },
});

export const { setAreas, setIndicators, setWasteItems, clearData } = dataSlice.actions;
export default dataSlice.reducer;
