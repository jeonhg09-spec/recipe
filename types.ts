
export interface RecipeResult {
  title: string;
  content: string;
}

export interface AppState {
  ingredients: string;
  recipe: RecipeResult | null;
  imageUrl: string | null;
  isGeneratingRecipe: boolean;
  isGeneratingImage: boolean;
  isEditingImage: boolean;
  editPrompt: string;
  error: string | null;
}
