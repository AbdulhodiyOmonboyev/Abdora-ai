import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Loader2, Radio, User, Bot, Volume2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const STATUS = { IDLE: 'idle', CONNECTING: 'connecting', CONNECTED: 'connected', ERROR: 'error' };

// Gemini Live streams raw PCM: mic 16kHz in, voice 24kHz out
const MIC_SAMPLE_RATE = 16000;
const OUT_SAMPLE_RATE = 24000;

function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function base64ToInt16(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function SpeakingPractice({ lessonId, topic }) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Use ref for status so closures (ws.onclose, onerror) always read current value
  const statusRef = useRef(STATUS.IDLE);
  const setStatusSafe = (s) => { statusRef.current = s; setStatus(s); };

  const wsRef = useRef(null);
  const micCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const processorRef = useRef(null);
  const playCtxRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const pendingTranscriptRef = useRef({ user: '', assistant: '' });
  const transcriptEndRef = useRef(null);

  const cleanup = useCallback(() => {
    try { processorRef.current?.disconnect(); } catch (_) {}
    try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (_) {}
    try { micCtxRef.current?.close(); } catch (_) {}
    try { playCtxRef.current?.close(); } catch (_) {}
    try { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close(); } catch (_) {}
    processorRef.current = null;
    micStreamRef.current = null;
    micCtxRef.current = null;
    playCtxRef.current = null;
    wsRef.current = null;
    nextPlayTimeRef.current = 0;
    pendingTranscriptRef.current = { user: '', assistant: '' };
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const playChunk = (base64Pcm) => {
    try {
      if (!playCtxRef.current) {
        playCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUT_SAMPLE_RATE });
        nextPlayTimeRef.current = playCtxRef.current.currentTime;
      }
      const ctx = playCtxRef.current;
      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') ctx.resume();

      const int16 = base64ToInt16(base64Pcm);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;

      const buffer = ctx.createBuffer(1, float32.length, OUT_SAMPLE_RATE);
      buffer.copyToChannel(float32, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const startAt = Math.max(nextPlayTimeRef.current, ctx.currentTime);
      source.start(startAt);
      nextPlayTimeRef.current = startAt + buffer.duration;
    } catch (err) {
      console.warn('Audio playback error:', err.message);
    }
  };

  const flushTranscript = (role) => {
    const text = pendingTranscriptRef.current[role]?.trim();
    if (!text) return;
    setTranscript(prev => [...prev, { role, text }]);
    pendingTranscriptRef.current[role] = '';
  };

  const handleServerMessage = (msg) => {
    const content = msg.serverContent;
    if (!content) return;

    // Audio chunks from AI
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData?.data) {
          setAiSpeaking(true);
          playChunk(part.inlineData.data);
        }
      }
    }

    // Transcription
    if (content.inputTranscription?.text) {
      pendingTranscriptRef.current.user += content.inputTranscription.text;
    }
    if (content.outputTranscription?.text) {
      pendingTranscriptRef.current.assistant += content.outputTranscription.text;
    }

    // Turn ended — flush transcripts
    if (content.turnComplete) {
      flushTranscript('user');
      flushTranscript('assistant');
      setAiSpeaking(false);
    }

    // AI was interrupted (user started talking)
    if (content.interrupted) {
      flushTranscript('assistant');
      setAiSpeaking(false);
      // Reset playback clock so next AI utterance starts immediately
      if (playCtxRef.current) {
        nextPlayTimeRef.current = playCtxRef.current.currentTime;
      }
    }
  };

  const startMicCapture = async (ws) => {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: MIC_SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    micStreamRef.current = micStream;

    const micCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: MIC_SAMPLE_RATE });
    micCtxRef.current = micCtx;

    const source = micCtx.createMediaStreamSource(micStream);
    // ScriptProcessor is deprecated but still universally supported; AudioWorklet needs extra file
    const processor = micCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(input);
      ws.send(JSON.stringify({
        realtimeInput: {
          audio: {
            data: int16ToBase64(pcm16),
            mimeType: `audio/pcm;rate=${MIC_SAMPLE_RATE}`,
          },
        },
      }));
    };

    source.connect(processor);
    processor.connect(micCtx.destination);
    setStatusSafe(STATUS.CONNECTED);
  };

  const start = async () => {
    setStatusSafe(STATUS.CONNECTING);
    setTranscript([]);
    setErrorMsg('');
    setMuted(false);

    try {
      const { data } = await api.post('/speaking/session', { lessonId, topic });
      const { token, model, instructions, isApiKey } = data.data;

      if (!token) throw new Error('Server token qaytarmadi');
      if (!model) throw new Error('Server model nomini qaytarmadi');

      // Build WebSocket URL:
      // - isApiKey=true  → plain API Studio key → ?key=TOKEN
      // - isApiKey=false → ephemeral token      → ?key=TOKEN (Gemini uses same param)
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Build setup payload
        const setupPayload = {
          setup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              // Transcription fields must be INSIDE generationConfig
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          },
        };

        // When using a raw API key (isApiKey=true), the systemInstruction was NOT
        // baked into an ephemeral token — so we must send it in the setup message.
        // When using a real ephemeral token (isApiKey=false), it's already embedded.
        if (isApiKey && instructions) {
          setupPayload.setup.systemInstruction = {
            parts: [{ text: instructions }],
          };
        }

        ws.send(JSON.stringify(setupPayload));
      };

      ws.onmessage = async (evt) => {
        try {
          const text = typeof evt.data === 'string' ? evt.data : await evt.data.text();
          const msg = JSON.parse(text);

          // Server confirmed setup — now safe to start sending audio
          if (msg.setupComplete) {
            startMicCapture(ws).catch(err => {
              console.error('Mic capture error:', err);
              const msg = err.name === 'NotAllowedError'
                ? "Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering."
                : "Mikrofonga ulanishda xatolik: " + err.message;
              toast.error(msg);
              setErrorMsg(msg);
              cleanup();
              setStatusSafe(STATUS.ERROR);
            });
            return;
          }
          handleServerMessage(msg);
        } catch { /* non-JSON binary frames, ignore */ }
      };

      ws.onerror = (ev) => {
        console.error('WebSocket error:', ev);
        const msg = "Gemini Live ulanishida xatolik. Internet yoki API kalitni tekshiring.";
        toast.error(msg);
        setErrorMsg(msg);
        cleanup();
        setStatusSafe(STATUS.ERROR);
      };

      ws.onclose = (ev) => {
        // Use ref — not closure-captured state — to check real current status
        if (statusRef.current !== STATUS.IDLE) {
          cleanup();
          setStatusSafe(STATUS.IDLE);
          setAiSpeaking(false);
          if (ev.code !== 1000 && ev.code !== 1005) {
            // Abnormal close (not user-initiated)
            toast.error(`Suhbat to'xtatildi (kod: ${ev.code})`);
          }
        }
      };
    } catch (err) {
      console.error('Speaking start error:', err);
      const msg = friendlyAiErrorMessage(err);
      toast.error(msg);
      setErrorMsg(msg);
      cleanup();
      setStatusSafe(STATUS.ERROR);
    }
  };

  const stop = () => {
    cleanup();
    setStatusSafe(STATUS.IDLE);
    setAiSpeaking(false);
  };

  const toggleMute = () => {
    const track = micStreamRef.current?.getAudioTracks()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  };

  const isActive = status === STATUS.CONNECTING || status === STATUS.CONNECTED;

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center py-4">

      {/* Avatar / animation */}
      <div className="relative w-28 h-28 mb-5">
        <motion.div
          className="absolute inset-0 rounded-full gradient-bg opacity-90"
          animate={aiSpeaking ? { scale: [1, 1.14, 1] } : { scale: 1 }}
          transition={{ duration: 0.75, repeat: aiSpeaking ? Infinity : 0 }}
        />
        {/* Pulse rings when connected */}
        {status === STATUS.CONNECTED && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full gradient-bg opacity-20"
              animate={{ scale: [1, 1.5], opacity: [0.2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full gradient-bg opacity-10"
              animate={{ scale: [1, 1.8], opacity: [0.1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          {status === STATUS.CONNECTING ? (
            <Loader2 size={30} className="text-white animate-spin" />
          ) : status === STATUS.CONNECTED ? (
            aiSpeaking
              ? <Volume2 size={30} className="text-white" />
              : <Radio size={30} className="text-white" />
          ) : (
            <Mic size={30} className="text-white" />
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-bold text-lg mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        Gapirish mashqi
      </h3>
      <p
        className="text-sm text-center mb-1 max-w-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        {topic ? `Mavzu: "${topic}"` : 'AI murabbiy bilan real vaqtda gaplashing'}
      </p>
      <p
        className="text-xs text-center mb-6 max-w-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        AI grammatika, talaffuz va nutq xatolaringizni darhol tuzatadi.
      </p>

      {/* Status badge */}
      {status === STATUS.CONNECTED && (
        <div className="mb-4 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: 'var(--secondary-background)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {aiSpeaking ? 'AI gapirmoqda...' : 'Quloq solmoqda'}
        </div>
      )}

      {/* Error message */}
      {errorMsg && status === STATUS.ERROR && (
        <div className="mb-4 text-xs text-center px-4 py-2 rounded-xl text-red-600 dark:text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {errorMsg}
        </div>
      )}

      {/* Controls */}
      {!isActive ? (
        <button onClick={start} className="btn-primary flex items-center gap-2 px-6 py-2.5">
          <Mic size={16} />
          Suhbatni boshlash
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="btn-ghost p-3 rounded-full"
            title={muted ? 'Mikrofon yoqish' : 'Mikrofon o\'chirish'}
            style={{ border: '1px solid var(--border)' }}
          >
            {muted
              ? <MicOff size={18} className="text-red-500" />
              : <Mic size={18} style={{ color: 'var(--text-primary)' }} />
            }
          </button>
          <button
            onClick={stop}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
            title="Suhbatni tugatish"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div
          className="mt-6 w-full space-y-2 max-h-72 overflow-y-auto pr-1 rounded-2xl p-3"
          style={{ background: 'var(--secondary-background)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            Suhbat tarixi
          </p>
          <AnimatePresence initial={false}>
            {transcript.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {t.role === 'assistant' && (
                  <div className="w-6 h-6 gradient-bg rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <Bot size={12} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    t.role === 'user'
                      ? 'gradient-bg text-white rounded-br-sm'
                      : 'rounded-bl-sm'
                  }`}
                  style={t.role !== 'user' ? {
                    background: 'var(--card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  } : {}}
                >
                  {t.text}
                </div>
                {t.role === 'user' && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <User size={12} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={transcriptEndRef} />
        </div>
      )}
    </div>
  );
}
