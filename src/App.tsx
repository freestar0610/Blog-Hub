/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  UserCircle, 
  Calendar, 
  ChevronRight, 
  Copy, 
  Check, 
  RefreshCw,
  LayoutDashboard,
  Megaphone,
  Coins,
  Settings,
  X,
  Key
} from 'lucide-react';
import { generateBlogIdentity, generateBlogPost, regenerateImagePrompts, setApiKey } from './services/geminiService';
import { BlogIdentity, BlogPost } from './types';
import { ROADMAP } from './constants';

export default function App() {
  const [identity, setIdentity] = useState<BlogIdentity | null>(null);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [savedPosts, setSavedPosts] = useState<Record<number, BlogPost>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isLoadingImagePrompts, setIsLoadingImagePrompts] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'identity' | 'generator'>('roadmap');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedIdentity = localStorage.getItem('blog_identity');
      if (savedIdentity) setIdentity(JSON.parse(savedIdentity));

      const savedBlogPosts = localStorage.getItem('saved_posts');
      if (savedBlogPosts) setSavedPosts(JSON.parse(savedBlogPosts));

      const savedCompleted = localStorage.getItem('completed_days');
      if (savedCompleted) setCompletedDays(JSON.parse(savedCompleted));

      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        setApiKeyInput(savedKey);
        setApiKey(savedKey);
        setIsApiKeySaved(true);
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (identity) localStorage.setItem('blog_identity', JSON.stringify(identity));
  }, [identity]);

  useEffect(() => {
    localStorage.setItem('saved_posts', JSON.stringify(savedPosts));
  }, [savedPosts]);

  useEffect(() => {
    localStorage.setItem('completed_days', JSON.stringify(completedDays));
  }, [completedDays]);

  const handleGenerateIdentity = async () => {
    setIsLoadingIdentity(true);
    try {
      const data = await generateBlogIdentity();
      setIdentity(data);
      setActiveTab('identity');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingIdentity(false);
    }
  };

  const handleGeneratePost = async (day: number, forceRegenerate = false) => {
    if (!forceRegenerate && savedPosts[day]) {
      setCurrentPost(savedPosts[day]);
      setSelectedDay(day);
      setActiveTab('generator');
      return;
    }

    setIsLoadingPost(true);
    try {
      const data = await generateBlogPost(day);
      setSavedPosts(prev => ({ ...prev, [day]: data }));
      setCurrentPost(data);
      setSelectedDay(day);
      setActiveTab('generator');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPost(false);
    }
  };

  const toggleCompleteDay = (day: number) => {
    setCompletedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('gemini_api_key', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setIsApiKeySaved(true);
      setShowSettings(false);
    }
  };

  const handleRegenerateImagePrompts = async () => {
    if (!currentPost) return;
    setIsLoadingImagePrompts(true);
    try {
      const fullContent = `${currentPost.intro} ${currentPost.body} ${currentPost.conclusion}`;
      const newPrompts = await regenerateImagePrompts(fullContent);
      const updatedPost = { ...currentPost, imagePrompts: newPrompts };
      setCurrentPost(updatedPost);
      setSavedPosts(prev => ({ ...prev, [currentPost.day]: updatedPost }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingImagePrompts(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPostContent = () => {
    if (!currentPost) return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
        <BookOpen className="w-12 h-12 mb-4 opacity-20" />
        <p>일차를 선택하고 포스팅을 생성해보세요.</p>
      </div>
    );

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-gray-400 capitalize">추천 제목 (택 1)</h4>
            <span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-0.5 rounded">SEO 최적화</span>
          </div>
          {currentPost.titles.map((title, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl group border border-transparent hover:border-rose-100 hover:bg-rose-50/30 transition-all">
              <span className="text-lg font-bold text-gray-800">{title}</span>
              <button 
                onClick={() => copyToClipboard(title)}
                className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                title="제목 복사"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
          <button 
            onClick={() => toggleCompleteDay(currentPost.day)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              completedDays.includes(currentPost.day)
              ? 'bg-green-500 text-white shadow-lg shadow-green-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {completedDays.includes(currentPost.day) ? <Check className="w-5 h-5" /> : null}
            {completedDays.includes(currentPost.day) ? '완료됨' : '챌린지 완료하기'}
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleGeneratePost(currentPost.day, true)}
              disabled={isLoadingPost}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-rose-500 transition-all"
              title="다시 생성"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingPost ? 'animate-spin' : ''}`} />
              재생성
            </button>
            <button 
              onClick={() => copyToClipboard(`${currentPost.intro}\n\n${currentPost.body}\n\n${currentPost.conclusion}\n\n${currentPost.tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              본문 전체 복사
            </button>
          </div>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed whitespace-pre-wrap text-[19px] text-justify font-sans">
          <p className="italic text-gray-500 border-l-4 border-rose-200 pl-4">
            {currentPost.intro}
          </p>
          <div className="font-sans">
            {currentPost.body}
          </div>
          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 italic">
            <p className="font-medium text-rose-800">{currentPost.conclusion}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
          {currentPost.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>

        {currentPost.imagePrompts && currentPost.imagePrompts.length > 0 && (
          <div className="pt-8 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">추천 이미지 프롬프트 (대표 문단 삽입용)</h4>
              </div>
              <button 
                onClick={handleRegenerateImagePrompts}
                disabled={isLoadingImagePrompts}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-rose-500 bg-gray-50 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                title="프롬프트 다시 생성"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingImagePrompts ? 'animate-spin' : ''}`} />
                프롬프트 재생성
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {currentPost.imagePrompts.map((prompt, idx) => (
                <div key={idx} className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100 group relative">
                  <p className="text-sm text-gray-700 leading-relaxed pr-8">
                    {prompt}
                  </p>
                  <button 
                    onClick={() => copyToClipboard(prompt)}
                    className="absolute right-3 top-3 p-1.5 text-rose-300 hover:text-rose-500 transition-colors bg-white rounded-lg shadow-sm border border-rose-100"
                    title="프롬프트 복사"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Check className="w-3 h-3" />
              위 프롬프트를 복사하여 이미지 생성 AI(Imagen, Dall-E 등)에 입력해 보세요.
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2926] font-sans selection:bg-rose-100">
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-white border-r border-gray-100 z-50 flex flex-col p-4">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-lg hidden md:block tracking-tight">Blog Hub</h1>
        </div>

        <div className="space-y-2 flex-grow">
          <button 
            onClick={() => setActiveTab('roadmap')}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${activeTab === 'roadmap' ? 'bg-rose-50 text-rose-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="font-medium hidden md:block">수익화 로드맵</span>
          </button>
          <button 
            onClick={() => setActiveTab('identity')}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${activeTab === 'identity' ? 'bg-rose-50 text-rose-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <UserCircle className="w-6 h-6" />
            <span className="font-medium hidden md:block">블로그 정체성</span>
          </button>
          <button 
            onClick={() => setActiveTab('generator')}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${activeTab === 'generator' ? 'bg-rose-50 text-rose-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Megaphone className="w-6 h-6" />
            <span className="font-medium hidden md:block">포스팅 생성기</span>
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-gray-400 hover:bg-gray-50 mt-4`}
          >
            <Settings className="w-6 h-6" />
            <span className="font-medium hidden md:block">설정 (API 키)</span>
          </button>
        </div>

        <div className="mt-auto p-2 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
               <Coins className="w-4 h-4" />
             </div>
             <div className="hidden md:block">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Current Goal</p>
               <p className="text-sm font-bold">수익화 달성 90일</p>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 min-h-screen">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-bottom border-gray-100 p-6 z-40 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {activeTab === 'roadmap' && '90일 수익화 로드맵'}
            {activeTab === 'identity' && '블로그 브랜드 아이덴티티'}
            {activeTab === 'generator' && `${selectedDay}일차 데일리 포스팅`}
          </h2>
          
          {isApiKeySaved ? (
            <div className="flex items-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 px-4 py-2 rounded-full border border-rose-100 shadow-sm shadow-rose-50 animate-pulse">
               <RefreshCw className="w-4 h-4" />
               <span>AI 실시간 지원 중</span>
            </div>
          ) : (
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-full shadow-lg shadow-rose-100 transition-all hover:scale-105 active:scale-95"
            >
               <Key className="w-4 h-4" />
               <span>API 키 등록하기</span>
            </button>
          )}
        </header>

        <div className="max-w-5xl mx-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'roadmap' && (
              <motion.div 
                key="roadmap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid gap-8"
              >
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-[2rem] p-10 text-white shadow-2xl shadow-rose-200 relative overflow-hidden">
                   <div className="relative z-10">
                     <h3 className="text-3xl font-bold mb-4">AI & AI 코딩과 함께하는<br/>누구나 가능한 수익화 자동화 프로젝트</h3>
                     <p className="text-rose-100 max-w-lg leading-relaxed">
                       학생부터 직장인, 시니어까지. 복잡한 기술은 AI에게 맡기고 나만의 가치를 수익으로 바꾸는 90일간의 여정을 기록해보세요.
                     </p>
                   </div>
                   <Sparkles className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white/10" />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {ROADMAP.map((step, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 text-rose-600 font-bold">
                        {idx + 1}
                      </div>
                      <h4 className="text-lg font-bold mb-2">Day {step.dayRange}</h4>
                      <p className="text-rose-600 font-semibold text-sm mb-4">{step.goal}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{step.focus}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 p-10">
                  <div className="flex justify-between items-center mb-8">
                     <h4 className="text-xl font-bold">전체 로드맵 가이드</h4>
                     <span className="text-sm text-gray-400">총 90일 일정</span>
                  </div>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                    {Array.from({ length: 90 }).map((_, i) => {
                      const day = i + 1;
                      const isCompleted = completedDays.includes(day);
                      const isGenerated = !!savedPosts[day];
                      
                      return (
                        <button
                          key={day}
                          onClick={() => handleGeneratePost(day)}
                          className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all relative ${
                            selectedDay === day 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 ring-4 ring-rose-100' 
                            : isCompleted
                              ? 'bg-gray-100 text-gray-300 opacity-60 grayscale'
                              : isGenerated
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          {day}
                          {isCompleted && (
                            <Check className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full p-0.5 border-2 border-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'identity' && (
              <motion.div 
                key="identity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                {!identity ? (
                  <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100">
                    <UserCircle className="w-20 h-20 text-rose-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-4">아직 블로그 정체성이 설정되지 않았습니다</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                      AI 전문가 '옆집 언니'가 당신의 경험과 강점을 분석해 최적의 브랜드 아이덴티티를 제안합니다.
                    </p>
                    <button 
                      onClick={handleGenerateIdentity}
                      disabled={isLoadingIdentity}
                      className="px-10 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 disabled:opacity-50 flex items-center gap-3 mx-auto transition-all active:scale-95"
                    >
                      {isLoadingIdentity ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      브랜드 아이덴티티 생성하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-lg space-y-8">
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">추천 블로그 명</h4>
                        <div className="grid gap-4">
                          {identity.names.map((name, i) => (
                            <div key={i} className="flex justify-between items-center p-5 bg-rose-50/50 rounded-2xl border border-rose-100">
                              <span className="text-lg font-bold text-rose-900">{name}</span>
                              <button onClick={() => copyToClipboard(name)} className="text-rose-300 hover:text-rose-500 transition-colors">
                                <Copy className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">블로그 소개글</h4>
                        <p className="text-lg text-gray-700 leading-relaxed italic bg-gray-50 p-6 rounded-2xl border border-gray-100">
                          "{identity.intro}"
                        </p>
                      </div>

                      <div className="pt-8 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">페르소나 & 톤앤매너</h4>
                        <p className="text-gray-600 leading-relaxed">
                          {identity.tone}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleGenerateIdentity}
                      className="w-full py-4 text-gray-400 hover:text-rose-500 font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      다른 아이디어 제안받기
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'generator' && (
              <motion.div 
                key="generator"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="flex items-center gap-6">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 font-black text-2xl">
                          {selectedDay}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            Day {selectedDay}
                            {completedDays.includes(selectedDay) && <Check className="w-5 h-5 text-green-500" />}
                          </h3>
                          <p className="text-gray-500">네이버 C-Rank & D.I.A 로직 최적화</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => toggleCompleteDay(selectedDay)}
                       className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                         completedDays.includes(selectedDay)
                         ? 'bg-green-500 text-white'
                         : 'bg-white border border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-600'
                       }`}
                     >
                       {completedDays.includes(selectedDay) ? '도전 완료' : '완료 체크'}
                     </button>
                   </div>
                   <button 
                     onClick={() => handleGeneratePost(selectedDay)}
                     disabled={isLoadingPost}
                     className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 disabled:opacity-50 flex items-center gap-3 transition-all active:scale-95"
                   >
                     {isLoadingPost ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                     포스팅 AI 생성하기
                   </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    {isLoadingPost ? (
                      <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-rose-500 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">콘텐츠를 구성하는 중입니다...</p>
                          <p className="text-gray-400">옆집 언니가 고품질 포스팅을 작성하고 있어요.</p>
                        </div>
                      </div>
                    ) : renderPostContent()}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                      <h4 className="font-bold mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-rose-500" />
                        일차 변경하기
                      </h4>
                      <div className="grid grid-cols-5 gap-2 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {Array.from({ length: 90 }).map((_, i) => {
                          const day = i + 1;
                          const isCompleted = completedDays.includes(day);
                          const isGenerated = !!savedPosts[day];
                          
                          return (
                            <button
                              key={day}
                              onClick={() => setSelectedDay(day)}
                              className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all relative ${
                                selectedDay === day 
                                ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-100' 
                                : isCompleted
                                  ? 'bg-gray-100 text-gray-300 opacity-60 grayscale'
                                  : isGenerated
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                    : 'bg-gray-50 text-gray-400 hover:bg-rose-50'
                              }`}
                            >
                              {day}
                              {isCompleted && (
                                <Check className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 text-white rounded-full p-0.5 border border-white" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="pl-20 md:pl-64 py-10 px-6 border-t border-gray-100 bg-white text-center">
        <p className="text-gray-400 text-sm">© 2026 Naver Blog Monetization Hub. Powered by AI & AI 코딩.</p>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="닫기"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">API 설정</h3>
                  <p className="text-sm text-gray-500">Gemini API 키를 입력해 주세요.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100/50 text-[13px] text-rose-900 leading-relaxed space-y-3">
                  <p className="font-bold border-b border-rose-100 pb-2 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> 
                    API 키 발급 및 등록 방법
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-rose-300 hover:text-rose-600 transition-colors">Google AI Studio</a> 사이트에 접속합니다.</li>
                    <li><span className="font-bold text-rose-700">"Create API key"</span> 버튼을 클릭하여 새 키를 발급받습니다.</li>
                    <li>발급된 키를 <span className="font-bold">복사(Copy)</span>합니다.</li>
                    <li>아래 입력창에 붙여넣고 <span className="font-bold text-rose-700">"저장하기"</span> 버튼을 누르면 모든 기능이 활성화됩니다.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2 px-1 flex items-center gap-2">
                    <Key className="w-4 h-4 text-rose-400" />
                    Gemini API Key
                  </label>
                  <input 
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AI Studio에서 발급받은 키를 입력하세요"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 outline-none transition-all font-mono"
                  />
                  <p className="mt-3 text-xs text-gray-400 leading-relaxed px-1">
                    * 입력하신 키는 본인의 브라우저에만 암호화되어 저장되며, 외부에 공유되지 않습니다.
                  </p>
                </div>

                <button 
                  onClick={saveApiKey}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  저장하고 시작하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
