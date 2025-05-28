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
            Console.WriteLine($"PostRank ID: {postRank.Id}");
            Console.WriteLine($"TemplateId: {postRank.RankingTemplateId}");
            Console.WriteLine($"PredictionId: {postRank.PredictionId}");
            Console.WriteLine($"UserId: {userId}");

            var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(postRank.RankingTemplateId);
            if (rankingTemplate == null)
            {
                Console.WriteLine("Ranking template not found");
                return new BadRequestObjectResult("Ranking template not found");
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
                PostRank = postRankEntity, // Set the relationship
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
                    IsWrong = false,
                    Columns = new List<Column>()
                };

                // Create Columns with proper relationships
                foreach (var columnDto in rowDto.Columns)
                {
                    var column = new Column
                    {
                        Order = columnDto.Order,
                        OfficialScore = columnDto.OfficialScore,
                        Team = null // Will be set below
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
                    }

                    row.Columns.Add(column);
                }

                rankTable.Rows.Add(row);
            }

            // Save to database - Let EF Core handle the relationships through navigation properties
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
            return new BadRequestObjectResult($"Error creating post rank: {ex.Message}");
        }
    }

    // FIXED: PublishPostAsync with proper error handling and validation
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

    public async Task<ActionResult<List<PublishedPostDTO>>> GetPublishedPostsAsync(int pageNumber, int pageSize, string? predictionType, string? searchTerm)
    {
        try
        {
            // This would typically be a more complex query joining predictions with their posts
            // For now, return a placeholder implementation
            var publishedPosts = new List<PublishedPostDTO>();
            return new OkObjectResult(publishedPosts);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error fetching published posts: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<PostRankDTO>>> GetUserPostsAsync(int userId)
    {
        try
        {
            var predictions = await _unitOfWork.PredictionRepository.GetPredictionsByUserIdAsync(userId, false, true, false, false);
            var userPosts = new List<UserPostSummaryDTO>();

            foreach (var prediction in predictions)
            {
                var post = new UserPostSummaryDTO
                {
                    Id = prediction.Id,
                    Title = prediction.Title,
                    PredictionType = prediction.PredictionType,
                    CreatedAt = prediction.CreatedAt,
                    EndDate = prediction.EndDate,
                    IsDraft = prediction.IsDraft,
                    IsActive = prediction.IsActive,
                    CounterPredictionsCount = GetCounterPredictionsCount(prediction),
                    Notes = "" // Add notes if available
                };

                userPosts.Add(post);
            }

            return new OkObjectResult(userPosts);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error fetching user posts: {ex.Message}");
        }
    }

    public async Task<ActionResult<PostDetailDTO>> GetPostDetailsAsync(int predictionId, int currentUserId)
    {
        try
        {
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(predictionId, true, true, false, false);
            if (prediction == null)
                return new NotFoundObjectResult("Prediction not found");

            var author = await _unitOfWork.UserRepository.GetUserByIdAsync(prediction.UserId ?? 0, false, false, true);
            var categories = await _unitOfWork.CategoryRepository.GetPredictionCategoriesByIdsAsync(predictionId);

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
                IsActive = prediction.IsActive,
                CanCounterPredict = CanUserCounterPredict(prediction, currentUserId),
                HasUserCounterPredicted = HasUserCounterPredicted(prediction, currentUserId),
                CounterPredictionsCount = GetCounterPredictionsCount(prediction)
            };

            // Add the original post data based on type
            if (prediction.PredictionType == PredictionType.Ranking && prediction.PostRanks.Any())
            {
                var originalPost = prediction.PostRanks.FirstOrDefault(pr => pr.UserId == prediction.UserId);
                if (originalPost != null)
                {
                    postDetail.OriginalPostRank = _mapper.Map<PostRankDTO>(originalPost);
                }
            }

            // Add counter predictions
            postDetail.CounterPredictions = GetCounterPredictions(prediction, currentUserId);

            return new OkObjectResult(postDetail);
        }
        catch (Exception ex)
        {
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
            var saveResult = await _unitOfWork.Complete();

            if (!saveResult)
            {
                Console.WriteLine("Failed to save prediction changes");
                return new BadRequestObjectResult("Failed to save prediction changes");
            }

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
            Console.WriteLine($"PostBingo ID: {postBingoDTO.Id}");
            Console.WriteLine($"GridSize: {postBingoDTO.GridSize}");
            Console.WriteLine($"UserId: {userId}");

            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine("User not found");
                return new BadRequestObjectResult("User not found");
            }

            // Create PostBingo entity
            var postBingoEntity = new PostBingo
            {
                UserId = userId,
                User = user,
                PredictionId = predictionId,
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
                        if (!postBingoEntity.Teams.Any(t => t.Id == team.Id))
                        {
                            postBingoEntity.Teams.Add(team);
                        }
                    }
                }

                postBingoEntity.BingoCells.Add(cell);
            }

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
}