using API.DTO;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class PostController : BaseAPIController
{
    private IPostService _postService;
    private readonly IUnitOfWork _unitOfWork;
    private IMapper _mapper;
    public PostController(IPostService postService, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _postService = postService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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
            // FIXED: Enhanced validation with detailed error messages
            if (request == null)
            {
                return BadRequest(new { message = "Request data is required", error = "The request body cannot be null or empty" });
            }

            // FIXED: More specific validation checks
            if (request.PredictionId <= 0)
            {
                return BadRequest(new { message = "Invalid prediction ID", error = $"PredictionId must be greater than 0, received: {request.PredictionId}" });
            }

            if (request.TemplateId <= 0)
            {
                return BadRequest(new { message = "Invalid template ID", error = $"TemplateId must be greater than 0, received: {request.TemplateId}" });
            }

            if (request.PostRank == null)
            {
                return BadRequest(new { message = "PostRank data is required", error = "PostRank data is required for ranking predictions" });
            }

            // FIXED: Validate PostRank structure
            if (request.PostRank.RankTable == null)
            {
                return BadRequest(new { message = "RankTable is required", error = "PostRank must contain a valid RankTable" });
            }

            if (request.PostRank.RankTable.Rows == null || !request.PostRank.RankTable.Rows.Any())
            {
                return BadRequest(new { message = "Rows are required", error = "RankTable must contain at least one row" });
            }

            // FIXED: Validate that at least some positions have teams
            var hasAnyTeams = request.PostRank.RankTable.Rows
                .Any(row => row.Columns != null && row.Columns.Any(col => col.Team != null));

            if (!hasAnyTeams)
            {
                return BadRequest(new { message = "No teams assigned", error = "At least one position must have a team assigned" });
            }

            var userId = User.GetUserId();

            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid user authentication", error = "User ID must be valid" });
            }

            request.PostRank.UserId = userId;

            var result = await _postService.PublishPostAsync(request, userId);

            return result;
        }
        catch (ArgumentException argEx)
        {
            return BadRequest(new
            {
                message = "Invalid argument provided",
                error = argEx.Message
            });
        }
        catch (InvalidOperationException opEx)
        {
            return BadRequest(new
            {
                message = "Invalid operation",
                error = opEx.Message
            });
        }
        catch (UnauthorizedAccessException unAuthEx)
        {
            return Unauthorized(new
            {
                message = "Access denied",
                error = unAuthEx.Message
            });
        }
        catch (Exception ex)
        {
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
    public async Task<ActionResult<List<UserPostSummaryDTO>>> GetUserPosts(int userId)
    {
        var result = await _postService.GetUserPostsAsync(userId);
        return result;
    }

    [HttpGet("{id}/details")]
    public async Task<ActionResult<PostDetailDTO>> GetPostDetails(int id)
    {
        try
        {
            var userId = User.GetUserId();
            Console.WriteLine($"Getting post details for prediction {id}, current user: {userId}");

            var result = await _postService.GetPostDetailsAsync(id, userId);
            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Controller error getting post details: {ex.Message}");
            return StatusCode(500, new
            {
                message = "An error occurred while fetching post details",
                error = ex.Message
            });
        }
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
            return StatusCode(500, new
            {
                message = "An internal server error occurred while publishing the bingo post",
                error = "Please try again later or contact support if the problem persists",
                details = ex.Message // Only include in development
            });
        }
    }
    [HttpGet("my-posts")]
    public async Task<ActionResult<List<UserPostSummaryDTO>>> GetMyPosts()
    {
        try
        {
            var userId = User.GetUserId();

            if (userId <= 0)
            {
                Console.WriteLine("Invalid user ID");
                return Unauthorized(new { message = "Invalid user authentication", error = "User ID must be valid" });
            }

            Console.WriteLine($"Getting posts for user ID: {userId}");

            // Get all predictions by the current user
            var predictions = await _unitOfWork.PredictionRepository.GetPredictionsByUserIdAsync(
                userId,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            Console.WriteLine($"Found {predictions?.Count ?? 0} predictions for user {userId}");

            var userPosts = new List<UserPostSummaryDTO>();

            if (predictions != null && predictions.Any())
            {
                foreach (var prediction in predictions)
                {
                    try
                    {
                        var post = new UserPostSummaryDTO
                        {
                            Id = prediction.Id,
                            Title = prediction.Title ?? "Untitled Prediction",
                            PredictionType = prediction.PredictionType,
                            CreatedAt = prediction.CreatedAt,
                            EndDate = prediction.EndDate,
                            IsDraft = prediction.IsDraft,
                            IsActive = prediction.IsActive,
                            CounterPredictionsCount = GetCounterPredictionsCount(prediction),
                            Notes = prediction.Description ?? ""
                        };

                        userPosts.Add(post);
                        Console.WriteLine($"Added post: {post.Title} (ID: {post.Id})");
                    }
                    catch (Exception postEx)
                    {
                        Console.WriteLine($"Error processing prediction {prediction?.Id}: {postEx.Message}");
                        // Continue processing other posts
                    }
                }
            }

            Console.WriteLine($"Returning {userPosts.Count} user posts");
            return Ok(userPosts);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting user posts: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new
            {
                message = "An error occurred while retrieving your posts",
                error = ex.Message,
                details = "Please try again later or contact support if the problem persists"
            });
        }
    }

    // Helper method to count counter predictions
    private int GetCounterPredictionsCount(Prediction prediction)
    {
        try
        {
            if (prediction == null) return 0;

            switch (prediction.PredictionType)
            {
                case PredictionType.Ranking:
                    return prediction.PostRanks?.Count(pr => pr.UserId != prediction.UserId) ?? 0;
                case PredictionType.Bracket:
                    return prediction.PostBrackets?.Count(pb => pb.UserId != prediction.UserId) ?? 0;
                case PredictionType.Bingo:
                    return prediction.PostBingos?.Count(pb => pb.UserId != prediction.UserId) ?? 0;
                default:
                    return 0;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error counting counter predictions: {ex.Message}");
            return 0;
        }
    }
    [HttpGet("prediction/{predictionId}/with-posts")]
    public async Task<ActionResult<PredictionWithPostsDTO>> GetPredictionWithPosts(int predictionId)
    {
        try
        {
            var userId = User.GetUserId();
            Console.WriteLine($"Getting prediction {predictionId} with associated posts for user {userId}");

            // Get prediction with all associated posts
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
                predictionId,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            if (prediction == null)
            {
                return NotFound(new { message = "Prediction not found" });
            }

            var response = new PredictionWithPostsDTO
            {
                Id = prediction.Id,
                Title = prediction.Title,
                Description = prediction.Description,
                PredictionType = prediction.PredictionType,
                CreatedAt = prediction.CreatedAt,
                EndDate = prediction.EndDate,
                IsActive = prediction.IsActive,
                IsDraft = prediction.IsDraft,
                UserId = prediction.UserId ?? 0,
                Author = _mapper.Map<MemberDTO>(prediction.User),
                Categories = new List<CategoryDTO>()
            };

            // Get categories
            try
            {
                var categories = await _unitOfWork.CategoryRepository.GetPredictionCategoriesByIdsAsync(predictionId);
                response.Categories = _mapper.Map<List<CategoryDTO>>(categories);
            }
            catch (Exception catEx)
            {
                Console.WriteLine($"Error loading categories: {catEx.Message}");
            }

            // Get the posts based on prediction type
            switch (prediction.PredictionType)
            {
                case PredictionType.Ranking:
                    var postRanks = prediction.PostRanks.ToList();
                    Console.WriteLine($"Found {postRanks.Count} PostRanks for prediction {predictionId}");

                    response.PostRanks = new List<PostRankDTO>();
                    foreach (var postRank in postRanks)
                    {
                        try
                        {
                            var postRankDTO = _mapper.Map<PostRankDTO>(postRank);

                            // Ensure we have teams data
                            if (postRank.RankTable?.Rows != null)
                            {
                                Console.WriteLine($"PostRank {postRank.Id} has {postRank.RankTable.Rows.Count} rows");
                                foreach (var row in postRank.RankTable.Rows)
                                {
                                    if (row.Columns != null)
                                    {
                                        Console.WriteLine($"Row {row.Order} has {row.Columns.Count} columns");
                                        foreach (var col in row.Columns.Where(c => c.Team != null))
                                        {
                                            Console.WriteLine($"Column has team: {col.Team.Name}");
                                        }
                                    }
                                }
                            }

                            response.PostRanks.Add(postRankDTO);
                        }
                        catch (Exception prEx)
                        {
                            Console.WriteLine($"Error mapping PostRank {postRank.Id}: {prEx.Message}");
                        }
                    }
                    break;

                case PredictionType.Bracket:
                    var postBrackets = prediction.PostBrackets.ToList();
                    Console.WriteLine($"Found {postBrackets.Count} PostBrackets for prediction {predictionId}");

                    response.PostBrackets = new List<PostBracketDTO>();
                    foreach (var postBracket in postBrackets)
                    {
                        try
                        {
                            var postBracketDTO = _mapper.Map<PostBracketDTO>(postBracket);
                            response.PostBrackets.Add(postBracketDTO);
                        }
                        catch (Exception pbEx)
                        {
                            Console.WriteLine($"Error mapping PostBracket {postBracket.Id}: {pbEx.Message}");
                        }
                    }
                    break;

                case PredictionType.Bingo:
                    var postBingos = prediction.PostBingos.ToList();
                    Console.WriteLine($"Found {postBingos.Count} PostBingos for prediction {predictionId}");

                    response.PostBingos = new List<PostBingoDTO>();
                    foreach (var postBingo in postBingos)
                    {
                        try
                        {
                            var postBingoDTO = _mapper.Map<PostBingoDTO>(postBingo);

                            // Log bingo cells info
                            if (postBingo.BingoCells != null)
                            {
                                Console.WriteLine($"PostBingo {postBingo.Id} has {postBingo.BingoCells.Count} cells");
                                var cellsWithTeams = postBingo.BingoCells.Where(c => c.Team != null).Count();
                                Console.WriteLine($"Cells with teams: {cellsWithTeams}");
                            }

                            response.PostBingos.Add(postBingoDTO);
                        }
                        catch (Exception pbEx)
                        {
                            Console.WriteLine($"Error mapping PostBingo {postBingo.Id}: {pbEx.Message}");
                        }
                    }
                    break;
            }

            Console.WriteLine($"Returning prediction with posts data");
            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting prediction with posts: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new
            {
                message = "Error fetching prediction with posts",
                error = ex.Message
            });
        }
    }


}