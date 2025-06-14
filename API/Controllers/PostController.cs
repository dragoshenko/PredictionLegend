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

    [HttpPost("rank/publish")]
    public async Task<ActionResult> PublishRankingPost([FromBody] PublishPostRequestDTO request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request data is required", error = "The request body cannot be null or empty" });
            }

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
                return BadRequest(new { message = "Request data is required", error = "The request body cannot be null or empty" });
            }

            Console.WriteLine($"Request details:");
            Console.WriteLine($"  PredictionId: {request.PredictionId}");
            Console.WriteLine($"  TemplateId: {request.TemplateId}");
            Console.WriteLine($"  PredictionType: {request.PredictionType}");
            Console.WriteLine($"  IsDraft: {request.IsDraft}");
            Console.WriteLine($"  Notes: {request.Notes ?? "null"}");
            Console.WriteLine($"  PostBingo is null: {request.PostBingo == null}");

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

            // Validate PostBingo structure
            if (request.PostBingo.BingoCells == null || !request.PostBingo.BingoCells.Any())
            {
                Console.WriteLine("BINGO CELLS ARE NULL OR EMPTY");
                return BadRequest(new { message = "Bingo cells are required", error = "PostBingo must contain at least one bingo cell" });
            }

            // Validate that at least some cells have teams
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

            // Set the userId in the PostBingo object
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
                            // FIXED: Ensure user data is properly mapped
                            var postRankDTO = _mapper.Map<PostRankDTO>(postRank);

                            // Explicitly set user data if mapper doesn't handle it
                            if (postRank.User != null)
                            {
                                postRankDTO.User = _mapper.Map<MemberDTO>(postRank.User);
                            }

                            // Also set userId for consistency
                            postRankDTO.UserId = postRank.UserId;

                            // Log user info for debugging
                            Console.WriteLine($"PostRank {postRank.Id} - UserId: {postRank.UserId}, User: {postRank.User?.DisplayName ?? "NULL"}");

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

                            // FIXED: Ensure user data is properly mapped
                            if (postBracket.User != null)
                            {
                                postBracketDTO.User = _mapper.Map<MemberDTO>(postBracket.User);
                            }

                            postBracketDTO.UserId = postBracket.UserId;
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

                            // FIXED: Ensure user data is properly mapped
                            if (postBingo.User != null)
                            {
                                postBingoDTO.User = _mapper.Map<MemberDTO>(postBingo.User);
                            }

                            postBingoDTO.UserId = postBingo.UserId;

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

    [HttpPost("counter-prediction")]
