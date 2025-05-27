using API.DTO;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class PostController : BaseAPIController
{
    private IPostService _postService;
    public PostController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpPost("rank/create")]
    public async Task<ActionResult<PostRankDTO>> CreateRank([FromBody] PostRankDTO postRankDTO)
    {
        var userId = User.GetUserId();
        var result = await _postService.CreatePostRankAsync(postRankDTO, userId);
        return result;
    }

    [HttpPost("rank/publish")]
    public async Task<ActionResult<PostRankDTO>> PublishRankingPost([FromBody] PublishPostRequestDTO request)
    {
        var userId = User.GetUserId();
        var result = await _postService.PublishPostAsync(request, userId);
        return result;
    }

    [HttpGet("published")]
    public async Task<ActionResult<List<PublishedPostDTO>>> GetPublishedPosts(
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? predictionType = null,
        [FromQuery] string? searchTerm = null)
    {
        var result = await _postService.GetPublishedPostsAsync(pageNumber, pageSize, predictionType, searchTerm);
        return result;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<PostRankDTO>>> GetUserPosts(int userId)
    {
        var result = await _postService.GetUserPostsAsync(userId);
        return result;
    }

    [HttpGet("{id}/details")]
    public async Task<ActionResult<PostDetailDTO>> GetPostDetails(int id)
    {
        var userId = User.GetUserId();
        var result = await _postService.GetPostDetailsAsync(id, userId);
        return result;
    }

    [HttpPost("{id}/counter-predict")]
    public async Task<ActionResult<PostRankDTO>> CreateCounterPrediction(int id, [FromBody] CounterPredictionRequestDTO request)
    {
        var userId = User.GetUserId();
        var result = await _postService.CreateCounterPredictionAsync(id, request, userId);
        return result;
    }
}