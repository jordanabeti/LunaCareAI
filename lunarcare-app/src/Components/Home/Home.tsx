import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTip } from "../../Services/tipsSlice";
import { AppDispatch } from "../../store";
import "./Home.css";
import MarkdownRenderer from "../Common/MarkdownRender";
import { fetchAudio } from "../../Services/textToSpeechSlice";
import { ReactComponent as SendToAIIcon } from "../../Assets/Icons/send-2.svg";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface RootState {
  tips: { currentTip: string; loading: boolean; error: string | null };
  textToSpeech: { audioUrl: string; error: string | null };
}

const Home: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { currentTip, loading, error } = useSelector((state: RootState) => state.tips);
  const { audioUrl } = useSelector((state: RootState) => state.textToSpeech);

  const submit = () => {
    const question = inputValue.trim();
    if (!question || loading) return;
    dispatch(fetchTip(question));
    setInputValue("");
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((value) => `${value} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      setVoiceError("Microphone access was unavailable. Please allow microphone access and try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setVoiceError("");
    setListening(true);
    recognition.start();
  };

  useEffect(() => {
    if (currentTip) dispatch(fetchAudio(currentTip));
  }, [currentTip, dispatch]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <section className="avatar-container" aria-label="Luna voice-enabled chatbot">
      <div className="avatar-header">
        <div className="luna-orb" aria-hidden="true">☾</div>
        <h1>Hi, I’m Luna</h1>
        <p>Your private postpartum wellness companion</p>
      </div>
      <div className="avatar-input-group">
        <input
          type="text"
          placeholder={listening ? "Listening..." : "Ask Luna anything..."}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          aria-label="Ask Luna a question"
          disabled={loading}
        />
        <button className={`voice-button ${listening ? "listening" : ""}`} onClick={toggleListening} aria-label={listening ? "Stop listening" : "Speak your question"} type="button">
          {listening ? "■" : "🎙"}
        </button>
        <button onClick={submit} disabled={loading || !inputValue.trim()} aria-label="Send question" type="button">
          <SendToAIIcon className="white-stroke" />
        </button>
      </div>
      {voiceError && <p className="voice-error" role="alert">{voiceError}</p>}
      <div className="tip-box" aria-live="polite">
        {loading && <p className="loading-text">Luna is thinking...</p>}
        {error && <p className="error-text">Could not reach Luna: {error}</p>}
        {currentTip && !loading && <><h3>Luna says:</h3><MarkdownRenderer tip={currentTip} /></>}
        {!loading && !error && !currentTip && <p className="empty-text">Tap the microphone or type a question to begin.</p>}
      </div>
      {audioUrl && audioUrl !== "error" && <audio controls src={audioUrl} autoPlay aria-label="Luna response audio" />}
      <p className="safety-note">Luna provides general wellness information and is not a substitute for professional medical care.</p>
    </section>
  );
};

export default Home;