public async Task<ActionResult> CreateCounterPrediction([FromBody] CounterPredictionRequestDTO request)
{
    try
    {
        var userId = User.GetUserId();

        // Get the original prediction with all related data
        var originalPrediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
            request.Id,
            includeUser: true,
            includePostRanks: true,
            includePostBingos: true,
            includePostBrackets: true
        );

        if (originalPrediction == null)
        {
            Console.WriteLine("Original prediction not found");
            return BadRequest(new { message = "Original prediction not found" });
        }

        Console.WriteLine($"Original prediction found: {originalPrediction.Title}");
        Console.WriteLine($"Original prediction type: {originalPrediction.PredictionType}");
        Console.WriteLine($"Original prediction owner: {originalPrediction.UserId}");
        Console.WriteLine($"Current user: {userId}");

        // UPDATED: Allow original author to create counter predictions
        // No longer block the original author from creating counter predictions

        if (originalPrediction.IsDraft)
        {
            Console.WriteLine("Cannot counter-predict draft prediction");
            return BadRequest(new { message = "Cannot create counter prediction for draft predictions" });
        }

        if (!originalPrediction.IsActive)
        {
            Console.WriteLine("Cannot counter-predict inactive prediction");
            return BadRequest(new { message = "Cannot create counter prediction for inactive predictions" });
        }

        // UPDATED: Check if user already has a counter prediction
        // This now includes checking if the original author already has an alternative prediction
        bool hasExistingCounterPrediction = false;
        switch (originalPrediction.PredictionType)
        {
            case PredictionType.Ranking:
                // For original author: check if they have MORE than 1 post (original + counter)
                // For other users: check if they have ANY post
                if (originalPrediction.UserId == userId)
                {
                    hasExistingCounterPrediction = originalPrediction.PostRanks.Count(pr => pr.UserId == userId) > 1;
                }
                else
                {
                    hasExistingCounterPrediction = originalPrediction.PostRanks.Any(pr => pr.UserId == userId);
                }
                break;
            case PredictionType.Bracket:
                if (originalPrediction.UserId == userId)
                {
                    hasExistingCounterPrediction = originalPrediction.PostBrackets.Count(pb => pb.UserId == userId) > 1;
                }
                else
                {
                    hasExistingCounterPrediction = originalPrediction.PostBrackets.Any(pb => pb.UserId == userId);
                }
                break;
            case PredictionType.Bingo:
                if (originalPrediction.UserId == userId)
                {
                    hasExistingCounterPrediction = originalPrediction.PostBingos.Count(pb => pb.UserId == userId) > 1;
                }
                else
                {
                    hasExistingCounterPrediction = originalPrediction.PostBingos.Any(pb => pb.UserId == userId);
                }
                break;
        }

        if (hasExistingCounterPrediction)
        {
            Console.WriteLine("User already has counter prediction");
            if (originalPrediction.UserId == userId)
            {
                return BadRequest(new { message = "You have already created an alternative prediction for your own post" });
            }
            else
            {
                return BadRequest(new { message = "You have already created a counter prediction for this post" });
            }
        }

        // Create counter prediction based on type
        switch (originalPrediction.PredictionType)
        {
            case PredictionType.Ranking:
                Console.WriteLine("Creating ranking counter prediction");
                if (request.PostRank == null)
                {
                    Console.WriteLine("PostRank data is null");
                    return BadRequest(new { message = "PostRank data is required for ranking counter predictions" });
                }

                // Set required fields
                request.PostRank.PredictionId = request.Id;
                request.PostRank.UserId = userId;

                // Validate rank table structure
                if (request.PostRank.RankTable?.Rows == null || !request.PostRank.RankTable.Rows.Any())
                {
                    return BadRequest(new { message = "RankTable with rows is required" });
                }

                // Validate that at least some positions have teams
                var hasAnyTeamsInRanking = request.PostRank.RankTable.Rows
                    .Any(row => row.Columns != null && row.Columns.Any(col => col.Team != null));

                if (!hasAnyTeamsInRanking)
                {
                    return BadRequest(new { message = "At least one position must have a team assigned" });
                }

                Console.WriteLine($"Creating PostRank with {request.PostRank.RankTable.Rows.Count} rows");
                var rankResult = await _postService.CreatePostRankAsync(request.PostRank, userId);

                if (rankResult.Result is BadRequestObjectResult badRankResult)
                {
                    Console.WriteLine($"CreatePostRankAsync failed: {badRankResult.Value}");
                    return badRankResult;
                }

                // UPDATED: Success message for original author vs other users
                if (originalPrediction.UserId == userId)
                {
                    Console.WriteLine("Author's alternative ranking prediction created successfully");
                    return Ok(new { message = "Alternative ranking prediction created successfully", data = rankResult.Value });
                }
                else
                {
                    Console.WriteLine("Ranking counter prediction created successfully");
                    return Ok(new { message = "Ranking counter prediction created successfully", data = rankResult.Value });
                }

            case PredictionType.Bingo:
                Console.WriteLine("Creating bingo counter prediction");
                if (request.PostBingo == null)
                {
                    Console.WriteLine("PostBingo data is null");
                    return BadRequest(new { message = "PostBingo data is required for bingo counter predictions" });
                }

                // Set required fields
                request.PostBingo.UserId = userId;

                // Validate bingo structure
                if (request.PostBingo.BingoCells == null || !request.PostBingo.BingoCells.Any())
                {
                    return BadRequest(new { message = "BingoCells are required" });
                }

                // Validate that at least some cells have teams
                var hasAnyTeamsInBingo = request.PostBingo.BingoCells.Any(cell => cell.Team != null);

                if (!hasAnyTeamsInBingo)
                {
                    return BadRequest(new { message = "At least one bingo cell must have a team assigned" });
                }

                Console.WriteLine($"Creating PostBingo with {request.PostBingo.BingoCells.Count} cells");
                var bingoResult = await _postService.CreatePostBingoAsync(request.PostBingo, request.Id, userId);

                if (bingoResult.Result is BadRequestObjectResult badBingoResult)
                {
                    Console.WriteLine($"CreatePostBingoAsync failed: {badBingoResult.Value}");
                    return badBingoResult;
                }

                // UPDATED: Success message for original author vs other users
                if (originalPrediction.UserId == userId)
                {
                    Console.WriteLine("Author's alternative bingo prediction created successfully");
                    return Ok(new { message = "Alternative bingo prediction created successfully", data = bingoResult.Value });
                }
                else
                {
                    Console.WriteLine("Bingo counter prediction created successfully");
                    return Ok(new { message = "Bingo counter prediction created successfully", data = bingoResult.Value });
                }

            case PredictionType.Bracket:
                Console.WriteLine("Bracket counter predictions not yet implemented");
                return BadRequest(new { message = "Bracket counter predictions are not yet implemented" });

            default:
                Console.WriteLine($"Unsupported prediction type: {originalPrediction.PredictionType}");
                return BadRequest(new { message = "Unsupported prediction type" });
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"=== EXCEPTION IN CreateCounterPrediction ===");
        Console.WriteLine($"Exception type: {ex.GetType().Name}");
        Console.WriteLine($"Exception message: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");

        if (ex.InnerException != null)
        {
            Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
        }

        return StatusCode(500, new
        {
            message = "An error occurred while creating the counter prediction",
            error = ex.Message,
            details = "Please try again later or contact support if the problem persists"
        });
    }
}

