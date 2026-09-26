import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const fetchTip = createAsyncThunk("tips/fetchTip", async (userInput: string, thunkAPI) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/openai-chat/`, { user_input: userInput });
    return response.data.response as string;
  } catch (error) {
    if (axios.isAxiosError(error)) return thunkAPI.rejectWithValue(error.response?.data?.error || error.message);
    return thunkAPI.rejectWithValue("Unable to contact the server");
  }
});

interface TipsState { currentTip: string; loading: boolean; error: string | null; }
const initialState: TipsState = { currentTip: "", loading: false, error: null };
const tipsSlice = createSlice({
  name: "tips", initialState, reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchTip.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(fetchTip.fulfilled, (state, action) => { state.loading = false; state.currentTip = action.payload; })
    .addCase(fetchTip.rejected, (state, action) => { state.loading = false; state.error = (action.payload as string) || action.error.message || "Something went wrong"; })
});
export default tipsSlice.reducer;
