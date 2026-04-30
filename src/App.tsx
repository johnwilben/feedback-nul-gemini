import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Star, 
  GraduationCap,
  Loader2,
  ChevronRight,
  ChevronLeft,
  QrCode,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Smile,
  Frown,
  Meh,
  MessageSquare,
  Building2,
  ArrowRight,
  Download,
  UserPlus,
  FileText,
  Landmark,
  Users,
  Book,
  Monitor,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { FeedbackCategory, Feedback, FeedbackStatus, RatingLabel, FeedbackRatings } from './types';
import { summarizeResults } from './services/geminiService';
import { submitFeedback, getFeedbacks } from './services/feedbackService';
import { getFirebase } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// Smileys and Labels for the 7-scaler
const RATING_SCALE = [
  { value: 7, label: RatingLabel.OUTSTANDING, emoji: "🤩", color: "text-green-600", bg: "bg-green-50" },
  { value: 6, label: RatingLabel.EXCELLENT, emoji: "😊", color: "text-emerald-500", bg: "bg-emerald-50" },
  { value: 5, label: RatingLabel.VERY_SATISFACTORY, emoji: "🙂", color: "text-lime-500", bg: "bg-lime-50" },
  { value: 4, label: RatingLabel.SATISFACTORY, emoji: "😐", color: "text-amber-500", bg: "bg-amber-50" },
  { value: 3, label: RatingLabel.FAIR, emoji: "😟", color: "text-orange-500", bg: "bg-orange-50" },
  { value: 2, label: RatingLabel.POOR, emoji: "☹️", color: "text-red-400", bg: "bg-red-50" },
  { value: 1, label: RatingLabel.VERY_POOR, emoji: "😡", color: "text-red-600", bg: "bg-red-600/5" },
];

const QUESTIONS = [
  { id: 'responsiveness' as keyof FeedbackRatings, label: "Responsiveness and Waiting Time", description: "The office attended to my concern within a reasonable time frame." },
  { id: 'courtesy' as keyof FeedbackRatings, label: "Courtesy and Professionalism", description: "Staff treated me with respect and professionalism." },
  { id: 'clarity' as keyof FeedbackRatings, label: "Clarity and Accuracy of Information", description: "The information provided was clear and accurate." },
  { id: 'efficiency' as keyof FeedbackRatings, label: "Efficiency of Processes", description: "The process was simple and completed without unnecessary delays." },
  { id: 'accessibility' as keyof FeedbackRatings, label: "Accessibility and Availability", description: "The service was easy to access and available when needed." },
];