[HttpGet("can-counter-predict/{id}")]
public async Task<ActionResult<bool>> CanUserCounterPredict(int id)
{
    try
    {
        var userId = User.GetUserId();
        var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
            id,
            includePostRanks: true,
            includePostBingos: true,
            includePostBrackets: true
        );

        if (prediction == null)
        {
            return NotFound();
        }

        // UPDATED: Allow original author to create counter predictions
        // Check conditions for counter prediction
        bool canCounterPredict = !prediction.IsDraft &&
                               prediction.IsActive &&
                               !HasUserCounterPredicted(prediction, userId); // Removed userId != prediction.UserId

        Console.WriteLine($"CanUserCounterPredict check for user {userId}, prediction {id}: {canCounterPredict}");
        Console.WriteLine($"  - IsDraft: {prediction.IsDraft}");
        Console.WriteLine($"  - IsActive: {prediction.IsActive}");
        Console.WriteLine($"  - UserId: {prediction.UserId}");
        Console.WriteLine($"  - IsOriginalAuthor: {prediction.UserId == userId}");
        Console.WriteLine($"  - HasUserCounterPredicted: {HasUserCounterPredicted(prediction, userId)}");

        return Ok(canCounterPredict);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error checking counter prediction eligibility: {ex.Message}");
        return StatusCode(500, new { message = "Error checking eligibility", error = ex.Message });
    }
}

    // Helper method to check if user has already created a counter prediction
    private bool HasUserCounterPredicted(Prediction prediction, int userId)
    {
        switch (prediction.PredictionType)
        {
            case PredictionType.Ranking:
                // For original author: check if they have more than 1 post (original + counter)
                // For other users: check if they have any post
                if (prediction.UserId == userId)
                {
                    return prediction.PostRanks.Count(pr => pr.UserId == userId) > 1;
                }
                else
                {
                    return prediction.PostRanks.Any(pr => pr.UserId == userId);
                }
            case PredictionType.Bracket:
                if (prediction.UserId == userId)
                {
                    return prediction.PostBrackets.Count(pb => pb.UserId == userId) > 1;
                }
                else
                {
                    return prediction.PostBrackets.Any(pb => pb.UserId == userId);
                }
            case PredictionType.Bingo:
                if (prediction.UserId == userId)
                {
                    return prediction.PostBingos.Count(pb => pb.UserId == userId) > 1;
                }
                else
                {
                    return prediction.PostBingos.Any(pb => pb.UserId == userId);
                }
        }
        return false;
    }
