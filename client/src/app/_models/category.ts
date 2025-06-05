// Add this interface extension to your category model or create a new interface
// client/src/app/_models/category.ts - ADD TO EXISTING FILE

export interface Category {
  id: number;
  name: string;
  description?: string;
  iconName?: string;
  colorCode?: string;
  parentCategoryId?: number;
  subCategories?: Category[];
  expanded?: boolean;

  // Add these properties for home page display
  displayIcon?: string;
  displayColor?: string;
}
