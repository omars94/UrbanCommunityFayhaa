import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  complaints: [],
};

const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    setComplaints(state, action) {
      state.complaints = action.payload;
    },
    addComplaint(state, action) {
      state.complaints.unshift(action.payload);
    },
    clearComplaints(state) {
      state.complaints = [];
    },
  },
});

export const { setComplaints, addComplaint, clearComplaints } =
  complaintsSlice.actions;
export default complaintsSlice.reducer;