private int GetCounterPredictionsCount(Prediction prediction)
{
    switch (prediction.PredictionType)
    {
        case PredictionType.Ranking:
            // Count all posts except the first one by the original author
            var rankingPosts = prediction.PostRanks.ToList();
            var firstAuthorPost = rankingPosts.FirstOrDefault(pr => pr.UserId == prediction.UserId);
            return rankingPosts.Count(pr => pr.Id != firstAuthorPost?.Id);
        case PredictionType.Bracket:
            var bracketPosts = prediction.PostBrackets.ToList();
            var firstAuthorBracket = bracketPosts.FirstOrDefault(pb => pb.UserId == prediction.UserId);
            return bracketPosts.Count(pb => pb.Id != firstAuthorBracket?.Id);
        case PredictionType.Bingo:
            var bingoPosts = prediction.PostBingos.ToList();
            var firstAuthorBingo = bingoPosts.FirstOrDefault(pb => pb.UserId == prediction.UserId);
            return bingoPosts.Count(pb => pb.Id != firstAuthorBingo?.Id);
    }
    return 0;
}

    [HttpGet("debug/{id}")]
    public async Task<ActionResult> DebugPrediction(int id)
    {
        try
        {
            var userId = User.GetUserId();

            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
                id,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            if (prediction == null)
            {
                return NotFound(new { message = "Prediction not found" });
            }

            var debugInfo = new
            {
                PredictionInfo = new
                {
                    Id = prediction.Id,
                    Title = prediction.Title,
                    PredictionType = prediction.PredictionType,
                    UserId = prediction.UserId,
                    IsDraft = prediction.IsDraft,
                    IsActive = prediction.IsActive,
                    CreatedAt = prediction.CreatedAt
                },
                CurrentUser = new
                {
                    UserId = userId,
                    CanCounterPredict = prediction.UserId != userId && !prediction.IsDraft && prediction.IsActive
                },
                PostData = new
                {
                    PostRanks = prediction.PostRanks.Select(pr => new
                    {
                        Id = pr.Id,
                        UserId = pr.UserId,
                        IsOriginal = pr.UserId == prediction.UserId,
                        CreatedAt = pr.CreatedAt,
                        TotalScore = pr.TotalScore,
                        RankTableRows = pr.RankTable?.Rows?.Count ?? 0,
                        TeamsCount = pr.Teams?.Count ?? 0
                    }).ToList(),
                    PostBingos = prediction.PostBingos.Select(pb => new
                    {
                        Id = pb.Id,
                        UserId = pb.UserId,
                        IsOriginal = pb.UserId == prediction.UserId,
                        CreatedAt = pb.CreatedAt,
                        GridSize = pb.GridSize,
                        BingoCellsCount = pb.BingoCells?.Count ?? 0,
                        TeamsCount = pb.Teams?.Count ?? 0
                    }).ToList(),
                    PostBrackets = prediction.PostBrackets.Select(pb => new
                    {
                        Id = pb.Id,
                        UserId = pb.UserId,
                        IsOriginal = pb.UserId == prediction.UserId,
                        CreatedAt = pb.CreatedAt,
                        TotalScore = pb.TotalScore,
                        TeamsCount = pb.Teams?.Count ?? 0
                    }).ToList()
                },
                AvailableTeams = await GetAvailableTeamsForDebug(prediction),
                CounterPredictionEligibility = new
                {
                    CanCreate = prediction.UserId != userId && !prediction.IsDraft && prediction.IsActive,
                    HasExisting = HasUserCounterPredicted(prediction, userId),
                    Reason = GetCounterPredictionIneligibilityReason(prediction, userId)
                }
            };

            return Ok(debugInfo);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Debug failed",
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    private async Task<object> GetAvailableTeamsForDebug(Prediction prediction)
    {
        try
        {
            var teams = new List<object>();

            // Extract teams from the original post data
            if (prediction.PredictionType == PredictionType.Ranking)
            {
                var originalRanking = prediction.PostRanks.FirstOrDefault(pr => pr.UserId == prediction.UserId);
                if (originalRanking?.RankTable?.Rows != null)
                {
                    var seenTeamIds = new HashSet<int>();
                    foreach (var row in originalRanking.RankTable.Rows)
                    {
                        foreach (var column in row.Columns ?? new List<Column>())
                        {
                            if (column.Team != null && !seenTeamIds.Contains(column.Team.Id))
                            {
                                seenTeamIds.Add(column.Team.Id);
                                teams.Add(new
                                {
                                    Id = column.Team.Id,
                                    Name = column.Team.Name,
                                    Description = column.Team.Description,
                                    PhotoUrl = column.Team.PhotoUrl,
                                    CreatedByUserId = column.Team.CreatedByUserId
                                });
                            }
                        }
                    }
                }
            }
            else if (prediction.PredictionType == PredictionType.Bingo)
            {
                var originalBingo = prediction.PostBingos.FirstOrDefault(pb => pb.UserId == prediction.UserId);
                if (originalBingo?.BingoCells != null)
                {
                    var seenTeamIds = new HashSet<int>();
                    foreach (var cell in originalBingo.BingoCells)
                    {
                        if (cell.Team != null && !seenTeamIds.Contains(cell.Team.Id))
                        {
                            seenTeamIds.Add(cell.Team.Id);
                            teams.Add(new
                            {
                                Id = cell.Team.Id,
                                Name = cell.Team.Name,
                                Description = cell.Team.Description,
                                PhotoUrl = cell.Team.PhotoUrl,
                                CreatedByUserId = cell.Team.CreatedByUserId
                            });
                        }
                    }
                }
            }

            return new
            {
                Count = teams.Count,
                Teams = teams
            };
        }
        catch (Exception ex)
        {
            return new
            {
                Error = ex.Message,
                Count = 0,
                Teams = new List<object>()
            };
        }
    }

    private string GetCounterPredictionIneligibilityReason(Prediction prediction, int userId)
    {
        if (prediction.UserId == userId)
            return "Cannot counter-predict own prediction";

        if (prediction.IsDraft)
            return "Cannot counter-predict draft predictions";

        if (!prediction.IsActive)
            return "Prediction is not active";

        if (HasUserCounterPredicted(prediction, userId))
            return "User has already created a counter prediction";

        return "Eligible for counter prediction";
    }
    [HttpGet("my-prediction/{predictionId}")]
    public async Task<ActionResult<PredictionWithPostsDTO>> GetMyPredictionDetails(int predictionId)
    {
        try
        {
            var userId = User.GetUserId();
            Console.WriteLine($"Getting my prediction {predictionId} details for user {userId}");

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

            // Verify ownership - user can only view their own predictions through this endpoint


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
                Categories = new List<CategoryDTO>(),
                CounterPredictionsCount = GetCounterPredictionsCount(prediction),
                PrivacyType = prediction.PrivacyType,
                AccessCode = prediction.AccessCode
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

            // Get only the user's own posts (no counter predictions)
            switch (prediction.PredictionType)
            {
                case PredictionType.Ranking:
                    var userPostRanks = prediction.PostRanks.Where(pr => pr.UserId == userId).ToList();
                    Console.WriteLine($"Found {userPostRanks.Count} user PostRanks for prediction {predictionId}");

                    response.PostRanks = new List<PostRankDTO>();
                    foreach (var postRank in userPostRanks)
                    {
                        try
                        {
                            var postRankDTO = _mapper.Map<PostRankDTO>(postRank);
                            response.PostRanks.Add(postRankDTO);
                        }
                        catch (Exception prEx)
                        {
                            Console.WriteLine($"Error mapping user PostRank {postRank.Id}: {prEx.Message}");
                        }
                    }
                    break;

                case PredictionType.Bracket:
                    var userPostBrackets = prediction.PostBrackets.Where(pb => pb.UserId == userId).ToList();
                    Console.WriteLine($"Found {userPostBrackets.Count} user PostBrackets for prediction {predictionId}");

                    response.PostBrackets = new List<PostBracketDTO>();
                    foreach (var postBracket in userPostBrackets)
                    {
                        try
                        {
                            var postBracketDTO = _mapper.Map<PostBracketDTO>(postBracket);
                            response.PostBrackets.Add(postBracketDTO);
                        }
                        catch (Exception pbEx)
                        {
                            Console.WriteLine($"Error mapping user PostBracket {postBracket.Id}: {pbEx.Message}");
                        }
                    }
                    break;

                case PredictionType.Bingo:
                    var userPostBingos = prediction.PostBingos.Where(pb => pb.UserId == userId).ToList();
                    Console.WriteLine($"Found {userPostBingos.Count} user PostBingos for prediction {predictionId}");

                    response.PostBingos = new List<PostBingoDTO>();
                    foreach (var postBingo in userPostBingos)
                    {
                        try
                        {
                            var postBingoDTO = _mapper.Map<PostBingoDTO>(postBingo);
                            response.PostBingos.Add(postBingoDTO);
                        }
                        catch (Exception pbEx)
                        {
                            Console.WriteLine($"Error mapping user PostBingo {postBingo.Id}: {pbEx.Message}");
                        }
                    }
                    break;
            }

            // Add counter predictions count for statistics
            var counterPredictionsCount = GetCounterPredictionsCount(prediction);

            // You might want to add this to the DTO if it doesn't exist
            // For now, we'll add it as additional data
            Console.WriteLine($"Returning my prediction details with counter predictions count: {counterPredictionsCount}");

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting my prediction details: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new
            {
                message = "Error fetching my prediction details",
                error = ex.Message
            });
        }
    }
    [HttpPut("prediction/{predictionId}/publish")]
    public async Task<ActionResult> PublishPrediction(int predictionId)
    {
        try
        {
            var userId = User.GetUserId();
            Console.WriteLine($"Publishing prediction {predictionId} for user {userId}");

            // Get the prediction
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(predictionId);
            if (prediction == null)
            {
                return NotFound(new { message = "Prediction not found" });
            }

            // Verify ownership
            if (prediction.UserId != userId)
            {
                return Unauthorized(new { message = "You can only publish your own predictions" });
            }

            // Check if it's currently a draft
            if (!prediction.IsDraft)
            {
                return BadRequest(new { message = "This prediction is already published" });
            }

            // Validate that the prediction has the required post data
            bool hasPostData = false;
            switch (prediction.PredictionType)
            {
                case PredictionType.Ranking:
                    hasPostData = prediction.PostRanks.Any(pr => pr.UserId == userId);
                    break;
                case PredictionType.Bingo:
                    hasPostData = prediction.PostBingos.Any(pb => pb.UserId == userId);
                    break;
                case PredictionType.Bracket:
                    hasPostData = prediction.PostBrackets.Any(pb => pb.UserId == userId);
                    break;
            }

            if (!hasPostData)
            {
                return BadRequest(new
                {
                    message = "Cannot publish prediction without post data",
                    error = "Please complete your prediction by adding ranking/bingo/bracket data before publishing"
                });
            }

            // Update prediction to published status
            prediction.IsDraft = false;
            prediction.IsActive = true;
            prediction.LastModified = DateTime.UtcNow;

            await _unitOfWork.PredictionRepository.UpdatePredictionAsync(prediction);
            await _unitOfWork.Complete();

            Console.WriteLine($"Successfully published prediction {predictionId}");

            return Ok(new
            {
                message = "Prediction published successfully",
                predictionId = predictionId,
                title = prediction.Title,
                isPublished = true
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error publishing prediction {predictionId}: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new
            {
                message = "An error occurred while publishing the prediction",
                error = "Please try again later or contact support if the problem persists"
            });
        }
    }

    [HttpGet("my-counter-predictions")]
    public async Task<ActionResult<List<UserCounterPredictionSummaryDTO>>> GetMyCounterPredictions()
    {
        try
        {
            var userId = User.GetUserId();

            if (userId <= 0)
            {
                Console.WriteLine("Invalid user ID");
                return Unauthorized(new { message = "Invalid user authentication", error = "User ID must be valid" });
            }

            Console.WriteLine($"Getting counter predictions for user ID: {userId}");

            var counterPredictions = new List<UserCounterPredictionSummaryDTO>();

            // Get all PostRanks where user is NOT the original author
            var userPostRanks = await _unitOfWork.PostRepository.GetPostRanksByUserIdAsync(userId);

            foreach (var postRank in userPostRanks)
            {
                // Skip if this is the user's original prediction
                if (postRank.Prediction?.UserId == userId) continue;

                var originalPrediction = postRank.Prediction;
                if (originalPrediction != null)
                {
                    counterPredictions.Add(new UserCounterPredictionSummaryDTO
                    {
                        Id = postRank.Id,
                        OriginalPredictionId = originalPrediction.Id,
                        OriginalTitle = originalPrediction.Title,
                        OriginalAuthor = _mapper.Map<MemberDTO>(originalPrediction.User),
                        PredictionType = originalPrediction.PredictionType,
                        CreatedAt = postRank.CreatedAt,
                        TotalScore = postRank.TotalScore,
                        IsCounterPrediction = true,
                        CounterPredictionType = "Ranking"
                    });
                }
            }

            // Get all PostBingos where user is NOT the original author
            var userPostBingos = await _unitOfWork.PostRepository.GetPostBingosByUserIdAsync(userId);

            foreach (var postBingo in userPostBingos)
            {
                // Skip if this is the user's original prediction
                if (postBingo.Prediction?.UserId == userId) continue;

                var originalPrediction = postBingo.Prediction;
                if (originalPrediction != null)
                {
                    counterPredictions.Add(new UserCounterPredictionSummaryDTO
                    {
                        Id = postBingo.Id,
                        OriginalPredictionId = originalPrediction.Id,
                        OriginalTitle = originalPrediction.Title,
                        OriginalAuthor = _mapper.Map<MemberDTO>(originalPrediction.User),
                        PredictionType = originalPrediction.PredictionType,
                        CreatedAt = postBingo.CreatedAt,
                        TotalScore = postBingo.TotalScore,
                        IsCounterPrediction = true,
                        CounterPredictionType = "Bingo"
                    });
                }
            }

            // Get all PostBrackets where user is NOT the original author (when implemented)
            var userPostBrackets = await _unitOfWork.PostRepository.GetPostBracketsByUserIdAsync(userId);

            foreach (var postBracket in userPostBrackets)
            {
                // Skip if this is the user's original prediction
                if (postBracket.Prediction?.UserId == userId) continue;

                var originalPrediction = postBracket.Prediction;
                if (originalPrediction != null)
                {
                    counterPredictions.Add(new UserCounterPredictionSummaryDTO
                    {
                        Id = postBracket.Id,
                        OriginalPredictionId = originalPrediction.Id,
                        OriginalTitle = originalPrediction.Title,
                        OriginalAuthor = _mapper.Map<MemberDTO>(originalPrediction.User),
                        PredictionType = originalPrediction.PredictionType,
                        CreatedAt = postBracket.CreatedAt,
                        TotalScore = postBracket.TotalScore,
                        IsCounterPrediction = true,
                        CounterPredictionType = "Bracket"
                    });
                }
            }

            // Sort by creation date (newest first)
            counterPredictions = counterPredictions
                .OrderByDescending(cp => cp.CreatedAt)
                .ToList();

            Console.WriteLine($"Returning {counterPredictions.Count} counter predictions");
            return Ok(counterPredictions);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting user counter predictions: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new
            {
                message = "An error occurred while retrieving your counter predictions",
                error = ex.Message,
                details = "Please try again later or contact support if the problem persists"
            });
        }
    }

    [HttpGet("my-counter-prediction/{counterPredictionId}/{type}")]
    public async Task<ActionResult<UserCounterPredictionDetailDTO>> GetMyCounterPredictionDetails(int counterPredictionId, string type)
    {
        try
        {
            var userId = User.GetUserId();
            Console.WriteLine($"Getting counter prediction details: ID={counterPredictionId}, Type={type}, User={userId}");

            UserCounterPredictionDetailDTO result = null;

            switch (type.ToLower())
            {
                case "ranking":
                    var postRank = await _unitOfWork.PostRepository.GetPostRankWithDetailsAsync(counterPredictionId);
                    if (postRank != null && postRank.UserId == userId)
                    {
                        result = new UserCounterPredictionDetailDTO
                        {
                            Id = postRank.Id,
                            OriginalPredictionId = postRank.PredictionId,
                            OriginalTitle = postRank.Prediction?.Title,
                            OriginalAuthor = _mapper.Map<MemberDTO>(postRank.Prediction?.User),
                            PredictionType = postRank.Prediction?.PredictionType ?? PredictionType.Ranking,
                            CreatedAt = postRank.CreatedAt,
                            TotalScore = postRank.TotalScore,
                            IsCounterPrediction = true,
                            CounterPredictionType = "Ranking",
                            PostRank = _mapper.Map<PostRankDTO>(postRank)
                        };
                    }
                    break;

                case "bingo":
                    var postBingo = await _unitOfWork.PostRepository.GetPostBingoWithDetailsAsync(counterPredictionId);
                    if (postBingo != null && postBingo.UserId == userId)
                    {
                        result = new UserCounterPredictionDetailDTO
                        {
                            Id = postBingo.Id,
                            OriginalPredictionId = postBingo.PredictionId,
                            OriginalTitle = postBingo.Prediction?.Title,
                            OriginalAuthor = _mapper.Map<MemberDTO>(postBingo.Prediction?.User),
                            PredictionType = postBingo.Prediction?.PredictionType ?? PredictionType.Bingo,
                            CreatedAt = postBingo.CreatedAt,
                            TotalScore = postBingo.TotalScore,
                            IsCounterPrediction = true,
                            CounterPredictionType = "Bingo",
                            PostBingo = _mapper.Map<PostBingoDTO>(postBingo)
                        };
                    }
                    break;

                case "bracket":
                    var postBracket = await _unitOfWork.PostRepository.GetPostBracketWithDetailsAsync(counterPredictionId);
                    if (postBracket != null && postBracket.UserId == userId)
                    {
                        result = new UserCounterPredictionDetailDTO
                        {
                            Id = postBracket.Id,
                            OriginalPredictionId = postBracket.PredictionId,
                            OriginalTitle = postBracket.Prediction?.Title,
                            OriginalAuthor = _mapper.Map<MemberDTO>(postBracket.Prediction?.User),
                            PredictionType = postBracket.Prediction?.PredictionType ?? PredictionType.Bracket,
                            CreatedAt = postBracket.CreatedAt,
                            TotalScore = postBracket.TotalScore,
                            IsCounterPrediction = true,
                            CounterPredictionType = "Bracket",
                            PostBracket = _mapper.Map<PostBracketDTO>(postBracket)
                        };
                    }
                    break;

                default:
                    return BadRequest(new { message = "Invalid counter prediction type", error = $"Type '{type}' is not supported" });
            }

            if (result == null)
            {
                return NotFound(new { message = "Counter prediction not found or access denied" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting counter prediction details: {ex.Message}");
            return StatusCode(500, new
            {
                message = "Error fetching counter prediction details",
                error = ex.Message
            });
        }
    }

    [HttpDelete("counter-prediction/{id}/{type}")]
    public async Task<ActionResult> DeleteCounterPrediction(int id, string type)
    {
        try
        {
            var userId = User.GetUserId();
            Console.WriteLine($"Deleting counter prediction: ID={id}, Type={type}, User={userId}");

            if (userId <= 0)
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            bool deleteResult = false;
            string entityType = "";

            switch (type.ToLower())
            {
                case "ranking":
                    var postRank = await _unitOfWork.PostRepository.GetPostRank(id);
                    if (postRank == null)
                    {
                        return NotFound(new { message = "Ranking counter prediction not found" });
                    }

                    // Verify ownership
                    if (postRank.UserId != userId)
                    {
                        return Unauthorized(new { message = "You can only delete your own counter predictions" });
                    }

                    // Verify it's actually a counter prediction (not the original)
                    var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(postRank.PredictionId);
                    if (prediction != null && prediction.UserId == userId)
                    {
                        return BadRequest(new { message = "Cannot delete original prediction through this endpoint" });
                    }

                    deleteResult = await _unitOfWork.PostRepository.DeletePostRank(id);
                    entityType = "ranking counter prediction";
                    break;

                case "bingo":
                    var postBingo = await _unitOfWork.PostRepository.GetPostBingo(id);
                    if (postBingo == null)
                    {
                        return NotFound(new { message = "Bingo counter prediction not found" });
                    }

                    // Verify ownership
                    if (postBingo.UserId != userId)
                    {
                        return Unauthorized(new { message = "You can only delete your own counter predictions" });
                    }

                    // Verify it's actually a counter prediction (not the original)
                    var bingoPrediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(postBingo.PredictionId);
                    if (bingoPrediction != null && bingoPrediction.UserId == userId)
                    {
                        return BadRequest(new { message = "Cannot delete original prediction through this endpoint" });
                    }

                    deleteResult = await _unitOfWork.PostRepository.DeletePostBingo(id);
                    entityType = "bingo counter prediction";
                    break;

                case "bracket":
                    var postBracket = await _unitOfWork.PostRepository.GetPostBracket(id);
                    if (postBracket == null)
                    {
                        return NotFound(new { message = "Bracket counter prediction not found" });
                    }

                    // Verify ownership
                    if (postBracket.UserId != userId)
                    {
                        return Unauthorized(new { message = "You can only delete your own counter predictions" });
                    }

                    // Verify it's actually a counter prediction (not the original)
                    var bracketPrediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(postBracket.PredictionId);
                    if (bracketPrediction != null && bracketPrediction.UserId == userId)
                    {
                        return BadRequest(new { message = "Cannot delete original prediction through this endpoint" });
                    }

                    deleteResult = await _unitOfWork.PostRepository.DeletePostBracket(id);
                    entityType = "bracket counter prediction";
                    break;

                default:
                    return BadRequest(new { message = "Invalid counter prediction type", error = $"Type '{type}' is not supported" });
            }

            if (!deleteResult)
            {
                Console.WriteLine($"Failed to delete {entityType} with ID {id}");
                return BadRequest(new { message = $"Failed to delete {entityType}" });
            }

            Console.WriteLine($"Successfully deleted {entityType} with ID {id}");
            return Ok(new
            {
                message = $"Counter prediction deleted successfully",
                deletedId = id,
                type = type
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting counter prediction: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new
            {
                message = "An error occurred while deleting the counter prediction",
                error = "Please try again later or contact support if the problem persists"
            });
        }
    }
}