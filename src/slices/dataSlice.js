import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  areas: [],
  indicators: [],
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
    clearData(state) {
      state.areas = [];
      state.indicators = [];
    },
  },
});

export const { setAreas, setIndicators, clearData } = dataSlice.actions;
export default dataSlice.reducer;
