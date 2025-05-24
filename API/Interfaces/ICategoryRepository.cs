using API.DTO;
using API.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface ICategoryRepository
{
    void AddCategory(Category category);
    void DeleteCategory(Category category);
    Task<CategoryDTO?> GetCategoryByIdAsync(int id);
    Task<Category?> GetCategoryEntityByIdAsync(int id);
    Task<IEnumerable<CategoryDTO>> GetCategoriesAsync();
    Task<IEnumerable<CategoryDTO>> GetCategoryTreeAsync();
    Task<bool> CategoryNameExistsAsync(string name);
    Task<bool> CategoryHasPredictionsAsync(int categoryId);
    Task<bool> CategoryHasSubcategoriesAsync(int categoryId);
    Task<IEnumerable<CategoryDTO>> GetSubcategoriesAsync(int parentCategoryId);
    Task<bool> CreatePredictionCategoriesByIdsAsync(int predictionId, IEnumerable<int> ids);
    Task<IEnumerable<Category>> GetPredictionCategoriesByIdsAsync(int predictionId);
}