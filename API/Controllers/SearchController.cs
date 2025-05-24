using API.DTO;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class SearchController : BaseAPIController
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpPost("predictions")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedResponse<PredictionDTO>>> SearchPredictions(
        [FromBody] PredictionSearchDTO searchDto, 
        [FromQuery] PaginationParams paginationParams)
    {
        return await _searchService.SearchPredictionsAsync(searchDto, paginationParams);
    }

    [HttpGet("discussion-posts")]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedResponse<DiscussionPostDTO>>> SearchDiscussionPosts(
        [FromQuery] string? searchTerm,
        [FromQuery] string? tag,
        [FromQuery] PaginationParams paginationParams)
    {
        return await _searchService.SearchDiscussionPostsAsync(searchTerm, tag, paginationParams);
    }

    [HttpGet("teams")]
    public async Task<ActionResult<PaginatedResponse<TeamDTO>>> SearchTeams(
        [FromQuery] string? searchTerm,
        [FromQuery] int? userId,
        [FromQuery] PaginationParams paginationParams)
    {
        return await _searchService.SearchTeamsAsync(searchTerm, userId, paginationParams);
    }

    [HttpGet("popular-tags")]
    [AllowAnonymous]
    public async Task<ActionResult<List<string>>> GetPopularTags([FromQuery] int count = 10)
    {
        return await _searchService.GetPopularTagsAsync(count);
    }

    [HttpGet("popular-categories")]
    [AllowAnonymous]
    public async Task<ActionResult<List<CategoryDTO>>> GetPopularCategories([FromQuery] int count = 10)
    {
        return await _searchService.GetPopularCategoriesAsync(count);
    }
}