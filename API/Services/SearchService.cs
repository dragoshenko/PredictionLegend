using System.Linq.Expressions;
using API.DTO;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class SearchService : ISearchService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SearchService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ActionResult<PaginatedResponse<PredictionDTO>>> SearchPredictionsAsync(PredictionSearchDTO searchDto, PaginationParams paginationParams)
    {
        try
        {
            // This would require a more sophisticated search implementation
            // For now, let's create a basic implementation
            var predictions = await _unitOfWork.PredictionRepository.GetPredictionsByUserIdAsync(
                searchDto.UserId ?? 0, 
                includeUser: true, 
                includePostRanks: true, 
                includePostBingos: true, 
                includePostBrackets: true
            );

            var filteredPredictions = predictions.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(searchDto.SearchTerm))
            {
                filteredPredictions = filteredPredictions.Where(p => 
                    p.Title.Contains(searchDto.SearchTerm) || 
                    (p.Description != null && p.Description.Contains(searchDto.SearchTerm)));
            }

            if (searchDto.PredictionType.HasValue)
            {
                filteredPredictions = filteredPredictions.Where(p => p.PredictionType == searchDto.PredictionType.Value);
            }

            if (searchDto.PrivacyType.HasValue)
            {
                filteredPredictions = filteredPredictions.Where(p => p.PrivacyType == searchDto.PrivacyType.Value);
            }

            if (searchDto.IsActive.HasValue)
            {
                filteredPredictions = filteredPredictions.Where(p => p.IsActive == searchDto.IsActive.Value);
            }

            if (searchDto.IsDraft.HasValue)
            {
                filteredPredictions = filteredPredictions.Where(p => p.IsDraft == searchDto.IsDraft.Value);
            }

            if (searchDto.CreatedAfter.HasValue)
            {
                filteredPredictions = filteredPredictions.Where(p => p.CreatedAt >= searchDto.CreatedAfter.Value);
            }

            if (searchDto.CreatedBefore.HasValue)
            {
                filteredPredictions = filteredPredictions.Where(p => p.CreatedAt <= searchDto.CreatedBefore.Value);
            }

            // Apply sorting
            filteredPredictions = searchDto.SortBy?.ToLower() switch
            {
                "title" => searchDto.SortDescending ? 
                    filteredPredictions.OrderByDescending(p => p.Title) : 
                    filteredPredictions.OrderBy(p => p.Title),
                "lastmodified" => searchDto.SortDescending ? 
                    filteredPredictions.OrderByDescending(p => p.LastModified) : 
                    filteredPredictions.OrderBy(p => p.LastModified),
                _ => searchDto.SortDescending ? 
                    filteredPredictions.OrderByDescending(p => p.CreatedAt) : 
                    filteredPredictions.OrderBy(p => p.CreatedAt)
            };

            var totalItems = filteredPredictions.Count();
            var items = filteredPredictions
                .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .ToList();

            var predictionDTOs = _mapper.Map<List<PredictionDTO>>(items);

            var response = new PaginatedResponse<PredictionDTO>
            {
                Items = predictionDTOs,
                TotalItems = totalItems,
                PageNumber = paginationParams.PageNumber,
                PageSize = paginationParams.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalItems / paginationParams.PageSize),
                HasNext = paginationParams.PageNumber * paginationParams.PageSize < totalItems,
                HasPrevious = paginationParams.PageNumber > 1
            };

            return new OkObjectResult(response);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error searching predictions: {ex.Message}");
        }
    }

    public async Task<ActionResult<PaginatedResponse<DiscussionPostDTO>>> SearchDiscussionPostsAsync(string? searchTerm, string? tag, PaginationParams paginationParams)
    {
        try
        {
            // Implementation would require IDiscussionRepository methods
            // Placeholder implementation
            var response = new PaginatedResponse<DiscussionPostDTO>
            {
                Items = new List<DiscussionPostDTO>(),
                TotalItems = 0,
                PageNumber = paginationParams.PageNumber,
                PageSize = paginationParams.PageSize,
                TotalPages = 0,
                HasNext = false,
                HasPrevious = false
            };

            return new OkObjectResult(response);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error searching discussion posts: {ex.Message}");
        }
    }

    public async Task<ActionResult<PaginatedResponse<TeamDTO>>> SearchTeamsAsync(string? searchTerm, int? userId, PaginationParams paginationParams)
    {
        try
        {
            List<Team> teams;
            
            if (userId.HasValue)
            {
                teams = await _unitOfWork.TeamRepository.GetUserTeamsAsync(userId.Value);
            }
            else
            {
                teams = await _unitOfWork.TeamRepository.GetAllTeamsAsync();
            }

            var filteredTeams = teams.AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                filteredTeams = filteredTeams.Where(t => 
                    t.Name.Contains(searchTerm) || 
                    (t.Description != null && t.Description.Contains(searchTerm)));
            }

            var totalItems = filteredTeams.Count();
            var items = filteredTeams
                .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .ToList();

            var teamDTOs = _mapper.Map<List<TeamDTO>>(items);

            var response = new PaginatedResponse<TeamDTO>
            {
                Items = teamDTOs,
                TotalItems = totalItems,
                PageNumber = paginationParams.PageNumber,
                PageSize = paginationParams.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalItems / paginationParams.PageSize),
                HasNext = paginationParams.PageNumber * paginationParams.PageSize < totalItems,
                HasPrevious = paginationParams.PageNumber > 1
            };

            return new OkObjectResult(response);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error searching teams: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<string>>> GetPopularTagsAsync(int count = 10)
    {
        try
        {
            // This would require querying the database for popular tags
            // Placeholder implementation
            var popularTags = new List<string>
            {
                "sports", "entertainment", "technology", "politics", "science", 
                "gaming", "movies", "music", "finance", "health"
            };

            return new OkObjectResult(popularTags.Take(count).ToList());
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error getting popular tags: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<CategoryDTO>>> GetPopularCategoriesAsync(int count = 10)
    {
        try
        {
            var categories = await _unitOfWork.CategoryRepository.GetCategoriesAsync();
            var popularCategories = categories.Take(count).ToList();

            return new OkObjectResult(popularCategories);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error getting popular categories: {ex.Message}");
        }
    }
}