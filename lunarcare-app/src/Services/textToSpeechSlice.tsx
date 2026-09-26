import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const fetchAudio = createAsyncThunk("textToSpeech/fetchAudio", async (text: string, thunkAPI) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/text-to-speech/`, { text }, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) return thunkAPI.rejectWithValue(error.response?.data?.error || error.message);
    return thunkAPI.rejectWithValue("Unable to generate audio");
  }
});
const textToSpeechSlice = createSlice({
  name: "textToSpeech", initialState: { audioUrl: "", error: null as string | null, loading: false }, reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchAudio.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(fetchAudio.fulfilled, (state, action) => { state.loading = false; state.audioUrl = action.payload as string; })
    .addCase(fetchAudio.rejected, (state, action) => { state.loading = false; state.error = (action.payload as string) || action.error.message || "Unable to generate audio"; })
});
export default textToSpeechSlice.reducer;