export default function App() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [view, setView] = useState<'form' | 'admin'>('form');
  
  // Form State
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [otherCategory, setOtherCategory] = useState('');
  const [ratings, setRatings] = useState<FeedbackRatings>({
    responsiveness: 0,
    courtesy: 0,
    clarity: 0,
    efficiency: 0,
    accessibility: 0,
    overall: 0
  });
  const [likedMost, setLikedMost] = useState('');
  const [improvements, setImprovements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin State
  const [adminUsername, setAdminUsername] = useState('');
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [adminFilter, setAdminFilter] = useState<'All' | FeedbackCategory>('All');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [aiGlobalSummary, setAiGlobalSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const CATEGORY_ICONS: Record<FeedbackCategory, React.ReactNode> = {
    [FeedbackCategory.ADMISSIONS]: <UserPlus size={24} />,
    [FeedbackCategory.REGISTRAR]: <FileText size={24} />,
    [FeedbackCategory.TREASURY]: <Landmark size={24} />,
    [FeedbackCategory.SDAO]: <Users size={24} />,
    [FeedbackCategory.LRC]: <Book size={24} />,
    [FeedbackCategory.ITSO]: <Monitor size={24} />,
    [FeedbackCategory.OTHERS]: <Layers size={24} />,
  };

  // URL Param handling
  useEffect(() => {
    const initAuth = async () => {
      const { auth } = await getFirebase();
      if (auth) {
        onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
        });
      }
    };
    initAuth();

    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if (cat && Object.values(FeedbackCategory).includes(cat as FeedbackCategory)) {
      setCategory(cat as FeedbackCategory);
    }
  }, []);

  const handleRating = (key: keyof FeedbackRatings, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!category || (category === FeedbackCategory.OTHERS && !otherCategory)) {
        alert("Please select an office.");
        return;
    }

    const missingRatings = QUESTIONS.filter(q => ratings[q.id] === 0);
    if (missingRatings.length > 0 || ratings.overall === 0) {
      alert("Please complete all rating items.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { auth } = await getFirebase();
      
      const data: any = {
        userId: auth?.currentUser?.uid || 'anonymous-bulldog',
        userName: 'Anonymous Bulldog',
        category: category as FeedbackCategory,
        ratings,
        likedMost,
        improvements,
        status: FeedbackStatus.PENDING,
        createdAt: Date.now()
      };

      if (category === FeedbackCategory.OTHERS && otherCategory) {
        data.otherCategory = otherCategory;
      }

      await submitFeedback(data);
      setIsSuccess(true);
    } catch (e: any) {
      console.error("Submission Error:", e);
      let errorMsg = "Submission failed. Mangyaring subukan muli.";
      if (e.message && e.message.includes("timed out")) {
        errorMsg = "Submission timed out. Please check your internet connection.";
      }
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername.toLowerCase() === 'admin' && adminPin === '1900') {
      setIsAdminAuthenticated(true);
      await loadAdminData();
    } else {
      alert("Maling Username o Password.");
    }
  };

  const handleLogout = async () => {
    const { auth } = await getFirebase();
    if (auth) {
      await signOut(auth);
      setIsAdminAuthenticated(false);
      setAdminPin('');
      setAdminUsername('');
      setView('form');
    }
  };

  const loadAdminData = async () => {
    setIsAdminLoading(true);
    try {
      const data = await getFeedbacks();
      console.log(`Loaded ${data?.length || 0} feedbacks`);
      // Manual sort as fallback
      const sorted = (data as any[] || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAllFeedbacks(sorted);
      if (!data || data.length === 0) {
        console.warn("No data returned from Firestore");
      }
    } catch (e: any) {
      console.error("Admin Load Error:", e);
      let msg = "Failed to load responses.";
      if (e.message && e.message.includes("permissions")) msg = "Security permission denied.";
      if (e.message && e.message.includes("index")) msg = "Missing database index. Please wait a few minutes.";
      alert(msg);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    try {
      const filtered = adminFilter === 'All' ? allFeedbacks : allFeedbacks.filter(f => f.category === adminFilter);
      const summary = await summarizeResults(filtered);
      setAiGlobalSummary(summary || '');
    } catch (err) {
      console.error("Summary error:", err);
      alert("Could not generate AI summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const exportToCSV = () => {
    if (filteredFeedbacks.length === 0) return;
    
    const headers = [
      'Date', 'Category', 'Other Category', 
      'Responsiveness', 'Courtesy', 'Clarity', 'Efficiency', 'Accessibility', 'Overall',
      'Liked Most', 'Improvements'
    ];
    
    const rows = filteredFeedbacks.map(f => [
      new Date(f.createdAt).toLocaleString(),
      f.category,
      f.otherCategory || '',
      f.ratings.responsiveness,
      f.ratings.courtesy,
      f.ratings.clarity,
      f.ratings.efficiency,
      f.ratings.accessibility,
      f.ratings.overall,
      `"${f.likedMost.replace(/"/g, '""')}"`,
      `"${f.improvements.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NU_Laguna_Feedback_${adminFilter}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFeedbacks = adminFilter === 'All' 
    ? allFeedbacks 
    : allFeedbacks.filter(f => f.category === adminFilter);

  const stats = {
    total: filteredFeedbacks.length,
    avgOverall: filteredFeedbacks.length > 0 
      ? (filteredFeedbacks.reduce((acc, curr) => acc + curr.ratings.overall, 0) / filteredFeedbacks.length).toFixed(1) 
      : '0.0',
    sentiment: filteredFeedbacks.filter(f => f.ratings.overall >= 5).length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#35408f] selection:text-white">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => (window.location.href = '/')}>
              <motion.div whileHover={{ rotate: 5 }} className="bg-[#35408f] p-2.5 rounded-xl shadow-lg shadow-[#35408f]/10 transition-all">
                 <GraduationCap className="text-[#febd11]" size={24} />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-[#35408f] leading-none uppercase">NU Laguna</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Feedback Portal</span>
              </div>
            </div>
            {view === 'admin' && (
              <button 
                onClick={() => setView('form')}
                className="text-[11px] font-black text-[#35408f] bg-[#35408f]/5 uppercase tracking-[0.2em] px-5 py-2.5 rounded-full hover:bg-[#35408f] hover:text-white transition-all border border-[#35408f]/10"
              >
                Submit Feedback
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 pt-12 pb-32">
        <AnimatePresence mode="wait">
          {view === 'form' && !isSuccess && (
            <motion.form 
              key="feedback-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-16"
            >
              {/* Introduction */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#febd11]/10 rounded-full border border-[#febd11]/20">
                  <ShieldCheck size={14} className="text-[#35408f]" />
                  <span className="text-[10px] font-black text-[#35408f] uppercase tracking-widest">Confidential Submission</span>
                </div>
                <h1 className="text-5xl sm:text-6xl font-black text-[#35408f] tracking-tighter leading-[0.85]">Shape the <br />Future of <span className="text-[#febd11] italic">NU.</span></h1>
                <p className="text-slate-500 font-medium max-w-lg text-lg">Your feedback is a vital part of our commitment to education that works. Let us know how we can improve our services.</p>
              </div>

              {/* Office Selection */}
              <section className="space-y-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#35408f] text-white rounded-full flex items-center justify-center font-black text-sm shadow-xl">1</div>
                  <h2 className="text-xl font-black text-[#35408f] uppercase tracking-tight">Select Department</h2>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(FeedbackCategory).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all text-center ${
                        category === cat ? 'border-[#35408f] bg-[#35408f]/5 shadow-md scale-[1.02]' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${category === cat ? 'bg-[#35408f] text-white' : 'bg-white shadow-sm text-slate-400'}`}>
                          {CATEGORY_ICONS[cat as FeedbackCategory]}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${category === cat ? 'text-[#35408f]' : 'text-slate-500'}`}>{cat}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {category === FeedbackCategory.OTHERS && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden pt-4"
                    >
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Specify Department Name</label>
                       <input 
                        required
                        type="text" 
                        value={otherCategory}
                        onChange={(e) => setOtherCategory(e.target.value)}
                        placeholder="e.g. Guidance, Clinic, etc."
                        className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-white focus:border-[#35408f] focus:outline-none font-bold text-lg shadow-inner"
                       />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Rating Questions */}
              <section className="space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#35408f] text-white rounded-full flex items-center justify-center font-black text-sm shadow-xl">2</div>
                  <h2 className="text-xl font-black text-[#35408f] uppercase tracking-tight">Service Quality Assessment</h2>
                </div>

                <div className="space-y-24">
                  {QUESTIONS.map((question, qIdx) => (
                    <div key={question.id} className="space-y-8">
                      <div className="space-y-2 border-l-4 border-[#febd11] pl-6">
                        <p className="text-[11px] font-black text-[#febd11] uppercase tracking-[0.3em]">Quality Insight {qIdx + 1}</p>
                        <h3 className="text-3xl font-black text-[#35408f] tracking-tighter leading-tight">{question.label}</h3>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">{question.description}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {RATING_SCALE.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleRating(question.id, item.value)}
                            className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all group ${
                              ratings[question.id] === item.value 
                                ? `border-[#35408f] ${item.bg} shadow-lg scale-105` 
                                : 'border-white bg-white hover:border-slate-100 shadow-sm'
                            }`}
                          >
                            <span className={`text-4xl transition-transform duration-500 ${ratings[question.id] === item.value ? 'scale-125 rotate-6' : 'grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100'}`}>{item.emoji}</span>
                            <span className={`text-[9px] font-black uppercase text-center tracking-tighter leading-tight ${ratings[question.id] === item.value ? 'text-[#35408f]' : 'text-slate-400'}`}>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Qualitative Feedback */}
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#35408f] text-white rounded-full flex items-center justify-center font-black text-sm shadow-xl">3</div>
                  <h2 className="text-xl font-black text-[#35408f] uppercase tracking-tight">Your Narrative</h2>
                </div>

                <div className="grid gap-12">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">What did you like most about the service?</label>
                    <textarea 
                      required
                      value={likedMost}
                      onChange={(e) => setLikedMost(e.target.value)}
                      placeholder="Share what went exceptionally well..."
                      className="w-full px-8 py-7 rounded-[3rem] border-2 border-slate-100 bg-white focus:border-[#35408f] focus:outline-none font-medium text-xl resize-none min-h-[180px] shadow-sm focus:shadow-xl transition-all"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">What improvements would you suggest?</label>
                    <textarea 
                      required
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="Specific suggestions for our team..."
                      className="w-full px-8 py-7 rounded-[3rem] border-2 border-slate-100 bg-white focus:border-[#35408f] focus:outline-none font-medium text-xl resize-none min-h-[180px] shadow-sm focus:shadow-xl transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Overall Satisfaction */}
              <section className="p-12 sm:p-20 bg-[#35408f] rounded-[4rem] text-white text-center space-y-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                    <Smile className="text-[#febd11]" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Final TouchPoint</span>
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">The Overall Experience.</h2>
                  <p className="text-white/60 font-medium text-lg">In one word, how would you describe your visit?</p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 relative z-10">
                  {RATING_SCALE.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRatings(prev => ({ ...prev, overall: item.value }))}
                      className={`flex flex-col items-center gap-3 px-6 py-5 rounded-[2.5rem] border-2 transition-all ${
                        ratings.overall === item.value ? 'border-[#febd11] bg-white text-[#35408f] scale-110 shadow-2xl' : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className={`text-4xl transition-transform ${ratings.overall === item.value ? 'scale-110 rotate-6' : 'opacity-40 grayscale group-hover:opacity-100'}`}>{item.emoji}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${ratings.overall === item.value ? 'text-[#35408f]' : 'text-white/50'}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Submit Button */}
              <div className="pt-12 text-center space-y-8">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full nu-gradient text-white py-8 rounded-[3.5rem] font-black shadow-[0_20px_50px_rgba(53,64,143,0.3)] flex items-center justify-center gap-4 text-3xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale group"
                >
                  {isSubmitting ? <Loader2 size={32} className="animate-spin" /> : <Send size={32} className="group-hover:rotate-12 transition-transform" />}
                  {isSubmitting ? 'Submitting Feedback...' : 'Submit Feedback'}
                </button>
              </div>
            </motion.form>
          )}

          {isSuccess && view === 'form' && (
            <motion.div 
              key="success-screen" 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12 py-24"
            >
              <div className="w-32 h-32 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-green-500 border border-green-100 shadow-xl shadow-green-100/50">
                <CheckCircle2 size={72} className="animate-bounce" />
              </div>
              <div className="space-y-6">
                <h2 className="text-7xl font-black text-[#35408f] tracking-tighter leading-[0.8] mb-4">You're Awesome, <br /><span className="text-[#febd11]">Bulldog!</span></h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[11px]">Your voice strengthens our community</p>
              </div>

              <div className="flex flex-col items-center gap-6 pt-8">
                <button 
                  onClick={() => window.location.reload()}
                  className="nu-gradient text-white px-14 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center gap-3"
                >
                  <ArrowRight size={18} />
                  New Feedback
                </button>
              </div>
            </motion.div>
          )}

          {view === 'admin' && (
            <div key="admin-container" className="space-y-12">
               {!isAdminAuthenticated ? (
                  <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 text-center space-y-12 max-w-xl mx-auto">
                    <div className="w-24 h-24 bg-[#35408f]/5 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck size={56} className="text-[#35408f]" />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-5xl font-black text-[#35408f] tracking-tighter uppercase leading-none">Security <br />Gateway</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Authorized Personnel Access ONLY</p>
                    </div>
                    <form onSubmit={handleAdminAuth} className="space-y-6">
                      <input 
                        type="text"
                        placeholder="Username"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full text-center text-xl font-bold py-6 px-10 rounded-3xl border-4 border-slate-100 focus:border-[#35408f] focus:outline-none transition-all placeholder:text-slate-200 text-[#35408f] shadow-inner"
                      />
                      <input 
                        type="password" 
                        placeholder="Password"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full text-center text-3xl font-black tracking-[0.5em] py-6 px-10 rounded-3xl border-4 border-slate-100 focus:border-[#35408f] focus:outline-none transition-all placeholder:text-slate-200 placeholder:tracking-normal placeholder:font-bold placeholder:text-xl text-[#35408f] shadow-inner"
                      />
                      <button type="submit" className="w-full nu-gradient text-white py-6 rounded-3xl font-black shadow-2xl shadow-[#35408f]/30 text-xl group overflow-hidden relative">
                        <span className="relative z-10">Access Dashboard</span>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                      </button>
                    </form>
                  </div>
               ) : (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    {/* Admin Header & Stats */}
                    <header className="space-y-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                          <h2 className="text-5xl font-black text-[#35408f] tracking-tighter uppercase leading-none">Responses Dashboard</h2>
                          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">
                             {allFeedbacks.length} Total Records Recorded 
                             {adminFilter !== 'All' && ` • ${filteredFeedbacks.length} filtered by ${adminFilter}`}
                          </p>
                        </div>
                        <div className="flex gap-4">
                           <button 
                            onClick={handleLogout}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-red-500 hover:text-red-700 transition-all hover:shadow-lg"
                            title="Logout"
                           >
                              <ShieldCheck size={24} />
                           </button>
                           <button 
                            onClick={exportToCSV}
                            disabled={filteredFeedbacks.length === 0}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-[#35408f] hover:bg-slate-50 transition-all hover:shadow-lg disabled:opacity-30"
                            title="Export to CSV"
                           >
                              <Download size={24} />
                           </button>
                           <button 
                             onClick={loadAdminData} 
                             className="p-3 bg-white border border-slate-200 rounded-2xl text-[#35408f] hover:bg-slate-50 transition-all hover:shadow-lg"
                             title="Refresh Data"
                           >
                              <CheckCircle2 size={24} />
                           </button>
                           <button 
                            onClick={generateSummary} 
                            disabled={isSummarizing || filteredFeedbacks.length === 0}
                            className="nu-gradient text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-50"
                           >
                            {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                            AI Global Summary
                           </button>
                        </div>
                      </div>

                      {/* AI Global Summary */}
                      <AnimatePresence>
                        {aiGlobalSummary && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-[#35408f] p-10 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                              <div className="relative z-10 flex items-center justify-between">
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#febd11]/20 rounded-full border border-[#febd11]/30">
                                  <div className="w-2 h-2 bg-[#febd11] rounded-full animate-pulse" />
                                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#febd11]">Gemini Insight Protocol</h3>
                                </div>
                                <button onClick={() => setAiGlobalSummary('')} className="text-white/40 hover:text-white transition-colors">Dismiss</button>
                              </div>
                              <div className="relative z-10 font-medium leading-relaxed text-lg opacity-90 pr-8 whitespace-pre-wrap">
                                {aiGlobalSummary}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          { label: 'Submissions', value: stats.total, sub: 'Responses Recorded', color: 'text-[#35408f]' },
                          { label: 'Avg Rating', value: `${stats.avgOverall}/7`, sub: 'Service Satisfaction', color: 'text-[#febd11]' },
                          { label: 'Positive', value: stats.sentiment, sub: 'Satisfactory Ratings', color: 'text-emerald-500' }
                        ].map((s, idx) => (
                          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group hover:shadow-xl transition-all">
                             <div className="relative z-10">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                               <h4 className={`text-4xl font-black ${s.color} tracking-tighter`}>{s.value}</h4>
                               <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">{s.sub}</p>
                             </div>
                             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Building2 size={80} />
                             </div>
                          </div>
                        ))}
                      </div>
                    </header>

                    {/* Department Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 pb-4 scrollbar-hide overflow-x-auto whitespace-nowrap">
                       <button 
                        onClick={() => setAdminFilter('All')} 
                        className={`px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                          adminFilter === 'All' ? 'bg-[#35408f] text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'
                        }`}
                       >
                         All Posts
                       </button>
                       {Object.values(FeedbackCategory).map(cat => (
                         <button 
                          key={cat}
                          onClick={() => setAdminFilter(cat)} 
                          className={`px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                            adminFilter === cat ? 'bg-[#35408f] text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'
                          }`}
                         >
                           {cat}
                         </button>
                       ))}
                    </div>

                    {/* Results Feed */}
                    <div className="grid gap-8">
                      {isAdminLoading ? (
                        <div className="bg-white py-32 rounded-[4rem] text-center border border-slate-100 flex flex-col items-center gap-6">
                           <Loader2 size={48} className="animate-spin text-[#35408f]" />
                           <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Fetching Responses...</p>
                        </div>
                      ) : filteredFeedbacks.length === 0 ? (
                        <div className="bg-white py-32 rounded-[4rem] text-center border-4 border-dashed border-slate-100 flex flex-col items-center gap-6">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                              <Building2 size={32} />
                           </div>
                           <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No recorded insights for this department.</p>
                        </div>
                      ) : (
                        filteredFeedbacks.map((f, i) => (
                          <motion.div 
                            key={f.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                            className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-8 hover:shadow-[0_20px_70px_rgba(53,64,143,0.05)] transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-[#35408f]/5 text-[#35408f] rounded-2xl flex items-center justify-center group-hover:bg-[#35408f] group-hover:text-white transition-all">
                                    {CATEGORY_ICONS[f.category]}
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-black text-[#35408f] leading-none mb-1">{f.category}</h4>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(f.createdAt).toLocaleString()} • ID: {f.id.slice(0, 8)}</p>
                                  </div>
                               </div>
                               <div className="flex flex-col items-end gap-1">
                                  <span className={`text-[11px] font-black px-4 py-1.5 rounded-full border ${
                                    f.ratings.overall >= 5 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    f.ratings.overall >= 3 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-red-50 text-red-600 border-red-100'
                                  }`}>
                                    {RATING_SCALE.find(s => s.value === f.ratings.overall)?.label}
                                  </span>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 pt-4">
                                {[
                                  { label: 'Resp', val: f.ratings.responsiveness },
                                  { label: 'Court', val: f.ratings.courtesy },
                                  { label: 'Clar', val: f.ratings.clarity },
                                  { label: 'Efic', val: f.ratings.efficiency },
                                  { label: 'Accs', val: f.ratings.accessibility },
                                  { label: 'Ovr', val: f.ratings.overall },
                                ].map((stat, sIdx) => (
                                  <div key={sIdx} className="bg-slate-50 p-4 rounded-3xl group-hover:bg-slate-100/50 transition-colors">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-[#35408f] tracking-tighter">
                                      {stat.val}
                                      <span className="text-[10px] text-slate-300 ml-0.5">/7</span>
                                    </p>
                                  </div>
                                ))}
                            </div>

                            <div className="grid lg:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                               <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core Highlights</p>
                                  </div>
                                  <p className="text-slate-700 font-medium leading-relaxed italic text-lg line-clamp-4">"{f.likedMost}"</p>
                               </div>
                               <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Improvement Data</p>
                                  </div>
                                  <p className="text-slate-700 font-medium leading-relaxed italic text-lg line-clamp-4">"{f.improvements}"</p>
                               </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                 </motion.div>
               )}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Redesigned Minimal Footer */}
      <footer className="fixed bottom-8 left-0 right-0 z-40 pointer-events-none">
          <div className="max-w-4xl mx-auto px-6 flex justify-between items-center opacity-40">
             <button 
               onClick={() => setView('admin')} 
               className="pointer-events-auto text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#35408f] transition-colors"
             >
               System Access
             </button>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Education that Works • Since 1900</p>
          </div>
      </footer>
    </div>
  );
}
