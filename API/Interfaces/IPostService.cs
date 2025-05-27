using API.DTO;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface IPostService
{
    // PostRank methods
    Task<ActionResult<PostRankDTO>> CreatePostRankAsync(PostRankDTO postRank, int userId);
    Task<ActionResult> UpdatePostRankAsync(PostRankDTO postRank);
    Task<ActionResult> DeletePostRankAsync(int postRankId);
    Task<ActionResult<PostRankDTO>> GetPostRankAsync(int id);
    Task<List<PostRankDTO>> GetPostRanksAsync();
    Task<List<PostRankDTO>> GetPostRanksByUserIdAsync(int userId);
    Task<List<PostRankDTO>> GetPostRanksByTemplateIdAsync(int templateId);

    // PostBracket methods  
    Task<ActionResult<PostBracketDTO>> CreatePostBracketAsync(PostBracketDTO postBracket, int userId);
    Task<bool> UpdatePostBracketAsync(PostBracketDTO postBracket);
    Task<bool> DeletePostBracketAsync(int postBracketId);
    Task<ActionResult<PostBracketDTO?>> GetPostBracketAsync(int postBracketId);
    Task<List<PostBracketDTO>> GetPostBracketsAsync();
    Task<List<PostBracketDTO>> GetPostBracketsByUserIdAsync(int userId);
    Task<List<PostBracketDTO>> GetPostBracketsByTemplateIdAsync(int templateId);

    // PostBingo methods
    Task<ActionResult<PostBingoDTO>> CreatePostBingoAsync(PostBingoDTO postBingo, int userId);
    Task<ActionResult> UpdatePostBingoAsync(PostBingoDTO postBingo);
    Task<ActionResult> DeletePostBingoAsync(int postBingoId);
    Task<ActionResult<PostBingoDTO?>> GetPostBingoAsync(int postBingoId);
    Task<List<PostBingoDTO>> GetPostBingosAsync();
    Task<List<PostBingoDTO>> GetPostBingosByUserIdAsync(int userId);
    Task<List<PostBingoDTO>> GetPostBingosByTemplateIdAsync(int templateId);

    // New publishing and display methods
    Task<ActionResult<PostRankDTO>> PublishPostAsync(PublishPostRequestDTO request, int userId);
    Task<ActionResult<List<PublishedPostDTO>>> GetPublishedPostsAsync(int pageNumber, int pageSize, string? predictionType, string? searchTerm);
    Task<ActionResult<List<PostRankDTO>>> GetUserPostsAsync(int userId);
    Task<ActionResult<PostDetailDTO>> GetPostDetailsAsync(int predictionId, int currentUserId);
    Task<ActionResult<PostRankDTO>> CreateCounterPredictionAsync(int originalPredictionId, CounterPredictionRequestDTO request, int userId);
}