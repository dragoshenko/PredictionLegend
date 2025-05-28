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

    // FIXED: Improved publish endpoint with comprehensive error handling and logging
    [HttpPost("rank/publish")]
    public async Task<ActionResult> PublishRankingPost([FromBody] PublishPostRequestDTO request)
    {
        try
        {
            Console.WriteLine("=== PUBLISH RANKING POST CALLED ===");
            Console.WriteLine($"Request received: {request != null}");

            // FIXED: Enhanced validation with detailed error messages
            if (request == null)
            {
                Console.WriteLine("REQUEST IS NULL");
                return BadRequest(new { message = "Request data is required", error = "The request body cannot be null or empty" });
            }

            Console.WriteLine($"Request details:");
            Console.WriteLine($"  PredictionId: {request.PredictionId}");
            Console.WriteLine($"  TemplateId: {request.TemplateId}");
            Console.WriteLine($"  PredictionType: {request.PredictionType}");
            Console.WriteLine($"  IsDraft: {request.IsDraft}");
            Console.WriteLine($"  Notes: {request.Notes ?? "null"}");
            Console.WriteLine($"  PostRank is null: {request.PostRank == null}");

            // FIXED: More specific validation checks
            if (request.PredictionId <= 0)
            {
                Console.WriteLine("INVALID PREDICTION ID");
                return BadRequest(new { message = "Invalid prediction ID", error = $"PredictionId must be greater than 0, received: {request.PredictionId}" });
            }

            if (request.TemplateId <= 0)
            {
                Console.WriteLine("INVALID TEMPLATE ID");
                return BadRequest(new { message = "Invalid template ID", error = $"TemplateId must be greater than 0, received: {request.TemplateId}" });
            }

            if (request.PostRank == null)
            {
                Console.WriteLine("POSTRANK IS NULL");
                return BadRequest(new { message = "PostRank data is required", error = "PostRank data is required for ranking predictions" });
            }

            // FIXED: Validate PostRank structure
            if (request.PostRank.RankTable == null)
            {
                Console.WriteLine("RANKTABLE IS NULL");
                return BadRequest(new { message = "RankTable is required", error = "PostRank must contain a valid RankTable" });
            }

            if (request.PostRank.RankTable.Rows == null || !request.PostRank.RankTable.Rows.Any())
            {
                Console.WriteLine("ROWS ARE NULL OR EMPTY");
                return BadRequest(new { message = "Rows are required", error = "RankTable must contain at least one row" });
            }

            // FIXED: Validate that at least some positions have teams
            var hasAnyTeams = request.PostRank.RankTable.Rows
                .Any(row => row.Columns != null && row.Columns.Any(col => col.Team != null));

            if (!hasAnyTeams)
            {
                Console.WriteLine("NO TEAMS ASSIGNED");
                return BadRequest(new { message = "No teams assigned", error = "At least one position must have a team assigned" });
            }

            var userId = User.GetUserId();
            Console.WriteLine($"User ID from token: {userId}");

            if (userId <= 0)
            {
                Console.WriteLine("INVALID USER ID");
                return Unauthorized(new { message = "Invalid user authentication", error = "User ID must be valid" });
            }

            Console.WriteLine("All validations passed, calling service...");

            // FIXED: Set the userId in the PostRank object
            request.PostRank.UserId = userId;

            var result = await _postService.PublishPostAsync(request, userId);

            Console.WriteLine($"Service call completed");

            return result;
        }
        catch (ArgumentException argEx)
        {
            Console.WriteLine($"=== ARGUMENT EXCEPTION ===");
            Console.WriteLine($"Exception message: {argEx.Message}");
            Console.WriteLine($"Stack trace: {argEx.StackTrace}");

            return BadRequest(new
            {
                message = "Invalid argument provided",
                error = argEx.Message
            });
        }
        catch (InvalidOperationException opEx)
        {
            Console.WriteLine($"=== INVALID OPERATION EXCEPTION ===");
            Console.WriteLine($"Exception message: {opEx.Message}");
            Console.WriteLine($"Stack trace: {opEx.StackTrace}");

            return BadRequest(new
            {
                message = "Invalid operation",
                error = opEx.Message
            });
        }
        catch (UnauthorizedAccessException unAuthEx)
        {
            Console.WriteLine($"=== UNAUTHORIZED ACCESS EXCEPTION ===");
            Console.WriteLine($"Exception message: {unAuthEx.Message}");

            return Unauthorized(new
            {
                message = "Access denied",
                error = unAuthEx.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== GENERAL EXCEPTION IN CONTROLLER ===");
            Console.WriteLine($"Exception type: {ex.GetType().Name}");
            Console.WriteLine($"Exception message: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");

            // FIXED: More informative error response
            return StatusCode(500, new
            {
                message = "An internal server error occurred while publishing the post",
                error = "Please try again later or contact support if the problem persists",
                details = ex.Message // Only include in development
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

    // FIXED: Enhanced bingo publish endpoint with same improvements
    [HttpPost("bingo/publish")]
    public async Task<ActionResult> PublishBingoPost([FromBody] PublishPostRequestDTO request)
    {
        try
        {
            Console.WriteLine("=== PUBLISH BINGO POST CALLED ===");
            Console.WriteLine($"Request received: {request != null}");
            
            // FIXED: Enhanced validation with detailed error messages
            if (request == null)
            {
                Console.WriteLine("REQUEST IS NULL");
                return BadRequest(new { message = "Request data is required", error = "The request body cannot be null or empty" });
            }

            Console.WriteLine($"Request details:");
            Console.WriteLine($"  PredictionId: {request.PredictionId}");
            Console.WriteLine($"  TemplateId: {request.TemplateId}");
            Console.WriteLine($"  PredictionType: {request.PredictionType}");
            Console.WriteLine($"  IsDraft: {request.IsDraft}");
            Console.WriteLine($"  Notes: {request.Notes ?? "null"}");
            Console.WriteLine($"  PostBingo is null: {request.PostBingo == null}");

            // FIXED: More specific validation checks
            if (request.PredictionId <= 0)
            {
                Console.WriteLine("INVALID PREDICTION ID");
                return BadRequest(new { message = "Invalid prediction ID", error = $"PredictionId must be greater than 0, received: {request.PredictionId}" });
            }

            if (request.TemplateId <= 0)
            {
                Console.WriteLine("INVALID TEMPLATE ID");
                return BadRequest(new { message = "Invalid template ID", error = $"TemplateId must be greater than 0, received: {request.TemplateId}" });
            }

            if (request.PostBingo == null)
            {
                Console.WriteLine("POSTBINGO IS NULL");
                return BadRequest(new { message = "PostBingo data is required", error = "PostBingo data is required for bingo predictions" });
            }

            // FIXED: Validate PostBingo structure
            if (request.PostBingo.BingoCells == null || !request.PostBingo.BingoCells.Any())
            {
                Console.WriteLine("BINGO CELLS ARE NULL OR EMPTY");
                return BadRequest(new { message = "Bingo cells are required", error = "PostBingo must contain at least one bingo cell" });
            }

            // FIXED: Validate that at least some cells have teams
            var hasAnyTeams = request.PostBingo.BingoCells.Any(cell => cell.Team != null);

            if (!hasAnyTeams)
            {
                Console.WriteLine("NO TEAMS ASSIGNED");
                return BadRequest(new { message = "No teams assigned", error = "At least one bingo cell must have a team assigned" });
            }

            var userId = User.GetUserId();
            Console.WriteLine($"User ID from token: {userId}");
            
            if (userId <= 0)
            {
                Console.WriteLine("INVALID USER ID");
                return Unauthorized(new { message = "Invalid user authentication", error = "User ID must be valid" });
            }

            Console.WriteLine("All validations passed, calling service...");
            
            // FIXED: Set the userId in the PostBingo object
            request.PostBingo.UserId = userId;

            var result = await _postService.PublishBingoPostAsync(request, userId);
            
            Console.WriteLine($"Service call completed");
            
            return result;
        }
        catch (ArgumentException argEx)
        {
            Console.WriteLine($"=== ARGUMENT EXCEPTION ===");
            Console.WriteLine($"Exception message: {argEx.Message}");
            Console.WriteLine($"Stack trace: {argEx.StackTrace}");

            return BadRequest(new
            {
                message = "Invalid argument provided",
                error = argEx.Message
            });
        }
        catch (InvalidOperationException opEx)
        {
            Console.WriteLine($"=== INVALID OPERATION EXCEPTION ===");
            Console.WriteLine($"Exception message: {opEx.Message}");
            Console.WriteLine($"Stack trace: {opEx.StackTrace}");

            return BadRequest(new
            {
                message = "Invalid operation",
                error = opEx.Message
            });
        }
        catch (UnauthorizedAccessException unAuthEx)
        {
            Console.WriteLine($"=== UNAUTHORIZED ACCESS EXCEPTION ===");
            Console.WriteLine($"Exception message: {unAuthEx.Message}");

            return Unauthorized(new
            {
                message = "Access denied",
                error = unAuthEx.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== GENERAL EXCEPTION IN CONTROLLER ===");
            Console.WriteLine($"Exception type: {ex.GetType().Name}");
            Console.WriteLine($"Exception message: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            
            // FIXED: More informative error response
            return StatusCode(500, new { 
                message = "An internal server error occurred while publishing the bingo post", 
                error = "Please try again later or contact support if the problem persists",
                details = ex.Message // Only include in development
            });
        }
    }
}