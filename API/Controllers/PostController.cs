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

    // FIXED: Corrected publish endpoint with proper error handling
    [HttpPost("rank/publish")]
    public async Task<ActionResult> PublishRankingPost([FromBody] PublishPostRequestDTO request)
    {
        try
        {
            Console.WriteLine("=== PUBLISH RANKING POST CALLED ===");
            Console.WriteLine($"Request received: {request != null}");

            if (request == null)
            {
                Console.WriteLine("REQUEST IS NULL");
                return BadRequest("Request data is required");
            }

            Console.WriteLine($"PredictionId: {request.PredictionId}");
            Console.WriteLine($"TemplateId: {request.TemplateId}");
            Console.WriteLine($"PredictionType: {request.PredictionType}");
            Console.WriteLine($"IsDraft: {request.IsDraft}");
            Console.WriteLine($"Notes: {request.Notes ?? "null"}");
            Console.WriteLine($"PostRank is null: {request.PostRank == null}");

            // Validate required fields
            if (request.PredictionId <= 0)
            {
                Console.WriteLine("INVALID PREDICTION ID");
                return BadRequest("Valid prediction ID is required");
            }

            if (request.TemplateId <= 0)
            {
                Console.WriteLine("INVALID TEMPLATE ID");
                return BadRequest("Valid template ID is required");
            }

            if (request.PostRank == null)
            {
                Console.WriteLine("POSTRANK IS NULL");
                return BadRequest("PostRank data is required for ranking predictions");
            }

            var userId = User.GetUserId();
            Console.WriteLine($"User ID from token: {userId}");

            if (userId <= 0)
            {
                Console.WriteLine("INVALID USER ID");
                return Unauthorized("Invalid user ID");
            }

            Console.WriteLine("All validations passed, calling service...");

            var result = await _postService.PublishPostAsync(request, userId);

            Console.WriteLine($"Service returned result");

            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== EXCEPTION IN CONTROLLER ===");
            Console.WriteLine($"Exception type: {ex.GetType().Name}");
            Console.WriteLine($"Exception message: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");

            // Return proper error response
            return BadRequest(new
            {
                message = "An error occurred while publishing the post",
                error = ex.Message
            });
        }
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
    [HttpPost("bingo/publish")]
public async Task<ActionResult> PublishBingoPost([FromBody] PublishPostRequestDTO request)
{
    try
    {
        Console.WriteLine("=== PUBLISH BINGO POST CALLED ===");
        Console.WriteLine($"Request received: {request != null}");
        
        if (request == null)
        {
            Console.WriteLine("REQUEST IS NULL");
            return BadRequest("Request data is required");
        }

        Console.WriteLine($"PredictionId: {request.PredictionId}");
        Console.WriteLine($"TemplateId: {request.TemplateId}");
        Console.WriteLine($"PredictionType: {request.PredictionType}");
        Console.WriteLine($"IsDraft: {request.IsDraft}");
        Console.WriteLine($"Notes: {request.Notes ?? "null"}");
        Console.WriteLine($"PostBingo is null: {request.PostBingo == null}");

        // Validate required fields
        if (request.PredictionId <= 0)
        {
            Console.WriteLine("INVALID PREDICTION ID");
            return BadRequest("Valid prediction ID is required");
        }

        if (request.TemplateId <= 0)
        {
            Console.WriteLine("INVALID TEMPLATE ID");
            return BadRequest("Valid template ID is required");
        }

        if (request.PostBingo == null)
        {
            Console.WriteLine("POSTBINGO IS NULL");
            return BadRequest("PostBingo data is required for bingo predictions");
        }

        var userId = User.GetUserId();
        Console.WriteLine($"User ID from token: {userId}");
        
        if (userId <= 0)
        {
            Console.WriteLine("INVALID USER ID");
            return Unauthorized("Invalid user ID");
        }

        Console.WriteLine("All validations passed, calling service...");
        
        var result = await _postService.PublishBingoPostAsync(request, userId);
        
        Console.WriteLine($"Service returned result");
        
        return result;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"=== EXCEPTION IN CONTROLLER ===");
        Console.WriteLine($"Exception type: {ex.GetType().Name}");
        Console.WriteLine($"Exception message: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        
        // Return proper error response
        return BadRequest(new { 
            message = "An error occurred while publishing the bingo post", 
            error = ex.Message 
        });
    }
}
}