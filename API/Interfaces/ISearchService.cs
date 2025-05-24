using API.DTO;
using API.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface ISearchService
{
    Task<ActionResult<PaginatedResponse<PredictionDTO>>> SearchPredictionsAsync(PredictionSearchDTO searchDto, PaginationParams paginationParams);
    Task<ActionResult<PaginatedResponse<DiscussionPostDTO>>> SearchDiscussionPostsAsync(string? searchTerm, string? tag, PaginationParams paginationParams);
    Task<ActionResult<PaginatedResponse<TeamDTO>>> SearchTeamsAsync(string? searchTerm, int? userId, PaginationParams paginationParams);
    Task<ActionResult<List<string>>> GetPopularTagsAsync(int count = 10);
    Task<ActionResult<List<CategoryDTO>>> GetPopularCategoriesAsync(int count = 10);
}