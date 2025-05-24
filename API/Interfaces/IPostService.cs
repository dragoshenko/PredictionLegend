using System;
using API.DTO;
using API.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface IPostService
{
    #region "PostRank"
    Task<ActionResult<PostRankDTO>> CreatePostRankAsync(PostRankDTO userPostRank, int userId);
    Task<ActionResult> UpdatePostRankAsync(PostRankDTO userPostRank);
    Task<ActionResult> DeletePostRankAsync(int postRankId);
    Task<ActionResult<PostRankDTO?>> GetPostRankAsync(int postRankId);
    Task<List<PostRankDTO>> GetPostRanksAsync();
    Task<List<PostRankDTO>> GetPostRanksByUserIdAsync(int userId);
    Task<List<PostRankDTO>> GetPostRanksByTemplateIdAsync(int templateId);
    #endregion
    #region "PostBracket"
    Task<ActionResult<PostBracketDTO>> CreatePostBracketAsync(PostBracketDTO userPostBracket, int userId);
    Task<bool> UpdatePostBracketAsync(PostBracketDTO userPostBracket);
    Task<bool> DeletePostBracketAsync(int postBracketId);
    Task<ActionResult<PostBracketDTO?>> GetPostBracketAsync(int postBracketId);
    Task<List<PostBracketDTO>> GetPostBracketsAsync();
    Task<List<PostBracketDTO>> GetPostBracketsByUserIdAsync(int userId);
    Task<List<PostBracketDTO>> GetPostBracketsByTemplateIdAsync(int templateId);
    #endregion
    #region "PostBingo"
    Task<ActionResult<PostBingoDTO>> CreatePostBingoAsync(PostBingoDTO postBingoDTO, int userId);
    Task<ActionResult> UpdatePostBingoAsync(PostBingoDTO userPostBingo);
    Task<ActionResult> DeletePostBingoAsync(int postBingoId);
    Task<ActionResult<PostBingoDTO?>> GetPostBingoAsync(int postBingoId);
    Task<List<PostBingoDTO>> GetPostBingosAsync();
    Task<List<PostBingoDTO>> GetPostBingosByUserIdAsync(int userId);
    Task<List<PostBingoDTO>> GetPostBingosByTemplateIdAsync(int templateId);
    #endregion
}
