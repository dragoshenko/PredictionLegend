using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class CategoryRepository : ICategoryRepository
{
    private readonly DataContext _context;
    private readonly IMapper _mapper;

    public CategoryRepository(DataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public void AddCategory(Category category)
    {
        _context.Categories.Add(category);
    }

    public void DeleteCategory(Category category)
    {
        _context.Categories.Remove(category);
    }

    public async Task<CategoryDTO?> GetCategoryByIdAsync(int id)
    {
        return await _context.Categories
            .Where(c => c.Id == id)
            .ProjectTo<CategoryDTO>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<Category?> GetCategoryEntityByIdAsync(int id)
    {
        return await _context.Categories
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<CategoryDTO>> GetCategoriesAsync()
    {
        return await _context.Categories
            .ProjectTo<CategoryDTO>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<IEnumerable<CategoryDTO>> GetCategoryTreeAsync()
    {
        // Get only root categories (those without a parent)
        var rootCategories = await _context.Categories
            .Where(c => c.ParentCategoryId == null)
            .ProjectTo<CategoryDTO>(_mapper.ConfigurationProvider)
            .ToListAsync();

        // For each root category, get its subcategories recursively
        foreach (var category in rootCategories)
        {
            await PopulateSubcategoriesAsync(category);
        }

        return rootCategories;
    }

    private async Task PopulateSubcategoriesAsync(CategoryDTO parentCategory)
    {
        var subcategories = await _context.Categories
            .Where(c => c.ParentCategoryId == parentCategory.Id)
            .ProjectTo<CategoryDTO>(_mapper.ConfigurationProvider)
            .ToListAsync();

        if (subcategories.Any())
        {
            parentCategory.SubCategories = subcategories;

            foreach (var subcategory in subcategories)
            {
                await PopulateSubcategoriesAsync(subcategory);
            }
        }
    }

    public async Task<bool> CategoryNameExistsAsync(string name)
    {
        return await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == name.ToLower());
    }

    public async Task<bool> CategoryHasPredictionsAsync(int categoryId)
    {
        return true;
    }

    public async Task<bool> CategoryHasSubcategoriesAsync(int categoryId)
    {
        return await _context.Categories
            .AnyAsync(c => c.ParentCategoryId == categoryId);
    }

    public async Task<IEnumerable<CategoryDTO>> GetSubcategoriesAsync(int parentCategoryId)
    {
        return await _context.Categories
            .Where(c => c.ParentCategoryId == parentCategoryId)
            .ProjectTo<CategoryDTO>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<bool> CreatePredictionCategoriesByIdsAsync(int predictionId, IEnumerable<int> ids)
    {
        // get prediction categories by ids
        var categories = await _context.Categories
            .Where(c => ids.Contains(c.Id))
            .ToListAsync();
        var prediction = await _context.Predictions
            .Include(p => p.Categories)
            .FirstOrDefaultAsync(p => p.Id == predictionId);

        if (prediction == null || categories == null)
            return false;

        var predictionCategories = new List<PredictionCategory>();
        foreach (var category in categories)
        {
            predictionCategories.Add(new PredictionCategory
            {
                categoryId = category.Id,
                Category = category,
                PredictionId = predictionId,
                Prediction = prediction
            });
        }
        prediction.Categories = predictionCategories;
        await _context.PredictionCategories.AddRangeAsync(predictionCategories);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<IEnumerable<Category>> GetPredictionCategoriesByIdsAsync(int predictionId)
    {
        var categories = await _context.PredictionCategories
            .Include(pc => pc.Category)
            .Where(pc => pc.PredictionId == predictionId)
            .Select(pc => pc.Category)
            .ToListAsync();
        return categories;
    }
}