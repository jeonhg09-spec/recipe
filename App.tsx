
import React, { useState } from 'react';
import { generateRecipe, generateFoodImage, editFoodImage } from './services/geminiService';
import { AppState, RecipeResult } from './types';
import { DEFAULT_FOOD_IMAGE, BANNER_IMAGE } from './assets';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    ingredients: '',
    recipe: null,
    imageUrl: null,
    isGeneratingRecipe: false,
    isGeneratingImage: false,
    isEditingImage: false,
    editPrompt: '',
    error: null,
  });

  const [showGuide, setShowGuide] = useState(false);

  const GOOGLE_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1hJfNLbEMKnLaV2QqtuJombf_G5Mn0rkl";

  const handleGetRecipe = async () => {
    if (!state.ingredients.trim()) {
      setState(prev => ({ ...prev, error: '재료를 입력해주세요!' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isGeneratingRecipe: true, 
      isGeneratingImage: true, 
      error: null,
      recipe: null,
      imageUrl: null 
    }));

    try {
      const recipeResult: RecipeResult = await generateRecipe(state.ingredients);
      setState(prev => ({ ...prev, recipe: recipeResult, isGeneratingRecipe: false }));

      const imageUrl = await generateFoodImage(recipeResult.title);
      setState(prev => ({ ...prev, imageUrl, isGeneratingImage: false }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        error: '레시피를 생성하는 중 오류가 발생했습니다.', 
        isGeneratingRecipe: false, 
        isGeneratingImage: false 
      }));
    }
  };

  const handleEditImage = async () => {
    if (!state.imageUrl || !state.editPrompt.trim()) return;
    setState(prev => ({ ...prev, isEditingImage: true, error: null }));
    try {
      const newImageUrl = await editFoodImage(state.imageUrl, state.editPrompt);
      if (newImageUrl) {
        setState(prev => ({ ...prev, imageUrl: newImageUrl, editPrompt: '', isEditingImage: false }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: '이미지 편집 실패', isEditingImage: false }));
    }
  };

  const handleDownloadAndOpenDrive = async () => {
    if (!state.imageUrl) return;
    
    try {
      const fileName = `${state.recipe?.title || 'ai-recipe'}.png`;
      
      // 1. 이미지 데이터 가져오기 (Blob 생성)
      const response = await fetch(state.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      // 2. 브라우저 공유 기능 시도 (모바일 등에서 드라이브로 직접 전송 가능)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '레시피 이미지 저장',
          text: '생성된 요리 이미지를 구글 드라이브에 업로드하세요.'
        });
      } else {
        // 3. PC 환경: 일반 다운로드 실행
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // 4. 드라이브 폴더 열기 및 안내 가이드 표시
      window.open(GOOGLE_DRIVE_FOLDER_URL, '_blank');
      setShowGuide(true);
      setTimeout(() => setShowGuide(false), 8000);
    } catch (err) {
      console.error("저장 중 오류 발생:", err);
      alert("이미지 저장 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* 가이드 메시지 (Toast) */}
      {showGuide && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-orange-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <p className="font-bold">이미지가 다운로드되었습니다! 새 창으로 열린 드라이브 폴더로 파일을 끌어다 놓으세요.</p>
        </div>
      )}

      {/* 메인 상단 배너 이미지 */}
      <div className="w-full h-56 md:h-72 lg:h-96 overflow-hidden relative border-b-4 border-orange-500">
        <img 
          src={BANNER_IMAGE} 
          alt="Culinary Banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tight">
            셰프 나노
          </h1>
          <div className="w-20 h-1 bg-orange-500 my-4"></div>
          <p className="text-white/90 text-xl md:text-2xl font-medium drop-shadow-md">
            인공지능이 제안하는 미식의 세계
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-8">
            {/* 재료 입력부 */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <span className="text-orange-500">🥕</span> 오늘 어떤 재료가 있나요?
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={state.ingredients}
                  onChange={(e) => setState(prev => ({ ...prev, ingredients: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleGetRecipe()}
                  placeholder="예: 삼겹살, 김치, 양파..."
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white transition-all text-lg outline-none"
                />
                <button
                  onClick={handleGetRecipe}
                  disabled={state.isGeneratingRecipe}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-10 rounded-2xl shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg active:scale-95"
                >
                  {state.isGeneratingRecipe ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : "레시피 생성"}
                </button>
              </div>
            </div>

            {/* 레시피 결과 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">Recipe Card</h3>
                {state.recipe && (
                   <button 
                    onClick={() => window.print()}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                   >
                     PRINT 🖨️
                   </button>
                )}
              </div>
              {state.isGeneratingRecipe ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-10 bg-gray-100 rounded-xl w-2/3"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-4/5"></div>
                  </div>
                </div>
              ) : state.recipe ? (
                <article className="prose prose-orange max-w-none">
                  <h2 className="text-4xl font-black text-gray-900 mb-8 border-l-8 border-orange-500 pl-6 leading-tight">
                    {state.recipe.title}
                  </h2>
                  <div className="text-gray-700 leading-relaxed text-xl whitespace-pre-wrap bg-orange-50/30 p-8 rounded-3xl border border-orange-100">
                    {state.recipe.content}
                  </div>
                </article>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                  <div className="text-7xl mb-6 opacity-20">🥗</div>
                  <p className="text-xl font-medium">냉장고 속 재료로 마법을 부려보세요.</p>
                </div>
              )}
            </div>

            {/* 메인 생성 이미지 */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
              {state.isGeneratingImage ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-8 border-orange-100 rounded-full"></div>
                    <div className="w-20 h-20 border-8 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                  </div>
                  <p className="mt-8 text-xl font-bold text-gray-600">AI가 최고의 플레이팅을 준비하고 있습니다...</p>
                </div>
              ) : state.imageUrl ? (
                <div className="w-full flex flex-col">
                  <div className="relative group overflow-hidden">
                    <img src={state.imageUrl} alt="Result" className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                       <p className="text-white text-lg font-bold">✨ AI가 생성한 실제 이미지입니다.</p>
                    </div>

                    <div className="absolute top-6 right-6 flex flex-col gap-3">
                      <button 
                        onClick={handleDownloadAndOpenDrive}
                        className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-base font-black shadow-2xl hover:bg-orange-600 transition-all flex items-center gap-2 transform active:scale-95 border-2 border-white/20"
                      >
                        📥 구글 드라이브에 저장하기
                      </button>
                    </div>
                  </div>

                  <div className="p-10 bg-white border-t border-gray-100">
                    <div className="flex flex-col mb-6">
                       <span className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Image Editor</span>
                       <p className="text-sm text-gray-500">이미지가 마음에 들지 않나요? 명령을 통해 수정해 보세요.</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={state.editPrompt}
                        onChange={(e) => setState(prev => ({ ...prev, editPrompt: e.target.value }))}
                        placeholder="예: '조명을 더 밝게', '배경에 와인병 추가'..."
                        className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-300 outline-none text-base"
                      />
                      <button 
                        onClick={handleEditImage}
                        disabled={state.isEditingImage}
                        className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all disabled:opacity-50"
                      >
                        {state.isEditingImage ? "..." : "수정"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-200 py-32">
                  <div className="text-9xl mb-6 grayscale opacity-30">📷</div>
                  <p className="text-lg font-bold">완성된 요리의 모습이 여기에 나타납니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 사이드바 */}
          <div className="space-y-8">
            <div className="sticky top-8 space-y-8">
              <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden group">
                <div className="relative overflow-hidden rounded-[2rem]">
                  <img 
                    src={DEFAULT_FOOD_IMAGE} 
                    alt="Best Recipe" 
                    className="w-full h-80 object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                    <div>
                      <span className="bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full mb-3 inline-block tracking-tighter">TODAY'S PICK</span>
                      <h4 className="text-white text-2xl font-black mb-1">프리미엄 LA 갈비</h4>
                      <p className="text-white/70 text-sm">특제 소스로 완성하는 명품의 맛</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-100 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-black text-2xl mb-4 flex items-center gap-2">
                    <span>💡</span> 저장 가이드
                  </h4>
                  <p className="text-orange-50 text-base leading-relaxed mb-6 font-medium">
                    버튼을 누르면 이미지가 PC에 저장되고 구글 드라이브 폴더가 열립니다. 다운로드된 파일을 드라이브 창으로 <strong>드래그</strong>하여 간편하게 업로드하세요!
                  </p>
                  <a 
                    href={GOOGLE_DRIVE_FOLDER_URL} 
                    target="_blank" 
                    className="block w-full text-center py-4 bg-white text-orange-600 rounded-2xl text-sm font-black hover:bg-orange-50 transition-colors shadow-lg"
                  >
                    드라이브 폴더 열기
                  </a>
                </div>
                {/* 배경 장식 */}
                <div className="absolute -right-4 -bottom-4 text-9xl opacity-10 font-black">SAVE</div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Powered by</p>
                <div className="flex justify-center items-center gap-4 grayscale opacity-50">
                  <span className="font-black text-lg">Google Gemini</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <footer className="mt-20 text-center text-gray-400 text-sm pb-10">
          <p className="font-bold">© 2024 Chef Nano. Your personal AI culinary assistant.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
