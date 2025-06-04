using System;
using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class PostService : IPostService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PostService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    #region PostRank

    public async Task<ActionResult<PostRankDTO>> CreatePostRankAsync(PostRankDTO postRank, int userId)
    {
        try
        {
            Console.WriteLine("=== CreatePostRankAsync called ===");
            Console.WriteLine($"PostRank PredictionId: {postRank.PredictionId}");
            Console.WriteLine($"PostRank RankingTemplateId: {postRank.RankingTemplateId}");
            Console.WriteLine($"UserId: {userId}");

            // Validate inputs
            if (postRank.PredictionId <= 0)
            {
                return new BadRequestObjectResult("Valid prediction ID is required");
            }

            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine("User not found");
                return new BadRequestObjectResult("User not found");
            }

            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(postRank.PredictionId);
            if (prediction == null)
            {
                Console.WriteLine("Prediction not found");
                return new BadRequestObjectResult("Prediction not found");
            }

            // For counter predictions, we may not have a specific ranking template
            // so we'll create a basic template structure
            int templateId = postRank.RankingTemplateId;
            if (templateId <= 0)
            {
                templateId = 1; // Default template ID
            }

            // Create PostRank entity
            var postRankEntity = new PostRank
            {
                UserId = userId,
                User = user,
                PredictionId = postRank.PredictionId,
                Prediction = prediction,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                TotalScore = postRank.TotalScore,
                IsOfficialResult = postRank.IsOfficialResult,
                Teams = new List<Team>()
            };

            // Create RankTable with proper relationship
            var rankTable = new RankTable
            {
                NumberOfRows = postRank.RankTable.NumberOfRows,
                NumberOfColumns = postRank.RankTable.NumberOfColumns,
                PostRank = postRankEntity,
                Rows = new List<Row>()
            };

            // Set the reverse relationship
            postRankEntity.RankTable = rankTable;

            // Create Rows with proper relationships
            foreach (var rowDto in postRank.RankTable.Rows)
            {
                var row = new Row
                {
                    Order = rowDto.Order,
                    IsWrong = rowDto.IsWrong,
                    Columns = new List<Column>()
                };

                // Create Columns with proper relationships
                foreach (var columnDto in rowDto.Columns)
                {
                    var column = new Column
                    {
                        Order = columnDto.Order,
                        OfficialScore = columnDto.OfficialScore,
                        Team = null
                    };

                    // Handle team assignment
                    if (columnDto.Team != null)
                    {
                        var team = await _unitOfWork.TeamRepository.GetTeamAsync(columnDto.Team.Id);
                        if (team != null)
                        {
                            column.Team = team;
                            if (!postRankEntity.Teams.Any(t => t.Id == team.Id))
                            {
                                postRankEntity.Teams.Add(team);
                            }
                        }
                        else
                        {
                            Console.WriteLine($"Warning: Team with ID {columnDto.Team.Id} not found");
                        }
                    }

                    row.Columns.Add(column);
                }

                rankTable.Rows.Add(row);
            }

            Console.WriteLine($"Created PostRank with {rankTable.Rows.Count} rows, {postRankEntity.Teams.Count} unique teams");

            // Save to database
            var createdPostRank = await _unitOfWork.PostRepository.CreatePostRank(postRankEntity);
            var saveResult = await _unitOfWork.Complete();

            if (!saveResult)
            {
                Console.WriteLine("Failed to save to database");
                return new BadRequestObjectResult("Failed to save post rank to database");
            }

            Console.WriteLine("PostRank created successfully");
            var resultDto = _mapper.Map<PostRankDTO>(createdPostRank);
            return new OkObjectResult(resultDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreatePostRankAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return new BadRequestObjectResult($"Error creating post rank: {ex.Message}");
        }
    }
    public async Task<ActionResult> PublishPostAsync(PublishPostRequestDTO request, int userId)
    {
        try
        {
            Console.WriteLine($"=== PublishPostAsync called ===");
            Console.WriteLine($"PredictionId: {request.PredictionId}");
            Console.WriteLine($"TemplateId: {request.TemplateId}");
            Console.WriteLine($"PredictionType: {request.PredictionType}");
            Console.WriteLine($"UserId: {userId}");

            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine("User not found");
                return new BadRequestObjectResult("User not found");
            }

            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(request.PredictionId);
            if (prediction == null)
            {
                Console.WriteLine("Prediction not found");
                return new BadRequestObjectResult("Prediction not found");
            }

            // Validate that the user owns this prediction
            if (prediction.UserId != userId)
            {
                Console.WriteLine($"User {userId} trying to publish prediction owned by {prediction.UserId}");
                return new BadRequestObjectResult("You can only publish your own predictions");
            }

            // Update prediction status
            prediction.IsDraft = request.IsDraft;
            prediction.LastModified = DateTime.UtcNow;

            // Create the post based on prediction type
            switch (request.PredictionType)
            {
                case PredictionType.Ranking:
                    if (request.PostRank == null)
                    {
                        Console.WriteLine("PostRank data is null");
                        return new BadRequestObjectResult("PostRank data required for ranking predictions");
                    }

                    // Validate template exists
                    var template = await _unitOfWork.TemplateRepository.GetRankingTemplate(request.TemplateId);
                    if (template == null)
                    {
                        Console.WriteLine($"Template {request.TemplateId} not found");
                        return new BadRequestObjectResult("Template not found");
                    }

                    // Ensure all required fields are set in PostRank
                    request.PostRank.PredictionId = request.PredictionId;
                    request.PostRank.RankingTemplateId = request.TemplateId;
                    request.PostRank.UserId = userId;

                    Console.WriteLine("Creating PostRank...");
                    var rankResult = await CreatePostRankAsync(request.PostRank, userId);

                    if (rankResult.Result is BadRequestObjectResult badResult)
                    {
                        Console.WriteLine($"CreatePostRankAsync failed: {badResult.Value}");
                        return badResult;
                    }

                    Console.WriteLine("PostRank created successfully");
                    break;

                case PredictionType.Bracket:
                    return new BadRequestObjectResult("Bracket publishing not yet implemented");

                case PredictionType.Bingo:
                    return new BadRequestObjectResult("Bingo publishing not yet implemented");

                default:
                    return new BadRequestObjectResult("Invalid prediction type");
            }

            // Update the prediction
            Console.WriteLine("Updating prediction...");
            await _unitOfWork.PredictionRepository.UpdatePredictionAsync(prediction);
            await _unitOfWork.Complete();

            Console.WriteLine("Post published successfully");
            return new OkObjectResult(new
            {
                message = "Post published successfully",
                predictionId = prediction.Id,
                isDraft = request.IsDraft
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in PublishPostAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return new BadRequestObjectResult($"Error publishing post: {ex.Message}");
        }
    }

    // Replace GetPublishedPostsAsync method in PostService.cs
    // This copies the logic from "My Predictions" but for ALL users

    public async Task<ActionResult<List<PublishedPostDTO>>> GetPublishedPostsAsync(int pageNumber, int pageSize, string? predictionType, string? searchTerm)
    {
        try
        {
            Console.WriteLine("=== PUBLISHED POSTS: Getting all public predictions ===");

            // Get ALL predictions from ALL users (not just current user)
            var allPredictions = await _unitOfWork.PredictionRepository.GetAllPublishedPredictionsAsync(
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            Console.WriteLine($"Found {allPredictions?.Count ?? 0} total predictions from database");

            var publishedPosts = new List<PublishedPostDTO>();

            if (allPredictions != null && allPredictions.Any())
            {
                foreach (var prediction in allPredictions)
                {
                    try
                    {
                        // Only include predictions that are published (not drafts) and public
                        if (prediction.IsDraft)
                        {
                            Console.WriteLine($"Skipping draft prediction: {prediction.Title} (ID: {prediction.Id})");
                            continue;
                        }

                        if (prediction.PrivacyType != PrivacyType.Public)
                        {
                            Console.WriteLine($"Skipping non-public prediction: {prediction.Title} (ID: {prediction.Id})");
                            continue;
                        }

                        // Get categories
                        var categories = await _unitOfWork.CategoryRepository.GetPredictionCategoriesByIdsAsync(prediction.Id);

                        var post = new PublishedPostDTO
                        {
                            Id = prediction.Id,
                            Title = prediction.Title ?? "Untitled Prediction",
                            Description = prediction.Description ?? "",
                            PredictionType = prediction.PredictionType,
                            CreatedAt = prediction.CreatedAt,
                            EndDate = prediction.EndDate,
                            IsActive = prediction.IsActive,
                            Author = _mapper.Map<MemberDTO>(prediction.User),
                            Categories = _mapper.Map<List<CategoryDTO>>(categories),
                            CounterPredictionsCount = GetCounterPredictionsCount(prediction),
                            CanCounterPredict = true, // Will be determined on frontend
                            Notes = prediction.Description ?? ""
                        };

                        publishedPosts.Add(post);
                        Console.WriteLine($"Added published post: {post.Title} (ID: {post.Id}) by {post.Author?.DisplayName}");
                    }
                    catch (Exception postEx)
                    {
                        Console.WriteLine($"Error processing prediction {prediction?.Id}: {postEx.Message}");
                        continue;
                    }
                }
            }

            // Apply filters if provided
            if (!string.IsNullOrEmpty(predictionType))
            {
                publishedPosts = publishedPosts.Where(p => p.PredictionType.ToString().Equals(predictionType, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var searchLower = searchTerm.ToLower();
                publishedPosts = publishedPosts.Where(p =>
                    p.Title.ToLower().Contains(searchLower) ||
                    p.Description.ToLower().Contains(searchLower) ||
                    (p.Author?.DisplayName?.ToLower().Contains(searchLower) ?? false)
                ).ToList();
            }

            // Apply pagination
            var pagedPosts = publishedPosts
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            Console.WriteLine($"Returning {pagedPosts.Count} published posts (filtered from {publishedPosts.Count} total)");
            return new OkObjectResult(pagedPosts);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetPublishedPostsAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return new BadRequestObjectResult($"Error fetching published posts: {ex.Message}");

        }
    }

    public async Task<ActionResult<List<UserPostSummaryDTO>>> GetUserPostsAsync(int userId)
    {
        try
        {
            Console.WriteLine($"PostService: Getting posts for user ID: {userId}");

            // Get all predictions by the current user
            var predictions = await _unitOfWork.PredictionRepository.GetPredictionsByUserIdAsync(
                userId,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            Console.WriteLine($"PostService: Found {predictions?.Count ?? 0} predictions for user {userId}");

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
                        Console.WriteLine($"PostService: Added post: {post.Title} (ID: {post.Id})");
                    }
                    catch (Exception postEx)
                    {
                        Console.WriteLine($"PostService: Error processing prediction {prediction?.Id}: {postEx.Message}");
                        // Continue processing other posts
                    }
                }
            }

            Console.WriteLine($"PostService: Returning {userPosts.Count} user posts");
            return new OkObjectResult(userPosts);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"PostService: Error getting user posts: {ex.Message}");
            Console.WriteLine($"PostService: Stack trace: {ex.StackTrace}");
            return new BadRequestObjectResult($"Error retrieving user posts: {ex.Message}");
        }
    }

    public async Task<ActionResult<PostDetailDTO>> GetPostDetailsAsync(int predictionId, int currentUserId)
    {
        try
        {
            Console.WriteLine($"Getting post details for prediction {predictionId}");

            // First get the prediction with all related data
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
                predictionId,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            if (prediction == null)
            {
                return new NotFoundObjectResult("Prediction not found");
            }

            // Get the author information
            var author = await _unitOfWork.UserRepository.GetUserByIdAsync(prediction.UserId ?? 0, false, false, true);

            // Get categories
            var categories = await _unitOfWork.CategoryRepository.GetPredictionCategoriesByIdsAsync(predictionId);

            // Build the response
            var postDetail = new PostDetailDTO
            {
                Id = prediction.Id,
                Title = prediction.Title,
                Description = prediction.Description,
                PredictionType = prediction.PredictionType,
                CreatedAt = prediction.CreatedAt,
                StartDate = prediction.StartDate,
                EndDate = prediction.EndDate,
                Author = _mapper.Map<MemberDTO>(author),
                Categories = _mapper.Map<List<CategoryDTO>>(categories),
                Notes = prediction.Description,
                IsActive = prediction.IsActive,
                CanCounterPredict = CanUserCounterPredict(prediction, currentUserId),
                HasUserCounterPredicted = HasUserCounterPredicted(prediction, currentUserId),
                CounterPredictionsCount = GetCounterPredictionsCount(prediction),
                CounterPredictions = new List<CounterPredictionDTO>()
            };

            // Get the ORIGINAL post data based on prediction type
            switch (prediction.PredictionType)
            {
                case PredictionType.Ranking:
                    // Find the original post rank (created by the prediction owner)
                    var originalPostRank = prediction.PostRanks
                        .FirstOrDefault(pr => pr.UserId == prediction.UserId);

                    if (originalPostRank != null)
                    {
                        postDetail.OriginalPostRank = _mapper.Map<PostRankDTO>(originalPostRank);
                        Console.WriteLine($"Found original PostRank with {originalPostRank.RankTable?.Rows?.Count ?? 0} rows");
                    }

                    // Get counter predictions (posts by other users)
                    var counterRanks = prediction.PostRanks
                        .Where(pr => pr.UserId != prediction.UserId)
                        .ToList();

                    foreach (var counterRank in counterRanks)
                    {
                        var counterUser = await _unitOfWork.UserRepository.GetUserByIdAsync(counterRank.UserId, false, false, true);
                        postDetail.CounterPredictions.Add(new CounterPredictionDTO
                        {
                            Id = counterRank.Id,
                            Author = _mapper.Map<MemberDTO>(counterUser),
                            CreatedAt = counterRank.CreatedAt,
                            Notes = "", // Add notes field to PostRank if needed
                            TotalScore = counterRank.TotalScore,
                            PostRank = _mapper.Map<PostRankDTO>(counterRank)
                        });
                    }
                    break;

                case PredictionType.Bracket:
                    // Find the original post bracket
                    var originalPostBracket = prediction.PostBrackets
                        .FirstOrDefault(pb => pb.UserId == prediction.UserId);

                    if (originalPostBracket != null)
                    {
                        postDetail.OriginalPostBracket = _mapper.Map<PostBracketDTO>(originalPostBracket);
                        Console.WriteLine($"Found original PostBracket");
                    }

                    // Get counter predictions for brackets
                    var counterBrackets = prediction.PostBrackets
                        .Where(pb => pb.UserId != prediction.UserId)
                        .ToList();

                    foreach (var counterBracket in counterBrackets)
                    {
                        var counterUser = await _unitOfWork.UserRepository.GetUserByIdAsync(counterBracket.UserId, false, false, true);
                        postDetail.CounterPredictions.Add(new CounterPredictionDTO
                        {
                            Id = counterBracket.Id,
                            Author = _mapper.Map<MemberDTO>(counterUser),
                            CreatedAt = counterBracket.CreatedAt,
                            Notes = "",
                            TotalScore = counterBracket.TotalScore,
                            PostBracket = _mapper.Map<PostBracketDTO>(counterBracket)
                        });
                    }
                    break;

                case PredictionType.Bingo:
                    // Find the original post bingo
                    var originalPostBingo = prediction.PostBingos
                        .FirstOrDefault(pb => pb.UserId == prediction.UserId);

                    if (originalPostBingo != null)
                    {
                        postDetail.OriginalPostBingo = _mapper.Map<PostBingoDTO>(originalPostBingo);
                        Console.WriteLine($"Found original PostBingo with {originalPostBingo.BingoCells?.Count ?? 0} cells");
                    }

                    // Get counter predictions for bingo
                    var counterBingos = prediction.PostBingos
                        .Where(pb => pb.UserId != prediction.UserId)
                        .ToList();

                    foreach (var counterBingo in counterBingos)
                    {
                        var counterUser = await _unitOfWork.UserRepository.GetUserByIdAsync(counterBingo.UserId, false, false, true);
                        postDetail.CounterPredictions.Add(new CounterPredictionDTO
                        {
                            Id = counterBingo.Id,
                            Author = _mapper.Map<MemberDTO>(counterUser),
                            CreatedAt = counterBingo.CreatedAt,
                            Notes = "",
                            TotalScore = counterBingo.TotalScore,
                            PostBingo = _mapper.Map<PostBingoDTO>(counterBingo)
                        });
                    }
                    break;
            }

            Console.WriteLine($"Returning post details with {postDetail.CounterPredictions.Count} counter predictions");
            return new OkObjectResult(postDetail);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting post details: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return new BadRequestObjectResult($"Error fetching post details: {ex.Message}");
        }
    }

    public async Task<ActionResult<PostRankDTO>> CreateCounterPredictionAsync(int originalPredictionId, CounterPredictionRequestDTO request, int userId)
    {
        try
        {
            var originalPrediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(originalPredictionId);
            if (originalPrediction == null)
                return new NotFoundObjectResult("Original prediction not found");

            if (!CanUserCounterPredict(originalPrediction, userId))
                return new BadRequestObjectResult("You cannot create a counter prediction for this post");

            // Create counter prediction based on type
            switch (originalPrediction.PredictionType)
            {
                case PredictionType.Ranking:
                    if (request.PostRank != null)
                    {
                        request.PostRank.PredictionId = originalPredictionId;
                        var result = await CreatePostRankAsync(request.PostRank, userId);
                        return result;
                    }
                    break;

                case PredictionType.Bracket:
                    // Implement bracket counter prediction
                    break;

                case PredictionType.Bingo:
                    // Implement bingo counter prediction
                    break;
            }

            return new BadRequestObjectResult("Invalid counter prediction data");
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error creating counter prediction: {ex.Message}");
        }
    }

    #region Helper Methods

    private bool CanUserCounterPredict(Prediction prediction, int userId)
    {
        return !prediction.IsDraft &&
               prediction.IsActive &&
               prediction.UserId != userId &&
               !HasUserCounterPredicted(prediction, userId);
    }

    private bool HasUserCounterPredicted(Prediction prediction, int userId)
    {
        switch (prediction.PredictionType)
        {
            case PredictionType.Ranking:
                return prediction.PostRanks.Any(pr => pr.UserId == userId && pr.UserId != prediction.UserId);
            case PredictionType.Bracket:
                return prediction.PostBrackets.Any(pb => pb.UserId == userId && pb.UserId != prediction.UserId);
            case PredictionType.Bingo:
                return prediction.PostBingos.Any(pb => pb.UserId == userId && pb.UserId != prediction.UserId);
        }
        return false;
    }

    private int GetCounterPredictionsCount(Prediction prediction)
    {
        switch (prediction.PredictionType)
        {
            case PredictionType.Ranking:
                return prediction.PostRanks.Count(pr => pr.UserId != prediction.UserId);
            case PredictionType.Bracket:
                return prediction.PostBrackets.Count(pb => pb.UserId != prediction.UserId);
            case PredictionType.Bingo:
                return prediction.PostBingos.Count(pb => pb.UserId != prediction.UserId);
        }
        return 0;
    }

    private List<CounterPredictionDTO> GetCounterPredictions(Prediction prediction, int currentUserId)
    {
        var counterPredictions = new List<CounterPredictionDTO>();

        switch (prediction.PredictionType)
        {
            case PredictionType.Ranking:
                foreach (var postRank in prediction.PostRanks.Where(pr => pr.UserId != prediction.UserId))
                {
                    counterPredictions.Add(new CounterPredictionDTO
                    {
                        Id = postRank.Id,
                        Author = _mapper.Map<MemberDTO>(postRank.User),
                        CreatedAt = postRank.CreatedAt,
                        TotalScore = postRank.TotalScore,
                        PostRank = _mapper.Map<PostRankDTO>(postRank)
                    });
                }
                break;
        }

        return counterPredictions;
    }

    #endregion

    #region Other Interface Methods (keeping existing implementation)

    public async Task<ActionResult> UpdatePostRankAsync(PostRankDTO postRank)
    {
        try
        {
            var existingPostRank = await _unitOfWork.PostRepository.GetPostRank(postRank.Id);
            if (existingPostRank == null)
                return new NotFoundObjectResult("Post rank not found");

            var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(postRank.RankingTemplateId);
            if (rankingTemplate == null)
                return new BadRequestObjectResult("Ranking template not found");

            // Update the existing post rank
            existingPostRank.UpdatedAt = DateTime.UtcNow;
            existingPostRank.TotalScore = postRank.TotalScore;
            existingPostRank.IsOfficialResult = postRank.IsOfficialResult;

            // Update RankTable structure
            if (existingPostRank.RankTable != null)
            {
                existingPostRank.RankTable.NumberOfRows = postRank.RankTable.NumberOfRows;
                existingPostRank.RankTable.NumberOfColumns = postRank.RankTable.NumberOfColumns;

                // Clear existing rows and rebuild
                existingPostRank.RankTable.Rows.Clear();

                foreach (var rowDto in postRank.RankTable.Rows)
                {
                    var row = new Row
                    {
                        Order = rowDto.Order,
                        IsWrong = rowDto.IsWrong,
                        Columns = new List<Column>()
                    };

                    foreach (var columnDto in rowDto.Columns)
                    {
                        var column = new Column
                        {
                            Order = columnDto.Order,
                            OfficialScore = columnDto.OfficialScore,
                            Team = null
                        };

                        // Handle team assignment
                        if (columnDto.Team != null)
                        {
                            var team = await _unitOfWork.TeamRepository.GetTeamAsync(columnDto.Team.Id);
                            if (team != null)
                            {
                                column.Team = team;
                            }
                        }

                        row.Columns.Add(column);
                    }

                    existingPostRank.RankTable.Rows.Add(row);
                }
            }

            await _unitOfWork.PostRepository.UpdatePostRank(existingPostRank);
            await _unitOfWork.Complete();

            return new OkObjectResult("Post rank updated successfully");
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error updating post rank: {ex.Message}");
        }
    }

    public async Task<ActionResult> DeletePostRankAsync(int postRankId)
    {
        try
        {
            var result = await _unitOfWork.PostRepository.DeletePostRank(postRankId);
            if (!result)
                return new NotFoundObjectResult("Post rank not found");

            return new OkObjectResult("Post rank deleted successfully");
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error deleting post rank: {ex.Message}");
        }
    }

    public async Task<ActionResult<PostRankDTO>> GetPostRankAsync(int id)
    {
        try
        {
            var postRank = await _unitOfWork.PostRepository.GetPostRank(id);
            if (postRank == null)
                return new NotFoundObjectResult("Post rank not found");

            return new OkObjectResult(_mapper.Map<PostRankDTO>(postRank));
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error getting post rank: {ex.Message}");
        }
    }

    public async Task<List<PostRankDTO>> GetPostRanksAsync()
    {
        var postRanks = await _unitOfWork.PostRepository.GetPostRanks();
        return _mapper.Map<List<PostRankDTO>>(postRanks);
    }

    public async Task<List<PostRankDTO>> GetPostRanksByUserIdAsync(int userId)
    {
        throw new NotImplementedException("GetPostRanksByUserIdAsync not implemented");
    }

    public async Task<List<PostRankDTO>> GetPostRanksByTemplateIdAsync(int templateId)
    {
        throw new NotImplementedException("GetPostRanksByTemplateIdAsync not implemented");
    }

    #endregion

    #region PostBracket - Stub implementations
    public async Task<ActionResult<PostBracketDTO>> CreatePostBracketAsync(PostBracketDTO userPostBracket, int userId)
    {
        throw new NotImplementedException("CreatePostBracketAsync not implemented");
    }

    public async Task<bool> UpdatePostBracketAsync(PostBracketDTO userPostBracket)
    {
        throw new NotImplementedException("UpdatePostBracketAsync not implemented");
    }

    public async Task<bool> DeletePostBracketAsync(int postBracketId)
    {
        throw new NotImplementedException("DeletePostBracketAsync not implemented");
    }

    public async Task<ActionResult<PostBracketDTO?>> GetPostBracketAsync(int postBracketId)
    {
        throw new NotImplementedException("GetPostBracketAsync not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsAsync()
    {
        throw new NotImplementedException("GetPostBracketsAsync not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsByUserIdAsync(int userId)
    {
        throw new NotImplementedException("GetPostBracketsByUserIdAsync not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsByTemplateIdAsync(int templateId)
    {
        throw new NotImplementedException("GetPostBracketsByTemplateIdAsync not implemented");
    }
    #endregion

    #region PostBingo - Stub implementations
    public async Task<ActionResult> PublishBingoPostAsync(PublishPostRequestDTO request, int userId)
    {
        try
        {
            Console.WriteLine("=== PublishBingoPostAsync called ===");
            Console.WriteLine($"PredictionId: {request.PredictionId}");
            Console.WriteLine($"TemplateId: {request.TemplateId}");
            Console.WriteLine($"PredictionType: {request.PredictionType}");
            Console.WriteLine($"UserId: {userId}");

            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine("User not found");
                return new BadRequestObjectResult("User not found");
            }

            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(request.PredictionId);
            if (prediction == null)
            {
                Console.WriteLine("Prediction not found");
                return new BadRequestObjectResult("Prediction not found");
            }

            // Validate that the user owns this prediction
            if (prediction.UserId != userId)
            {
                Console.WriteLine($"User {userId} trying to publish prediction owned by {prediction.UserId}");
                return new BadRequestObjectResult("You can only publish your own predictions");
            }

            // Validate template exists
            var template = await _unitOfWork.TemplateRepository.GetBingoTemplate(request.TemplateId);
            if (template == null)
            {
                Console.WriteLine($"Bingo template {request.TemplateId} not found");
                return new BadRequestObjectResult("Bingo template not found");
            }

            // Ensure all required fields are set in PostBingo
            request.PostBingo.UserId = userId;

            Console.WriteLine("Creating PostBingo...");
            var bingoResult = await CreatePostBingoAsync(request.PostBingo, request.PredictionId, userId);

            if (bingoResult.Result is BadRequestObjectResult badResult)
            {
                Console.WriteLine($"CreatePostBingoAsync failed: {badResult.Value}");
                return badResult;
            }

            Console.WriteLine("PostBingo created successfully");

            // Update prediction status
            prediction.IsDraft = request.IsDraft;
            prediction.LastModified = DateTime.UtcNow;

            Console.WriteLine("Updating prediction...");
            await _unitOfWork.PredictionRepository.UpdatePredictionAsync(prediction);
            await _unitOfWork.Complete();

            Console.WriteLine("Bingo post published successfully");
            return new OkObjectResult(new
            {
                message = "Bingo post published successfully",
                predictionId = prediction.Id,
                isDraft = request.IsDraft
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in PublishBingoPostAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return new BadRequestObjectResult($"Error publishing bingo post: {ex.Message}");
        }
    }

    public async Task<ActionResult<PostBingoDTO>> CreatePostBingoAsync(PostBingoDTO postBingoDTO, int predictionId, int userId)
    {
        try
        {
            Console.WriteLine("=== CreatePostBingoAsync called ===");
            Console.WriteLine($"PostBingo GridSize: {postBingoDTO.GridSize}");
            Console.WriteLine($"PredictionId: {predictionId}");
            Console.WriteLine($"UserId: {userId}");
            Console.WriteLine($"BingoCells count: {postBingoDTO.BingoCells?.Count ?? 0}");

            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine("User not found");
                return new BadRequestObjectResult("User not found");
            }

            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(predictionId);
            if (prediction == null)
            {
                Console.WriteLine("Prediction not found");
                return new BadRequestObjectResult("Prediction not found");
            }

            // Create PostBingo entity
            var postBingoEntity = new PostBingo
            {
                UserId = userId,
                User = user,
                PredictionId = predictionId,
                Prediction = prediction,
                GridSize = postBingoDTO.GridSize,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                TotalScore = postBingoDTO.TotalScore,
                IsOfficialResult = postBingoDTO.IsOfficialResult,
                Teams = new List<Team>(),
                BingoCells = new List<BingoCell>()
            };

            // Create BingoCells
            foreach (var cellDto in postBingoDTO.BingoCells)
            {
                var cell = new BingoCell
                {
                    Row = cellDto.Row,
                    Column = cellDto.Column,
                    Score = cellDto.Score,
                    OfficialScore = cellDto.OfficialScore,
                    IsWrong = cellDto.IsWrong,
                    Team = null
                };

                // Handle team assignment
                if (cellDto.Team != null)
                {
                    var team = await _unitOfWork.TeamRepository.GetTeamAsync(cellDto.Team.Id);
                    if (team != null)
                    {
                        cell.Team = team;
                        cell.TeamId = team.Id;
                        if (!postBingoEntity.Teams.Any(t => t.Id == team.Id))
                        {
                            postBingoEntity.Teams.Add(team);
                        }
                    }
                    else
                    {
                        Console.WriteLine($"Warning: Team with ID {cellDto.Team.Id} not found");
                    }
                }

                postBingoEntity.BingoCells.Add(cell);
            }

            Console.WriteLine($"Created PostBingo with {postBingoEntity.BingoCells.Count} cells, {postBingoEntity.Teams.Count} unique teams");

            // Save to database
            var createdPostBingo = await _unitOfWork.PostRepository.CreatePostBingo(postBingoEntity);
            var saveResult = await _unitOfWork.Complete();

            if (!saveResult)
            {
                Console.WriteLine("Failed to save to database");
                return new BadRequestObjectResult("Failed to save post bingo to database");
            }

            Console.WriteLine("PostBingo created successfully");
            var resultDto = _mapper.Map<PostBingoDTO>(createdPostBingo);
            return new OkObjectResult(resultDto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreatePostBingoAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return new BadRequestObjectResult($"Error creating post bingo: {ex.Message}");
        }
    }


    public async Task<ActionResult> UpdatePostBingoAsync(PostBingoDTO userPostBingo)
    {
        throw new NotImplementedException("UpdatePostBingoAsync not implemented");
    }

    public async Task<ActionResult> DeletePostBingoAsync(int postBingoId)
    {
        throw new NotImplementedException("DeletePostBingoAsync not implemented");
    }

    public async Task<ActionResult<PostBingoDTO?>> GetPostBingoAsync(int postBingoId)
    {
        throw new NotImplementedException("GetPostBingoAsync not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosAsync()
    {
        throw new NotImplementedException("GetPostBingosAsync not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosByUserIdAsync(int userId)
    {
        throw new NotImplementedException("GetPostBingosByUserIdAsync not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosByTemplateIdAsync(int templateId)
    {
        throw new NotImplementedException("GetPostBingosByTemplateIdAsync not implemented");
    }

    #endregion
    #endregion
    public async Task<ActionResult> PublishResultsAsync(PublishResultsRequestDTO request, int userId)
    {
        try
        {
            Console.WriteLine("=== PublishResultsAsync called ===");
            
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                return new BadRequestObjectResult("User not found");
            }

            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
                request.PredictionId,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            if (prediction == null)
            {
                return new BadRequestObjectResult("Prediction not found");
            }

            // Create official results post based on prediction type
            switch (request.PredictionType)
            {
                case PredictionType.Ranking:
                    if (request.ResultsPostRank == null)
                    {
                        return new BadRequestObjectResult("Results ranking data is required");
                    }
                    
                    request.ResultsPostRank.PredictionId = request.PredictionId;
                    request.ResultsPostRank.UserId = userId;
                    request.ResultsPostRank.IsOfficialResult = true;
                    
                    var rankResult = await CreatePostRankAsync(request.ResultsPostRank, userId);
                    if (rankResult.Result is BadRequestObjectResult)
                    {
                        return rankResult.Result;
                    }

                    // Calculate scores for all counter predictions
                    await CalculateRankingScoresAsync(prediction, request.ResultsPostRank);
                    break;

                case PredictionType.Bingo:
                    if (request.ResultsPostBingo == null)
                    {
                        return new BadRequestObjectResult("Results bingo data is required");
                    }
                    
                    request.ResultsPostBingo.UserId = userId;
                    request.ResultsPostBingo.IsOfficialResult = true;
                    
                    var bingoResult = await CreatePostBingoAsync(request.ResultsPostBingo, request.PredictionId, userId);
                    if (bingoResult.Result is BadRequestObjectResult)
                    {
                        return bingoResult.Result;
                    }

                    // Calculate scores for all counter predictions
                    await CalculateBingoScoresAsync(prediction, request.ResultsPostBingo);
                    break;

                case PredictionType.Bracket:
                    // Implement bracket results when bracket system is ready
                    return new BadRequestObjectResult("Bracket results publishing not yet implemented");

                default:
                    return new BadRequestObjectResult("Invalid prediction type");
            }

            // Mark prediction as having results
            prediction.LastModified = DateTime.UtcNow;
            await _unitOfWork.PredictionRepository.UpdatePredictionAsync(prediction);
            await _unitOfWork.Complete();

            Console.WriteLine("Results published and scores calculated successfully");
            return new OkObjectResult(new
            {
                message = "Results published and scores calculated successfully",
                predictionId = prediction.Id
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in PublishResultsAsync: {ex.Message}");
            return new BadRequestObjectResult($"Error publishing results: {ex.Message}");
        }
    }

    public async Task<ActionResult<PredictionResultsDTO>> GetPredictionResultsAsync(int predictionId, int currentUserId)
    {
        try
        {
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
                predictionId,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            if (prediction == null)
            {
                return new NotFoundObjectResult("Prediction not found");
            }

            var results = new PredictionResultsDTO
            {
                PredictionId = prediction.Id,
                Title = prediction.Title,
                PredictionType = prediction.PredictionType,
                Author = _mapper.Map<MemberDTO>(prediction.User)
            };

            // Get official results and scored counter predictions
            switch (prediction.PredictionType)
            {
                case PredictionType.Ranking:
                    var officialRanking = prediction.PostRanks.FirstOrDefault(pr => pr.IsOfficialResult);
                    if (officialRanking != null)
                    {
                        results.OfficialResults = _mapper.Map<PostRankDTO>(officialRanking);
                        results.ResultsPublishedAt = officialRanking.CreatedAt;
                        
                        // Get all counter predictions with scores
                        var counterRankings = prediction.PostRanks
                            .Where(pr => !pr.IsOfficialResult)
                            .OrderByDescending(pr => pr.TotalScore)
                            .ToList();

                        results.ScoredCounterPredictions = await MapScoredRankingCounterPredictions(counterRankings);
                    }
                    break;

                case PredictionType.Bingo:
                    var officialBingo = prediction.PostBingos.FirstOrDefault(pb => pb.IsOfficialResult);
                    if (officialBingo != null)
                    {
                        results.OfficialBingoResults = _mapper.Map<PostBingoDTO>(officialBingo);
                        results.ResultsPublishedAt = officialBingo.CreatedAt;
                        
                        // Get all counter predictions with scores
                        var counterBingos = prediction.PostBingos
                            .Where(pb => !pb.IsOfficialResult)
                            .OrderByDescending(pb => pb.TotalScore)
                            .ToList();

                        results.ScoredCounterPredictions = await MapScoredBingoCounterPredictions(counterBingos);
                    }
                    break;
            }

            // Calculate summary statistics
            results.Stats = CalculateResultsStats(results.ScoredCounterPredictions);

            return new OkObjectResult(results);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetPredictionResultsAsync: {ex.Message}");
            return new BadRequestObjectResult($"Error fetching prediction results: {ex.Message}");
        }
    }

    public async Task<ActionResult> RecalculateScoresAsync(int predictionId)
    {
        try
        {
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
                predictionId,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            if (prediction == null)
            {
                return new NotFoundObjectResult("Prediction not found");
            }

            switch (prediction.PredictionType)
            {
                case PredictionType.Ranking:
                    var officialRanking = prediction.PostRanks.FirstOrDefault(pr => pr.IsOfficialResult);
                    if (officialRanking != null)
                    {
                        var officialRankDTO = _mapper.Map<PostRankDTO>(officialRanking);
                        await CalculateRankingScoresAsync(prediction, officialRankDTO);
                    }
                    break;

                case PredictionType.Bingo:
                    var officialBingo = prediction.PostBingos.FirstOrDefault(pb => pb.IsOfficialResult);
                    if (officialBingo != null)
                    {
                        var officialBingoDTO = _mapper.Map<PostBingoDTO>(officialBingo);
                        await CalculateBingoScoresAsync(prediction, officialBingoDTO);
                    }
                    break;
            }

            await _unitOfWork.Complete();

            return new OkObjectResult(new { message = "Scores recalculated successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in RecalculateScoresAsync: {ex.Message}");
            return new BadRequestObjectResult($"Error recalculating scores: {ex.Message}");
        }
    }

    #region Private Helper Methods

    private async Task CalculateRankingScoresAsync(Prediction prediction, PostRankDTO officialResults)
    {
        try
        {
            Console.WriteLine("=== Calculating Ranking Scores ===");
            
            var counterPredictions = prediction.PostRanks.Where(pr => !pr.IsOfficialResult).ToList();
            
            foreach (var counterPrediction in counterPredictions)
            {
                int totalScore = 0; // Changed from float to int
                int correctCount = 0;
                int totalPositions = 0;

                // Compare each position in the ranking
                if (counterPrediction.RankTable?.Rows != null && officialResults.RankTable?.Rows != null)
                {
                    // Convert ICollection to List for indexing
                    var counterRows = counterPrediction.RankTable.Rows.ToList();
                    var officialRows = officialResults.RankTable.Rows.ToList();

                    for (int rowIndex = 0; rowIndex < Math.Min(counterRows.Count, officialRows.Count); rowIndex++)
                    {
                        var counterRow = counterRows[rowIndex];
                        var officialRow = officialRows[rowIndex];

                        if (counterRow.Columns != null && officialRow.Columns != null)
                        {
                            var counterColumns = counterRow.Columns.ToList();
                            var officialColumns = officialRow.Columns.ToList();

                            for (int colIndex = 0; colIndex < Math.Min(counterColumns.Count, officialColumns.Count); colIndex++)
                            {
                                var counterColumn = counterColumns[colIndex];
                                var officialColumn = officialColumns[colIndex];

                                totalPositions++;

                                if (counterColumn.Team != null && officialColumn.Team != null)
                                {
                                    if (counterColumn.Team.Id == officialColumn.Team.Id)
                                    {
                                        correctCount++;
                                        totalScore += 100; // 100 points for correct position
                                        counterColumn.OfficialScore = 100;
                                    }
                                    else
                                    {
                                        counterColumn.OfficialScore = 0;
                                    }
                                }
                                else if (counterColumn.Team == null && officialColumn.Team == null)
                                {
                                    // Both empty - correct
                                    correctCount++;
                                    totalScore += 100;
                                    counterColumn.OfficialScore = 100;
                                }
                                else
                                {
                                    // One has team, other doesn't - incorrect
                                    counterColumn.OfficialScore = 0;
                                }
                            }
                        }
                    }
                }

                // Update the counter prediction with calculated scores
                counterPrediction.TotalScore = totalScore; // Now int to int assignment
                await _unitOfWork.PostRepository.UpdatePostRank(counterPrediction);
            }

            Console.WriteLine($"Calculated scores for {counterPredictions.Count} ranking counter predictions");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error calculating ranking scores: {ex.Message}");
            throw;
        }
    }

    private async Task CalculateBingoScoresAsync(Prediction prediction, PostBingoDTO officialResults)
    {
        try
        {
            Console.WriteLine("=== Calculating Bingo Scores ===");
            
            var counterPredictions = prediction.PostBingos.Where(pb => !pb.IsOfficialResult).ToList();
            
            foreach (var counterPrediction in counterPredictions)
            {
                int totalScore = 0; // Changed from float to int
                int correctCount = 0;
                int totalCells = 0;

                // Compare each cell in the bingo grid
                if (counterPrediction.BingoCells != null && officialResults.BingoCells != null)
                {
                    var counterCells = counterPrediction.BingoCells.ToList();
                    var officialCells = officialResults.BingoCells.ToList();

                    foreach (var counterCell in counterCells)
                    {
                        // Find corresponding cell in official results by row/column
                        var officialCell = officialCells
                            .FirstOrDefault(oc => oc.Row == counterCell.Row && oc.Column == counterCell.Column);

                        if (officialCell != null)
                        {
                            totalCells++;

                            if (counterCell.Team != null && officialCell.Team != null)
                            {
                                if (counterCell.Team.Id == officialCell.Team.Id)
                                {
                                    correctCount++;
                                    totalScore += 100; // 100 points for correct team
                                    counterCell.OfficialScore = 100;
                                    counterCell.IsWrong = false;
                                }
                                else
                                {
                                    counterCell.OfficialScore = 0;
                                    counterCell.IsWrong = true;
                                }
                            }
                            else if (counterCell.Team == null && officialCell.Team == null)
                            {
                                // Both empty - correct
                                correctCount++;
                                totalScore += 100;
                                counterCell.OfficialScore = 100;
                                counterCell.IsWrong = false;
                            }
                            else
                            {
                                // One has team, other doesn't - incorrect
                                counterCell.OfficialScore = 0;
                                counterCell.IsWrong = true;
                            }
                        }
                    }
                }

                // Update the counter prediction with calculated scores
                counterPrediction.TotalScore = totalScore; // Now int to int assignment
                await _unitOfWork.PostRepository.UpdatePostBingo(counterPrediction);
            }

            Console.WriteLine($"Calculated scores for {counterPredictions.Count} bingo counter predictions");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error calculating bingo scores: {ex.Message}");
            throw;
        }
    }

    private async Task<List<ScoredCounterPredictionDTO>> MapScoredRankingCounterPredictions(List<PostRank> counterRankings)
    {
        var scored = new List<ScoredCounterPredictionDTO>();
        
        for (int i = 0; i < counterRankings.Count; i++)
        {
            var counter = counterRankings[i];
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(counter.UserId);
            
            // Calculate accuracy
            int correctCount = 0;
            int totalPositions = 0;
            
            if (counter.RankTable?.Rows != null)
            {
                var rows = counter.RankTable.Rows.ToList();
                foreach (var row in rows)
                {
                    if (row.Columns != null)
                    {
                        var columns = row.Columns.ToList();
                        foreach (var col in columns)
                        {
                            totalPositions++;
                            if (col.OfficialScore > 0)
                            {
                                correctCount++;
                            }
                        }
                    }
                }
            }

            float accuracy = totalPositions > 0 ? (float)correctCount / totalPositions * 100 : 0;

            scored.Add(new ScoredCounterPredictionDTO
            {
                Id = counter.Id,
                Author = _mapper.Map<MemberDTO>(user),
                CreatedAt = counter.CreatedAt,
                TotalScore = counter.TotalScore,
                CorrectCount = correctCount,
                IncorrectCount = totalPositions - correctCount,
                AccuracyPercentage = accuracy,
                Rank = i + 1,
                ScoredPostRank = _mapper.Map<PostRankDTO>(counter)
            });
        }

        return scored;
    }

    private async Task<List<ScoredCounterPredictionDTO>> MapScoredBingoCounterPredictions(List<PostBingo> counterBingos)
    {
        var scored = new List<ScoredCounterPredictionDTO>();
        
        for (int i = 0; i < counterBingos.Count; i++)
        {
            var counter = counterBingos[i];
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(counter.UserId);
            
            // Calculate accuracy
            var cells = counter.BingoCells?.ToList() ?? new List<BingoCell>();
            int correctCount = cells.Count(cell => cell.OfficialScore > 0);
            int totalCells = cells.Count;
            float accuracy = totalCells > 0 ? (float)correctCount / totalCells * 100 : 0;

            scored.Add(new ScoredCounterPredictionDTO
            {
                Id = counter.Id,
                Author = _mapper.Map<MemberDTO>(user),
                CreatedAt = counter.CreatedAt,
                TotalScore = counter.TotalScore,
                CorrectCount = correctCount,
                IncorrectCount = totalCells - correctCount,
                AccuracyPercentage = accuracy,
                Rank = i + 1,
                ScoredPostBingo = _mapper.Map<PostBingoDTO>(counter)
            });
        }

        return scored;
    }

    private PredictionResultsStatsDTO CalculateResultsStats(List<ScoredCounterPredictionDTO> scoredPredictions)
    {
        if (!scoredPredictions.Any())
        {
            return new PredictionResultsStatsDTO();
        }

        var uniqueParticipants = scoredPredictions
            .GroupBy(sp => sp.Author.Id)
            .Count();

        var avgAccuracy = scoredPredictions.Average(sp => sp.AccuracyPercentage);
        var highestAccuracy = scoredPredictions.Max(sp => sp.AccuracyPercentage);
        var lowestAccuracy = scoredPredictions.Min(sp => sp.AccuracyPercentage);
        var bestPrediction = scoredPredictions.OrderByDescending(sp => sp.AccuracyPercentage).First();

        return new PredictionResultsStatsDTO
        {
            TotalCounterPredictions = scoredPredictions.Count,
            TotalParticipants = uniqueParticipants,
            AverageAccuracy = avgAccuracy,
            HighestAccuracy = highestAccuracy,
            LowestAccuracy = lowestAccuracy,
            BestPrediction = bestPrediction
        };
    }

    #endregion

    // ... rest of existing methods remain the same ...
}