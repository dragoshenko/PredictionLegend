using API.DTO;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class CategoryController : BaseAPIController
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CategoryController(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDTO>>> GetCategories()
    {
        var categories = await _unitOfWork.CategoryRepository.GetCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDTO>> GetCategory(int id)
    {
        var category = await _unitOfWork.CategoryRepository.GetCategoryByIdAsync(id);
        
        if (category == null)
            return NotFound("Category not found");
            
        return Ok(category);
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost]
    public async Task<ActionResult<CategoryDTO>> CreateCategory(CreateCategoryDTO createCategoryDTO)
    {
        // Check if category with the same name already exists
        if (await _unitOfWork.CategoryRepository.CategoryNameExistsAsync(createCategoryDTO.Name))
            return BadRequest("A category with this name already exists");
            
        // Create new category entity
        var category = new Category
        {
            Name = createCategoryDTO.Name,
            Description = createCategoryDTO.Description!,
            IconName = createCategoryDTO.IconName!,
            ColorCode = createCategoryDTO.ColorCode!,
            ParentCategoryId = createCategoryDTO.ParentCategoryId,
        };
        
        _unitOfWork.CategoryRepository.AddCategory(category);
        
        if (await _unitOfWork.Complete())
        {
            return Ok(_mapper.Map<CategoryDTO>(category));
        }
        
        return BadRequest("Failed to create category");
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateCategory(int id, UpdateCategoryDTO updateCategoryDTO)
    {
        var category = await _unitOfWork.CategoryRepository.GetCategoryEntityByIdAsync(id);
        
        if (category == null)
            return NotFound("Category not found");
            
        // Check if updating name and if it already exists
        if (!string.IsNullOrEmpty(updateCategoryDTO.Name) && 
            updateCategoryDTO.Name != category.Name && 
            await _unitOfWork.CategoryRepository.CategoryNameExistsAsync(updateCategoryDTO.Name))
            return BadRequest("A category with this name already exists");
            
        // Update category properties
        if (!string.IsNullOrEmpty(updateCategoryDTO.Name))
            category.Name = updateCategoryDTO.Name;
            
        if (updateCategoryDTO.Description != null)
            category.Description = updateCategoryDTO.Description;
            
        if (updateCategoryDTO.IconName != null)
            category.IconName = updateCategoryDTO.IconName;
            
        if (updateCategoryDTO.ColorCode != null)
            category.ColorCode = updateCategoryDTO.ColorCode;
            
        if (updateCategoryDTO.ParentCategoryId != null)
            category.ParentCategoryId = updateCategoryDTO.ParentCategoryId;
            
        if (await _unitOfWork.Complete())
            return NoContent();
            
        return BadRequest("Failed to update category");
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCategory(int id)
    {
        var category = await _unitOfWork.CategoryRepository.GetCategoryEntityByIdAsync(id);
        
        if (category == null)
            return NotFound("Category not found");
            
        // Check if category has predictions
        if (await _unitOfWork.CategoryRepository.CategoryHasPredictionsAsync(id))
            return BadRequest("Cannot delete category with associated predictions");
            
        // Check if category has subcategories
        if (await _unitOfWork.CategoryRepository.CategoryHasSubcategoriesAsync(id))
            return BadRequest("Cannot delete category with subcategories");
            
        _unitOfWork.CategoryRepository.DeleteCategory(category);
        
        if (await _unitOfWork.Complete())
            return Ok();
            
        return BadRequest("Failed to delete category");
    }
    
    [HttpGet("tree")]
    public async Task<ActionResult<IEnumerable<CategoryDTO>>> GetCategoryTree()
    {
        var categories = await _unitOfWork.CategoryRepository.GetCategoryTreeAsync();
        return Ok(categories);
    }
}