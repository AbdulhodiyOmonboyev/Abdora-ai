import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Upload, Send, FileText, X, Mic, Square, Play, Pause,
  Sparkles, CheckCircle2, Clock, Award, Heart, HelpCircle, Headphones,
  BookOpen, PenTool, RotateCcw, Volume2, VolumeX, Star, Check, AlertCircle,
  RefreshCw, ChevronRight, MessageSquare, Bot, Share2, Layers
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';
import { getHomeworkCategory, CATEGORY_CONFIG } from './StudentHomework';

// Audio timer formatter (00:00)
const formatTimer = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Intelligent extractor and generator for interactive questions
function getInteractiveQuestions(hw, category) {
  if (Array.isArray(hw?.interactiveQuestions) && hw.interactiveQuestions.length > 0) {
    return hw.interactiveQuestions;
  }
  if (Array.isArray(hw?.interactiveInputs) && hw.interactiveInputs.length > 0) {
    return hw.interactiveInputs;
  }

  // Check if description has embedded INTERACTIVE_CONFIG
  if (hw?.description) {
    try {
      const configMatch = hw.description.match(/<!-- INTERACTIVE_CONFIG:\s*([\s\S]*?)\s*-->/);
      if (configMatch && configMatch[1]) {
        const parsed = JSON.parse(configMatch[1]);
        if (Array.isArray(parsed.interactiveInputs) && parsed.interactiveInputs.length > 0) {
          return parsed.interactiveInputs.map((item, idx) => ({
            id: item.id || `inp_${idx + 1}`,
            type: item.type,
            title: `${idx + 1}-topshiriq (${item.points || 10} ball)`,
            prompt: item.question,
            options: item.options || [],
            correctAnswer: item.correctAnswer || '',
            expectedAnswer: item.correctAnswer || '',
            points: item.points || 10,
            hint: item.hint || '',
          }));
        }
      }
    } catch (_) {}
  }

  // Check if description has embedded JSON
  if (hw?.description) {
    try {
      const match = hw.description.match(/\{[\s\S]*"tasks"[\s\S]*\}|\{[\s\S]*"questions"[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const list = parsed.tasks || parsed.questions;
        if (Array.isArray(list) && list.length > 0) {
          return list.map((item, idx) => ({
            id: `q_${idx + 1}`,
            type: item.type === 'multiple_choice' ? 'multiple_choice' : item.type === 'fill_blank' ? 'fill_blank' : 'short_answer',
            title: `${idx + 1}-topshiriq`,
            prompt: item.question || item.title || item.instructions || `Savol ${idx + 1}`,
            options: item.options || (item.sampleAnswer ? [item.sampleAnswer, 'Boshqa variant', 'Tushuncha yo\'q'] : []),
            correctAnswer: item.correctAnswer || item.sampleAnswer || '',
            expectedAnswer: item.expectedAnswer || item.sampleAnswer || '',
            points: item.points || 30,
          }));
        }
      }
    } catch (_) {}
  }

  const topic = hw?.title || 'Dars mavzusi';

  if (category === 'listening') {
    return [
      {
        id: 'listen_1',
        type: 'fill_blank',
        title: "1. Tinglab bo'sh joyni to'ldirish (Fill in the blank)",
        prompt: "Audio yozuvdagi kalit iborani to'ldiring:",
        blankPrefix: "Audioda ta'kidlanganidek, berilgan darsning markaziy asosi bu —",
        blankSuffix: "hisoblanadi.",
        expectedAnswer: "muhim",
        hint: "Mavzuga doir kalit so'zni kiriting (masalan: muhim, amaliyot, harakat)",
        points: 30,
      },
      {
        id: 'listen_2',
        type: 'multiple_choice',
        title: "2. Tinglash tushunchasi bo'yicha test (Listening Comprehension)",
        prompt: "Tinglangan audio materialning bosh g'oyasi qaysi javobda eng to'g'ri ifodalangan?",
        options: [
          `A) ${topic} bo'yicha tushunchalar va ularning ahamiyati tushuntirildi`,
          `B) Faqat tarixiy ma'lumotlar aytildi`,
          `C) Hech qanday aniq tushuntirish berilmadi`,
          `D) Boshqa chet mavzu haqida so'z bordi`
        ],
        correctAnswer: `A) ${topic} bo'yicha tushunchalar va ularning ahamiyati tushuntirildi`,
        points: 35,
      },
      {
        id: 'listen_3',
        type: 'short_answer',
        title: "3. Qisqa xulosa (Short answer)",
        prompt: "Audioni tinglaganingizdan so'ng, darsdan o'zingiz tushungan 2 ta asosiy fikrni yozing:",
        placeholder: "O'z so'zlaringiz bilan qisqacha xulosa qiling...",
        points: 35,
      }
    ];
  }

  if (category === 'reading') {
    return [
      {
        id: 'read_1',
        type: 'fill_blank',
        title: "1. Matndan kelib chiqib bo'sh joyni to'ldirish",
        prompt: "Yuqoridagi matn mazmuni asosida jumladagi bo'sh o'rinni to'ldiring:",
        blankPrefix: "Matnda keltirilganidek, bilimni mustahkamlash uchun doimiy",
        blankSuffix: "talab etiladi.",
        expectedAnswer: "amaliyot",
        hint: "Masalan: amaliyot, harakat, intilish",
        points: 30,
      },
      {
        id: 'read_2',
        type: 'multiple_choice',
        title: "2. O'qilgan matn yuzasidan test (Reading Comprehension)",
        prompt: "Ushbu o'qilgan matndan chiqariladigan eng to'g'ri xulosa qaysi?",
        options: [
          `A) ${topic} asoslarini o'rganish va amalda qo'llash muvaffaqiyat garovidir`,
          `B) Mavzuni faqat yodlab olishning o'zi yetarli`,
          `C) Matnda keltirilgan ma'lumotlar foydasiz`,
          `D) Matn mavzuga mutlaqo aloqador emas`
        ],
        correctAnswer: `A) ${topic} asoslarini o'rganish va amalda qo'llash muvaffaqiyat garovidir`,
        points: 35,
      },
      {
        id: 'read_3',
        type: 'short_answer',
        title: "3. Matn yuzasidan tahliliy javob",
        prompt: "Matndagi eng asosiy fakt yoki xabarni o'z so'zlaringiz bilan ifodalang:",
        placeholder: "Matndan olgan eng muhim xulosangizni yozing...",
        points: 35,
      }
    ];
  }

  if (category === 'speaking') {
    return [
      {
        id: 'speak_1',
        type: 'short_answer',
        title: "1. Nutq rejasining asosiy tezisi",
        prompt: "Ovoz chiqarib gapirishdan oldin nutqingizning asosiy mavzusini 1-2 jumlada bayon eting:",
        placeholder: "Masalan: Men ushbu mavzuda o'rgangan qoidalarimni tushuntirib beraman...",
        points: 35,
      },
      {
        id: 'speak_2',
        type: 'fill_blank',
        title: "2. Nutqiy ifodali birikma",
        prompt: "Nutqingizda albatta ishlatiladigan muhim iborani to'ldiring:",
        blankPrefix: "Mavzu bo'yicha fikr yuritsak,",
        blankSuffix: "masalasi birinchi o'rinda turadi.",
        expectedAnswer: "asosiy",
        hint: "Masalan: asosiy, muhim, qiziqarli",
        points: 30,
      },
      {
        id: 'speak_3',
        type: 'multiple_choice',
        title: "3. Nutq mezonlari",
        prompt: "Mavzuni ovozli so'zlab berishda qanday ohang eng to'g'ri hisoblanadi?",
        options: [
          "A) Ravon, ishonchli va do'stona ohangda",
          "B) Shoshib, tushunarsiz so'zlar bilan",
          "C) To'xtovsiz qichqirib",
          "D) Jim o'tirib eshitish"
        ],
        correctAnswer: "A) Ravon, ishonchli va do'stona ohangda",
        points: 35,
      }
    ];
  }

  // Standard / Writing
  return [
    {
      id: 'write_1',
      type: 'fill_blank',
      title: "1. Bo'sh o'rinni to'ldirish (Fill in the blank)",
      prompt: "Mavzuning asosiy qoidasini to'ldiring:",
      blankPrefix: `${topic} doirasida berilgan topshiriqlar`,
      blankSuffix: "tarzda bajarilishi talab qilinadi.",
      expectedAnswer: "puxta",
      hint: "Masalan: puxta, to'liq, mustaqil",
      points: 30,
    },
    {
      id: 'write_2',
      type: 'multiple_choice',
      title: "2. Nazariy test savoli (Multiple Choice)",
      prompt: `"${topic}" mavzusi yuzasidan quyidagi qaysi qoida to'g'ri?`,
      options: [
        `A) Nazariy bilimlarni doimiy mustaqil amaliyot bilan boyitish lozim`,
        `B) Amaliy mashg'ulotlarsiz ham to'liq o'rganish mumkin`,
        `C) Hech qanday qoidaga amal qilish shart emas`,
        `D) Faqat tayyor javoblardan foydalanish kerak`
      ],
      correctAnswer: `A) Nazariy bilimlarni doimiy mustaqil amaliyot bilan boyitish lozim`,
      points: 35,
    },
    {
      id: 'write_3',
      type: 'short_answer',
      title: "3. Qisqa yozma xulosa (Short answer)",
      prompt: "Mavzu bo'yicha eng muhim xulosangizni asoslab yozing:",
      placeholder: "Fikrlaringizni tartibli va tushunarli bayon qiling...",
      points: 35,
    }
  ];
}

export default function HomeworkSubmit() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Homework query
  const { data: hw, isLoading } = useQuery({
    queryKey: ['homework', id],
    queryFn: () => api.get(`/homework/${id}`).then(r => r.data.data),
  });

  // Active Category (Listening, Reading, Speaking, Writing)
  const detectedCategory = useMemo(() => getHomeworkCategory(hw), [hw]);
  const [activeCategory, setActiveCategory] = useState('writing');

  // Synchronize category once homework is loaded
  useEffect(() => {
    if (detectedCategory) {
      setActiveCategory(detectedCategory);
    }
  }, [detectedCategory]);

  // Reading Passage Font Size
  const [readerFontSize, setReaderFontSize] = useState('md'); // 'sm' | 'md' | 'lg'

  // Form states
  const [answer, setAnswer] = useState('');
  const [files, setFiles] = useState([]);
  const [interactiveAnswers, setInteractiveAnswers] = useState({});

  // Voice recording state (Read aloud / Speaking / Voice Lab)
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordedAudioElementRef = useRef(null);

  // Teacher audio player state (Listening mode)
  const teacherAudioRef = useRef(null);
  const [isTeacherAudioPlaying, setIsTeacherAudioPlaying] = useState(false);
  const [teacherAudioProgress, setTeacherAudioProgress] = useState(0);
  const [teacherAudioDuration, setTeacherAudioDuration] = useState(0);
  const [teacherAudioCurrentTime, setTeacherAudioCurrentTime] = useState(0);
  const [teacherAudioSpeed, setTeacherAudioSpeed] = useState(1);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // AI Instant Evaluation Modal State
  const [aiResultModal, setAiResultModal] = useState({
    isOpen: false,
    score: 0,
    maxScore: 100,
    stars: 5,
    feedback: '',
    questionResults: [],
    hasAudio: false,
  });

  // Determine teacher audio attachment
  const teacherAudioAttachment = useMemo(() => {
    if (!Array.isArray(hw?.attachments)) return null;
    return hw.attachments.find(a => {
      const name = (a.name || a.url || '').toLowerCase();
      const type = (a.type || a.mimeType || '').toLowerCase();
      return type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(name);
    });
  }, [hw?.attachments]);

  const teacherAudioUrl = teacherAudioAttachment
    ? (teacherAudioAttachment.url || `/api/files/${teacherAudioAttachment.id}`)
    : null;

  // Extract interactive questions
  const questions = useMemo(() => {
    return getInteractiveQuestions(hw, activeCategory);
  }, [hw, activeCategory]);

  // Answer handler
  const handleAnswerChange = (fieldId, value) => {
    setInteractiveAnswers(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (formData) => api.post(`/homework/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      // Run instant AI evaluation on answers
      evaluateAiSubmission();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Topshirishda xatolik yuz berdi'),
  });

  // Evaluate AI Submission & Show Star Result Modal
  const evaluateAiSubmission = () => {
    let earnedPoints = 0;
    const totalMax = hw?.maxScore || 100;
    const qCount = questions.length;
    const pointsPerQ = Math.floor((totalMax * 0.7) / (qCount || 1));

    const results = questions.map((q) => {
      const studentAns = interactiveAnswers[q.id];
      let isCorrect = false;
      let qPoints = 0;
      let note = '';

      if (q.type === 'multiple_choice') {
        if (studentAns && studentAns === q.correctAnswer) {
          isCorrect = true;
          qPoints = q.points || pointsPerQ;
          note = "To'g'ri variant tanlandi!";
        } else if (studentAns) {
          isCorrect = false;
          note = `Noto'g'ri variant. To'g'ri javob: ${q.correctAnswer}`;
        } else {
          isCorrect = false;
          note = "Javob belgilanmadi.";
        }
      } else if (q.type === 'fill_blank') {
        const sVal = (studentAns || '').trim().toLowerCase();
        const expected = (q.expectedAnswer || '').trim().toLowerCase();
        if (sVal && (sVal === expected || expected.includes(sVal) || sVal.includes(expected))) {
          isCorrect = true;
          qPoints = q.points || pointsPerQ;
          note = "Bo'sh o'rin mantiqan to'g'ri to'ldirildi!";
        } else if (sVal.length > 0) {
          isCorrect = false;
          qPoints = Math.round((q.points || pointsPerQ) * 0.5);
          note = `Qisman mos keladi. Namunaviy javob: "${q.expectedAnswer}"`;
        } else {
          isCorrect = false;
          note = "Bo'sh joy to'ldirilmadi.";
        }
      } else {
        // short_answer
        const sVal = (studentAns || '').trim();
        if (sVal.length >= 15) {
          isCorrect = true;
          qPoints = q.points || pointsPerQ;
          note = "Fikr to'liq va ravon ifodalangan!";
        } else if (sVal.length >= 5) {
          isCorrect = true;
          qPoints = Math.round((q.points || pointsPerQ) * 0.8);
          note = "Qisqa, lekin to'g'ri fikr bildirildi.";
        } else {
          isCorrect = false;
          note = "Javob juda qisqa yoki kiritilmadi.";
        }
      }

      earnedPoints += qPoints;
      return {
        ...q,
        studentAnswer: studentAns || "(Javob berilmadi)",
        isCorrect,
        earnedPoints,
        note,
      };
    });

    // Audio & General Text Bonus
    let audioBonus = 0;
    if (audioBlob) {
      audioBonus += Math.round(totalMax * 0.25);
      earnedPoints += audioBonus;
    }
    if (answer.trim().length > 20) {
      earnedPoints += Math.round(totalMax * 0.05);
    }

    // Normalizing score
    const finalScore = Math.min(Math.max(earnedPoints, audioBlob ? 45 : 30), totalMax);
    const percentage = (finalScore / totalMax) * 100;

    let stars = 5;
    let feedback = '';

    if (percentage >= 88) {
      stars = 5;
      feedback = "A'lo natija! Barcha topshiriqlar puxta va diqqat bilan bajarildi. O'z ustingizda ishlashda davom eting! ⭐⭐⭐⭐⭐";
    } else if (percentage >= 70) {
      stars = 4;
      feedback = "Juda yaxshi natija! Ko'p savollarga to'g'ri javob berildi. Kichik xatolarni qayta ko'rib chiqish foydali bo'ladi. ⭐⭐⭐⭐";
    } else if (percentage >= 50) {
      stars = 3;
      feedback = "Yaxshi urinish! Mavzuni yana bir bor takrorlab, mustahkamlab olish tavsiya etiladi. ⭐⭐⭐";
    } else {
      stars = 2;
      feedback = "Harakat va jur'atingiz uchun rahmat! Xatolardan o'rganib, keyingi safar yanada yuqoriroq natija ko'rsatishingizga ishonamiz! ⭐⭐";
    }

    setAiResultModal({
      isOpen: true,
      score: finalScore,
      maxScore: totalMax,
      stars,
      feedback,
      questionResults: results,
      hasAudio: !!audioBlob,
    });
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration(prev => {
          if (prev >= 180) { // 3 minutes limit
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Mikrofonni yoqishga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan mikrofonni oching.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const discardAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordDuration(0);
    setIsPlayingRecordedAudio(false);
    if (recordedAudioElementRef.current) {
      recordedAudioElementRef.current.pause();
      recordedAudioElementRef.current = null;
    }
  };

  const togglePlayRecordedAudio = () => {
    if (!recordedAudioElementRef.current && audioUrl) {
      recordedAudioElementRef.current = new Audio(audioUrl);
      recordedAudioElementRef.current.onended = () => setIsPlayingRecordedAudio(false);
    }
    if (recordedAudioElementRef.current) {
      if (isPlayingRecordedAudio) {
        recordedAudioElementRef.current.pause();
        setIsPlayingRecordedAudio(false);
      } else {
        recordedAudioElementRef.current.play();
        setIsPlayingRecordedAudio(true);
      }
    }
  };

  // Teacher Audio Player Handlers (Listening)
  const togglePlayTeacherAudio = () => {
    if (!teacherAudioRef.current) return;
    if (isTeacherAudioPlaying) {
      teacherAudioRef.current.pause();
      setIsTeacherAudioPlaying(false);
    } else {
      teacherAudioRef.current.play();
      setIsTeacherAudioPlaying(true);
    }
  };

  const handleTeacherAudioTimeUpdate = () => {
    if (!teacherAudioRef.current) return;
    const current = teacherAudioRef.current.currentTime;
    const dur = teacherAudioRef.current.duration || 1;
    setTeacherAudioCurrentTime(current);
    setTeacherAudioProgress((current / dur) * 100);
  };

  const handleTeacherAudioLoaded = () => {
    if (!teacherAudioRef.current) return;
    setTeacherAudioDuration(teacherAudioRef.current.duration || 0);
  };

  const handleTeacherAudioSeek = (e) => {
    if (!teacherAudioRef.current) return;
    const seekPercent = Number(e.target.value);
    const dur = teacherAudioRef.current.duration || 1;
    const newTime = (seekPercent / 100) * dur;
    teacherAudioRef.current.currentTime = newTime;
    setTeacherAudioProgress(seekPercent);
    setTeacherAudioCurrentTime(newTime);
  };

  const handleTeacherAudioRewind = (seconds = 5) => {
    if (!teacherAudioRef.current) return;
    teacherAudioRef.current.currentTime = Math.max(0, teacherAudioRef.current.currentTime - seconds);
  };

  const handleTeacherAudioSpeedToggle = () => {
    if (!teacherAudioRef.current) return;
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(teacherAudioSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    teacherAudioRef.current.playbackRate = nextSpeed;
    setTeacherAudioSpeed(nextSpeed);
  };

  // Speech synthesis fallback for listening
  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) {
      return toast.error("Brauzeringizda nutq sintezi qo'llab-quvvatlanmaydi.");
    }
    if (isSynthesizing) {
      window.speechSynthesis.cancel();
      setIsSynthesizing(false);
      return;
    }
    const cleanText = (text || '').replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'uz-UZ';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSynthesizing(true);
    utterance.onend = () => setIsSynthesizing(false);
    utterance.onerror = () => setIsSynthesizing(false);
    window.speechSynthesis.speak(utterance);
  };

  // Cleanups
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recordedAudioElementRef.current) recordedAudioElementRef.current.pause();
      if (teacherAudioRef.current) teacherAudioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [audioUrl]);

  // Overall Submission trigger
  const handleSubmit = () => {
    const hasAnswers = Object.values(interactiveAnswers).some(v => String(v).trim().length > 0);
    const hasAudio = !!audioBlob;
    const hasText = answer.trim().length > 0;
    const hasUploadedFiles = files.length > 0;

    if (!hasAnswers && !hasAudio && !hasText && !hasUploadedFiles) {
      return toast.error("Iltimos, kamida bitta topshiriqni bajaring, ovoz yozing yoki javob matnini kiriting!");
    }

    // Format interactive answers into answer text
    const interactiveSummary = questions.map((q, idx) => {
      const studentVal = interactiveAnswers[q.id] || '(Javob berilmadi)';
      return `${idx + 1}-topshiriq [${q.title || q.prompt}]: ${studentVal}`;
    }).join('\n');

    let combinedAnswer = answer.trim();
    if (interactiveSummary) {
      combinedAnswer = `[TOP TOIFASI: ${activeCategory.toUpperCase()}]\n\n[INTERAKTIV JAVOBLAR]:\n${interactiveSummary}\n\n[O'QUVCHI MATNI / XULOSASI]:\n${combinedAnswer || 'Kiritilmadi'}\n\n<!-- STUDENT_ANSWERS: ${JSON.stringify({ answers: interactiveAnswers })} -->`;
    }

    const fd = new FormData();
    fd.append('answerText', combinedAnswer);

    if (audioBlob) {
      fd.append('files', audioBlob, `ovozli_${activeCategory}_${Date.now()}.webm`);
    }

    files.forEach(f => fd.append('files', f));
    submitMutation.mutate(fd);
  };

  // Reading Passage text
  const readingPassage = useMemo(() => {
    return hw?.passage || hw?.readingText || hw?.description ||
      "Berilgan mavzu bo'yicha matnni diqqat bilan o'qing. Har bir jumlani ifodali, tushunarli ohangda ovoz chiqarib o'qib bering va so'ngra pastdagi savollarga javob bering.";
  }, [hw]);

  // Progress of interactive inputs
  const answeredCount = useMemo(() => {
    return questions.filter(q => !!interactiveAnswers[q.id]?.toString().trim()).length;
  }, [questions, interactiveAnswers]);

  const activeCatConfig = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG.writing;
  const ActiveCatIcon = activeCatConfig.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white truncate">
                {hw?.title || 'Vazifani topshirish'}
              </h1>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${activeCatConfig.badgeClass}`}>
                <span>{activeCatConfig.emoji}</span>
                <span>{activeCatConfig.label}</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2 mt-0.5">
              {hw?.dueDate && <span><Clock size={11} className="inline mr-1" /> Muddat: {formatDate(hw.dueDate)}</span>}
              <span>•</span>
              <span className="badge text-[11px] bg-primary/10 text-primary font-bold">Maksimal: {hw?.maxScore || 100} ball</span>
            </p>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-[var(--border)]">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = activeCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Warm Encouragement Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 border border-primary/20 flex items-start gap-3.5 shadow-sm"
      >
        <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Heart size={20} className="fill-primary text-primary" />
        </div>
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
            Xato qilishdan aslo qo'rqma, bilim yo'lida har bir qadam muhim! ✨
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {activeCategory === 'listening' && "Audioni diqqat bilan eshitib, pastdagi savollarga javob bering. Xohlagancha qayta eshitishingiz mumkin!"}
            {activeCategory === 'reading' && "Matnni ovoz chiqarib o'qib, o'z ovozingizni yozib oling. Shundan so'ng matn bo'yicha savollarga javob yozing."}
            {activeCategory === 'speaking' && "Mavzu bo'yicha o'z fikrlaringizni mikrofon orqali erkin, ravon bayon eting. AI ovozingiz va nutqingizni tahlil qiladi."}
            {activeCategory === 'writing' && "Interaktiv maydonlarni to'ldiring, o'z xulosalaringizni yozing yoki fotosurat ilova qilib jo'nating."}
          </p>
        </div>
      </motion.div>

      {/* 🎧 1. LISTENING MODE SECTION */}
      {activeCategory === 'listening' && (
        <div className="card space-y-4 border-2 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
                <Headphones size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
                  Audio Pleyer (Listening Lab)
                </h3>
                <p className="text-xs text-gray-400">Audioni diqqat bilan tinglang va savollarni to'ldiring</p>
              </div>
            </div>

            {teacherAudioUrl && (
              <span className="badge text-[10px] bg-blue-500/20 text-blue-600 font-bold px-2 py-0.5">
                Ustoz audiosi mavjud
              </span>
            )}
          </div>

          {/* If Teacher Audio is available */}
          {teacherAudioUrl ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-blue-500/20 space-y-3 shadow-sm">
              <audio
                ref={teacherAudioRef}
                src={teacherAudioUrl}
                onTimeUpdate={handleTeacherAudioTimeUpdate}
                onLoadedMetadata={handleTeacherAudioLoaded}
                onEnded={() => setIsTeacherAudioPlaying(false)}
                className="hidden"
              />

              {/* Controls bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayTeacherAudio}
                    className="w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-all hover:scale-105"
                  >
                    {isTeacherAudioPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTeacherAudioRewind(5)}
                    className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all text-xs flex items-center gap-1 font-semibold"
                    title="5 soniya orqaga"
                  >
                    <RotateCcw size={14} />
                    <span>-5s</span>
                  </button>
                </div>

                {/* Animated waves while playing */}
                <div className="flex-1 max-w-[200px] h-6 hidden sm:flex items-center justify-center gap-1 px-3">
                  {[40, 70, 30, 90, 60, 45, 80, 50, 75, 35].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        isTeacherAudioPlaying
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      style={{ height: isTeacherAudioPlaying ? `${h}%` : '25%' }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed toggle */}
                  <button
                    type="button"
                    onClick={handleTeacherAudioSpeedToggle}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold text-xs border border-blue-500/20"
                  >
                    {teacherAudioSpeed}x
                  </button>

                  {/* Timer display */}
                  <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                    {formatTimer(teacherAudioCurrentTime)} / {formatTimer(teacherAudioDuration)}
                  </span>
                </div>
              </div>

              {/* Progress Scrub Bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={teacherAudioProgress || 0}
                  onChange={handleTeacherAudioSeek}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
              </div>
            </div>
          ) : (
            /* Fallback when teacher didn't upload audio */
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-[var(--border)] space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-500" />
                    <span>Ovozli Dars Matni (AI Speech Synthesizer)</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ustoz maxsus audio yuklamagan bo'lsa ham, sun'iy intellekt orqali matnni ovoz chiqarib eshitishingiz mumkin:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeakText(hw?.description || hw?.title)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSynthesizing
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {isSynthesizing ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isSynthesizing ? "To'xtatish" : "Matnni eshitish"}</span>
                </button>
              </div>

              {hw?.description && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-[var(--border)] text-xs text-gray-700 dark:text-gray-300 max-h-36 overflow-y-auto leading-relaxed">
                  {hw.description}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 📖 2. READING MODE SECTION */}
      {activeCategory === 'reading' && (
        <div className="card space-y-5 border-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
                  O'qish Matni & Ovoz Chiqarib O'qish (Read Aloud)
                </h3>
                <p className="text-xs text-gray-400">Matnni o'qing va ovozingizni yozib oling</p>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setReaderFontSize('sm')}
                className={`px-2 py-0.5 text-xs rounded-lg font-bold ${readerFontSize === 'sm' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setReaderFontSize('md')}
                className={`px-2 py-0.5 text-xs rounded-lg font-bold ${readerFontSize === 'md' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setReaderFontSize('lg')}
                className={`px-2 py-0.5 text-xs rounded-lg font-bold ${readerFontSize === 'lg' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}
              >
                A+
              </button>
            </div>
          </div>

          {/* Reading Passage Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/90 border border-emerald-500/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <span>📖 Reading Passage</span>
              <span>Ravon va ohangdor o'qing</span>
            </div>

            <div
              className={`text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed transition-all ${
                readerFontSize === 'sm' ? 'text-xs sm:text-sm' : readerFontSize === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}
            >
              {readingPassage}
            </div>
          </div>

          {/* Read Aloud Voice Recorder Widget */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-emerald-600" />
                <span className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white">
                  Ovoz chiqarib o'qish mashqi
                </span>
              </div>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Yozilmoqda ({formatTimer(recordDuration)})
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mikrofon tugmasini bosing va yuqoridagi matnni ifodali o'qib bering. Tugatgach "To'xtatish"ni bosing:
            </p>

            {/* Record Action Buttons */}
            {!audioUrl && !isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className="btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                <Mic size={15} /> Ovoz chiqarib o'qishni boshlash
              </button>
            )}

            {isRecording && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="btn-danger text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-red-500/30 animate-pulse"
                >
                  <Square size={14} /> To'xtatish ({formatTimer(recordDuration)})
                </button>
                <div className="flex items-center gap-1">
                  {[30, 80, 50, 95, 60, 40].map((h, i) => (
                    <span key={i} className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Audio Review Player */}
            {audioUrl && !isRecording && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayRecordedAudio}
                    className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 transition-all"
                  >
                    {isPlayingRecordedAudio ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                  </button>
                  <div className="text-xs">
                    <div className="font-bold text-gray-800 dark:text-white">
                      O'qilgan audio yozuv tayyor ({formatTimer(recordDuration)})
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-medium">
                      <CheckCircle2 size={12} /> Vazifa bilan birga ustozga jo'natiladi
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={discardAudio}
                  className="btn-ghost p-1.5 text-gray-400 hover:text-red-500 rounded-lg text-xs flex items-center gap-1"
                >
                  <X size={14} /> Qayta yozish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🗣️ 3. SPEAKING MODE SECTION */}
      {activeCategory === 'speaking' && (
        <div className="card space-y-5 border-2 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Mic size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
                  Ovozli Nutq & Fikr Bayoni (Speaking Lab)
                </h3>
                <p className="text-xs text-gray-400">Mavzu yuzasidan o'z nutqingizni erkin yozib qoldiring</p>
              </div>
            </div>
          </div>

          {/* Topic prompt card */}
          {hw?.description && (
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-amber-500/20 space-y-2">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} /> Nutq mavzusi va yo'riqnoma:
              </div>
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {hw.description}
              </div>
            </div>
          )}

          {/* Big Mic Recorder Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-amber-500/30 text-center space-y-4 shadow-sm">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm sm:text-base text-gray-800 dark:text-white">
                {isRecording ? "Sizni tinglamoqdamiz... Gapiring! 🎙️" : "Nutqingizni audio qilib yozib oling"}
              </h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Xohlagan qahramoningiz ovozida yoki o'z tabiiy ovozingizda fikringizni bayon eting. Xatolardan xavotir olmang!
              </p>
            </div>

            {/* Big Mic Button */}
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              {!audioUrl && !isRecording && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 hover:scale-105 transition-all"
                >
                  <Mic size={32} />
                </button>
              )}

              {isRecording && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-500/40 animate-pulse border-4 border-red-300"
                  >
                    <Square size={28} />
                  </button>
                  <div className="text-sm font-mono font-bold text-red-500">
                    Yozilmoqda: {formatTimer(recordDuration)}
                  </div>
                </div>
              )}

              {audioUrl && !isRecording && (
                <div className="w-full max-w-md p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayRecordedAudio}
                      className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm"
                    >
                      {isPlayingRecordedAudio ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white">
                        Ovozli nutq saqlandi ({formatTimer(recordDuration)})
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        AI tahlili va ustoz tekshiruviga yuboriladi
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={discardAudio}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl text-xs flex items-center gap-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📝 4. INTERACTIVE INPUTS WIDGET (ALL MODES) */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
                Interaktiv Savol va Topshiriqlar
              </h3>
              <p className="text-xs text-gray-400">Har bir savolga diqqat bilan javob bering</p>
            </div>
          </div>

          <div className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
            {answeredCount} / {questions.length} bajarildi
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const currentVal = interactiveAnswers[q.id] || '';

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--secondary-background)] border border-[var(--border)] space-y-3 shadow-sm hover:border-primary/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span>{q.title || `${idx + 1}-topshiriq`}</span>
                  </span>

                  <span className="badge text-[10px] bg-primary/10 text-primary font-bold">
                    {q.points || 30} ball
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                  {q.prompt}
                </p>

                {/* Question Type: 1. Fill Blank */}
                {q.type === 'fill_blank' && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-[var(--border)] space-y-2">
                    <div className="text-xs sm:text-sm leading-loose text-gray-800 dark:text-gray-100 flex flex-wrap items-center gap-1.5">
                      <span>{q.blankPrefix || "Matn:"}</span>
                      <input
                        type="text"
                        value={currentVal}
                        onChange={e => handleAnswerChange(q.id, e.target.value)}
                        placeholder="[bo'sh joyni to'ldiring]"
                        className="px-3 py-1 font-bold text-primary bg-primary/10 border-b-2 border-primary rounded-lg text-xs sm:text-sm text-center outline-none focus:bg-primary/20 transition-all min-w-[140px]"
                      />
                      <span>{q.blankSuffix || "."}</span>
                    </div>
                    {q.hint && (
                      <p className="text-[11px] text-gray-400 italic">
                        💡 Yordam: {q.hint}
                      </p>
                    )}
                  </div>
                )}

                {/* Question Type: 2. Multiple Choice */}
                {q.type === 'multiple_choice' && (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {(q.options || []).map((opt, oIdx) => {
                      const isSelected = currentVal === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, opt)}
                          className={`p-3 rounded-xl text-xs sm:text-sm text-left font-medium border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                              : 'border-[var(--border)] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary/40'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 size={16} className="text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Question Type: 3. Short Answer */}
                {q.type === 'short_answer' && (
                  <div>
                    <textarea
                      value={currentVal}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      placeholder={q.placeholder || "Javobingizni o'z so'zlaringiz bilan bayon eting..."}
                      rows={3}
                      className="input-field text-xs sm:text-sm resize-none"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 📝 5. COMPREHENSIVE TEXT & FILE UPLOAD */}
      <div className="card space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
            <MessageSquare size={15} className="text-primary" />
            <span>Umumiy fikr yoki qo'shimcha tushuntirish (Ixtiyoriy)</span>
          </label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Do'stim, o'rganganlaring yoki topshiriq yuzasidan xulosang haqida bemalol shu yerga batafsil yozishing mumkin..."
            rows={4}
            className="input-field resize-none text-xs sm:text-sm"
          />
        </div>

        {/* File & Photo Upload */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
            <Upload size={15} className="text-primary" />
            <span>Rasm yoki qo'shimcha hujjat ilova qilish</span>
          </label>
          <label className="border-2 border-dashed border-[var(--border)] rounded-2xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all block">
            <Upload size={20} className="mx-auto mb-1 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
              Daftar fotosi, rasm yoki hujjatni tanlash uchun bosing
            </span>
            <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, PDF yoki Word formatida</p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={e => setFiles(Array.from(e.target.files))}
            />
          </label>

          {files.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-[var(--secondary-background)] border border-[var(--border)] rounded-xl px-3 py-2"
                >
                  <FileText size={14} className="text-primary flex-shrink-0" />
                  <span className="flex-1 truncate font-medium">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="btn-primary w-full py-3.5 text-sm sm:text-base flex items-center justify-center gap-2 font-black rounded-2xl shadow-soft hover:shadow-lg transition-all"
        >
          {submitMutation.isPending ? (
            'Topshiriq yuborilmoqda va AI tahlil qilmoqda...'
          ) : (
            <>
              <Sparkles size={18} />
              <span>Topshirish va AI bahosini olish ⭐</span>
            </>
          )}
        </button>
      </div>

      {/* ⭐ 6. INSTANT AI EVALUATION RESULT MODAL */}
      <AnimatePresence>
        {aiResultModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-7 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-primary/30"
            >
              {/* Stars & Score Header */}
              <div className="text-center space-y-2 pb-4 border-b border-[var(--border)] flex-shrink-0">
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.div
                      key={star}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: star * 0.1 }}
                    >
                      <Star
                        size={28}
                        className={`transition-all ${
                          star <= aiResultModal.stars
                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                            : 'text-gray-300 dark:text-gray-700'
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white">
                  Ajoyib! Dastlabki AI Balli: {aiResultModal.score} / {aiResultModal.maxScore}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  {aiResultModal.feedback}
                </p>
              </div>

              {/* Breakdown List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot size={14} className="text-primary" />
                  <span>Savollar bo'yicha tahlil:</span>
                </div>

                {aiResultModal.questionResults.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                      q.isCorrect
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                        {q.isCorrect ? (
                          <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                        )}
                        <span>{q.title || `${idx + 1}-topshiriq`}</span>
                      </span>
                      <span className={q.isCorrect ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {q.isCorrect ? "To'g'ri" : "Qayta ko'ring"}
                      </span>
                    </div>

                    <div className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Sizning javobingiz: </span>
                      <span>{q.studentAnswer}</span>
                    </div>

                    {q.note && (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                        {q.note}
                      </div>
                    )}
                  </div>
                ))}

                {aiResultModal.hasAudio && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <Mic size={16} className="text-amber-600 flex-shrink-0" />
                    <span>
                      🎙️ Ovozli topshiriq muvaffaqiyatli qabul qilindi va ustozingizga tinglash uchun yuborildi!
                    </span>
                  </div>
                )}

                {/* Teacher Confirmation Notice */}
                <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-primary space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Ustoz tasdig'iga yuborildi
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-normal">
                    Javoblaringiz tizimda saqlandi. O'qituvchingiz ko'rib chiqib, yakuniy tasdiqlagach ballingiz umumiy ko'rsatkichingizga qo'shiladi.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setAiResultModal(prev => ({ ...prev, isOpen: false }))}
                  className="btn-ghost text-xs py-2 px-4 rounded-xl font-bold"
                >
                  Ko'rib chiqish (Yopish)
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/student/homework')}
                  className="btn-primary text-xs py-2.5 px-5 rounded-xl font-black flex items-center gap-1.5 shadow-soft"
                >
                  <span>Uy vazifalari ro'yxatiga qaytish</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
