export interface Category {
  id: number;
  name: string;
  description?: string;
  iconName?: string;
  colorCode?: string;
  parentCategoryId?: number;
  subCategories?: Category[];
  expanded?: boolean;
}
