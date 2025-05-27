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
        var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(postRank.RankingTemplateId) ?? throw new Exception("Ranking template not found");
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId) ?? throw new Exception("User not found");

        var mappedPostRank = _mapper.Map<PostRank>(postRank);
        var rankTable = new RankTable(rankingTemplate.NumberOfRows, rankingTemplate.NumberOfColumns);

        List<Row> rows = new List<Row>();
        for (int i = 0; i < rankTable.NumberOfRows; i++)
        {
            List<Column> columns = [];
            for (int j = 0; j < rankTable.NumberOfColumns; j++)
            {
                columns.Add(new Column());
                columns[j] = _mapper.Map<Column>(postRank.RankTable.Rows[i].Columns[j]);
            }
            rows.Add(new Row(columns));
        }
        rankTable.Rows = rows;

        mappedPostRank.User = user;
        mappedPostRank.UserId = userId;

        var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(postRank.PredictionId) ?? throw new Exception("Prediction not found");
        mappedPostRank.Prediction = prediction;
        mappedPostRank.RankTable = rankTable;
        rankingTemplate.PostRanks.Add(mappedPostRank);
        await _unitOfWork.PostRepository.CreatePostRank(mappedPostRank);
        user.PostRanks.Add(mappedPostRank);
        await _unitOfWork.Complete();

        return _mapper.Map<PostRankDTO>(mappedPostRank);
    }

    public async Task<ActionResult<PostRankDTO>> PublishPostAsync(PublishPostRequestDTO request, int userId)
    {
        try
        {
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId) ?? throw new Exception("User not found");
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(request.PredictionId) ?? throw new Exception("Prediction not found");

            // Update prediction status
            prediction.IsDraft = request.IsDraft;
            prediction.LastModified = DateTime.UtcNow;

            // Create the post based on prediction type
            switch (request.PredictionType)
            {
                case PredictionType.Ranking:
                    if (request.PostRank == null) throw new Exception("PostRank data required for ranking predictions");
                    request.PostRank.PredictionId = request.PredictionId;
                    var rankResult = await CreatePostRankAsync(request.PostRank, userId);
                    break;

                case PredictionType.Bracket:
                    if (request.PostBracket == null) throw new Exception("PostBracket data required for bracket predictions");
                    // Implement bracket creation logic
                    break;

                case PredictionType.Bingo:
                    if (request.PostBingo == null) throw new Exception("PostBingo data required for bingo predictions");
                    // Implement bingo creation logic
                    break;
            }

            await _unitOfWork.PredictionRepository.UpdatePredictionAsync(prediction);
            await _unitOfWork.Complete();

            return new OkObjectResult(new { message = "Post published successfully", predictionId = prediction.Id });
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error publishing post: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<PublishedPostDTO>>> GetPublishedPostsAsync(int pageNumber, int pageSize, string? predictionType, string? searchTerm)
    {
        try
        {
            // Get published predictions with their posts
            var publishedPosts = new List<PublishedPostDTO>();

            // This would typically be a more complex query joining predictions with their posts
            // For now, return a placeholder implementation

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

    private bool CanUserCounterPredict(Prediction prediction, int userId)
    {
        // User can counter predict if:
        // 1. The prediction is published (not draft)
        // 2. The prediction is active
        // 3. The user is not the author
        // 4. The user hasn't already counter predicted
        return !prediction.IsDraft &&
               prediction.IsActive &&
               prediction.UserId != userId &&
               !HasUserCounterPredicted(prediction, userId);
    }

    private bool HasUserCounterPredicted(Prediction prediction, int userId)
    {
        // Check if user has already made a counter prediction
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
        // Count counter predictions (excluding the original author's post)
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

                // Add similar logic for Bracket and Bingo
        }

        return counterPredictions;
    }

    #region Other Methods (keeping existing methods)
    public async Task<ActionResult> UpdatePostRankAsync(PostRankDTO postRank)
    {
        var mappedPostRank = _mapper.Map<PostRank>(postRank);
        var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(postRank.RankingTemplateId);
        if (rankingTemplate == null)
            throw new Exception("Ranking template not found");
        var rankTable = new RankTable(rankingTemplate.NumberOfRows, rankingTemplate.NumberOfColumns);
        mappedPostRank.RankTable = rankTable;
        await _unitOfWork.PostRepository.UpdatePostRank(mappedPostRank);
        await _unitOfWork.Complete();

        return new OkObjectResult("Post rank updated successfully");
    }

    public async Task<ActionResult> DeletePostRankAsync(int postRankId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult<PostRankDTO>> GetPostRankAsync(int id)
    {
        var postRank = await _unitOfWork.PostRepository.GetPostRank(id);
        if (postRank == null)
            throw new Exception("Post rank not found");
        return _mapper.Map<PostRankDTO>(postRank);
    }

    public async Task<List<PostRankDTO>> GetPostRanksAsync()
    {
        var postRanks = await _unitOfWork.PostRepository.GetPostRanks();
        return _mapper.Map<List<PostRankDTO>>(postRanks);
    }

    public async Task<List<PostRankDTO>> GetPostRanksByUserIdAsync(int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostRankDTO>> GetPostRanksByTemplateIdAsync(int templateId)
    {
        throw new Exception("Not implemented");
    }
    #endregion

    #region PostBracket
    public async Task<ActionResult<PostBracketDTO>> CreatePostBracketAsync(PostBracketDTO userPostBracket, int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<bool> UpdatePostBracketAsync(PostBracketDTO userPostBracket)
    {
        throw new Exception("Not implemented");
    }

    public async Task<bool> DeletePostBracketAsync(int postBracketId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult<PostBracketDTO?>> GetPostBracketAsync(int postBracketId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsAsync()
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsByUserIdAsync(int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsByTemplateIdAsync(int templateId)
    {
        throw new Exception("Not implemented");
    }
    #endregion

    #region PostBingo
    public async Task<ActionResult<PostBingoDTO>> CreatePostBingoAsync(PostBingoDTO postBingoDTO, int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult> UpdatePostBingoAsync(PostBingoDTO userPostBingo)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult> DeletePostBingoAsync(int postBingoId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult<PostBingoDTO?>> GetPostBingoAsync(int postBingoId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosAsync()
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosByUserIdAsync(int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosByTemplateIdAsync(int templateId)
    {
        throw new Exception("Not implemented");
    }
    #endregion
    #endregion
}