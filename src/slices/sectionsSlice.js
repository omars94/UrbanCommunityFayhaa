import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sections: null,
};

const sectionSlice = createSlice({
  name: 'sections',
  initialState,
  reducers: {
    setSections(state, action) {
      state.sections = action.payload;
    },
    cleanSections(state) {
      state.sections = null;
    },
  },
});

export const { setSections, cleanSections } = sectionSlice.actions;
export default sectionSlice.reducer;
