
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

  const handleDownloadAndOpenDrive = () => {
    if (!state.imageUrl) return;
    
    // 1. 이미지 다운로드 실행
    const link = document.createElement('a');
    link.href = state.imageUrl;
    link.download = `${state.recipe?.title || 'ai-recipe'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. 구글 드라이브 폴더 열기 (사용자가 업로드할 수 있도록)
    window.open(GOOGLE_DRIVE_FOLDER_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* 메인 상단 배너 이미지 */}
      <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden relative">
        <img 
          src={BANNER_IMAGE} 
          alt="Culinary Banner" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // 구글 드라이브 링크가 권한 문제로 보이지 않을 경우 고품질 요리 이미지로 대체
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000";
          }}
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl">
            셰프 나노: 스마트 키친
          </h1>
          <p className="text-white/90 text-lg md:text-xl mt-4 font-medium drop-shadow-md">
            당신의 냉장고를 미슐랭 주방으로
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 왼쪽: 입력 및 결과 섹션 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 재료 입력부 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4">재료를 입력하세요</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={state.ingredients}
                  onChange={(e) => setState(prev => ({ ...prev, ingredients: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleGetRecipe()}
                  placeholder="예: 돼지고기, 대파, 마늘"
                  className="flex-1 px-5 py-3 rounded-2xl bg-gray-100 border-none focus:ring-2 focus:ring-orange-500 transition-all text-lg"
                />
                <button
                  onClick={handleGetRecipe}
                  disabled={state.isGeneratingRecipe}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {state.isGeneratingRecipe ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : "레시피 추천받기"}
                </button>
              </div>
              {state.error && <p className="text-red-500 mt-2 text-sm">{state.error}</p>}
            </div>

            {/* 레시피 텍스트 출력 영역 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">레시피 결과</h3>
                {state.recipe && (
                   <button 
                    onClick={() => window.print()}
                    className="text-orange-500 text-sm font-bold flex items-center gap-1 hover:underline"
                   >
                     프린트하기 🖨️
                   </button>
                )}
              </div>
              {state.isGeneratingRecipe ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 bg-gray-100 rounded-lg w-1/2"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-5/6"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
                </div>
              ) : state.recipe ? (
                <article className="prose prose-orange max-w-none">
                  <h2 className="text-3xl font-black text-gray-800 mb-6">{state.recipe.title}</h2>
                  <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                    {state.recipe.content}
                  </div>
                </article>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                  <p className="text-lg">재료를 입력하고 버튼을 눌러보세요.</p>
                </div>
              )}
            </div>

            {/* 메인 생성 이미지 영역 (빈 상태/결과 상태) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              {state.isGeneratingImage ? (
                <div className="text-center p-10">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500 font-medium">AI가 요리 이미지를 생성하고 있습니다...</p>
                </div>
              ) : state.imageUrl ? (
                <div className="w-full">
                  <div className="relative group">
                    <img src={state.imageUrl} alt="Result" className="w-full h-auto object-cover" />
                    
                    {/* 다운로드 및 저장 버튼 오버레이 */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={handleDownloadAndOpenDrive}
                        className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-xl text-sm font-bold shadow-xl hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        📥 다운로드 후 드라이브에 저장
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase">이미지 AI 편집</p>
                         <p className="text-xs text-gray-500 mt-1">드라이브 폴더: <a href={GOOGLE_DRIVE_FOLDER_URL} target="_blank" className="text-orange-500 underline">열기</a></p>
                       </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={state.editPrompt}
                        onChange={(e) => setState(prev => ({ ...prev, editPrompt: e.target.value }))}
                        placeholder="예: '접시를 하얀색으로 바꿔줘', '더 밝게 해줘'"
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                      />
                      <button 
                        onClick={handleEditImage}
                        disabled={state.isEditingImage}
                        className="bg-gray-800 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors"
                      >
                        {state.isEditingImage ? "..." : "편집"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-300 p-10 text-center">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p>완성된 요리의 모습이 여기에 나타납니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 추천 이미지 섹션 */}
          <div className="space-y-6">
            <div className="sticky top-8">
              <div className="bg-white p-3 rounded-3xl shadow-md border border-gray-100 overflow-hidden group">
                <div className="relative">
                  <img 
                    src={DEFAULT_FOOD_IMAGE} 
                    alt="Featured" 
                    className="w-full h-72 md:h-96 lg:h-[500px] object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                    <div>
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">BEST RECIPE</span>
                      <h4 className="text-white text-xl font-bold">프리미엄 LA 갈비</h4>
                      <p className="text-white/80 text-sm">특제 양념으로 완성하는 정통의 맛</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-orange-500">💡</span> 요리 팁
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  생성된 이미지가 마음에 드신다면 <strong>'다운로드 후 드라이브에 저장'</strong> 버튼을 눌러보세요. 이미지 파일이 다운로드되며 지정하신 구글 드라이브 폴더가 새 창으로 열립니다.
                </p>
                <a 
                  href={GOOGLE_DRIVE_FOLDER_URL} 
                  target="_blank" 
                  className="mt-4 block w-full text-center py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  구글 드라이브 폴더 바로가기
                </a>
              </div>
            </div>
          </div>

        </div>

        <footer className="mt-16 text-center text-gray-400 text-sm pb-10">
          &copy; 2024 Chef Nano. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default App;
