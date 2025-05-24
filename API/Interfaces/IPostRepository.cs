using System;
using API.Entities;

namespace API.Interfaces;

public interface IPostRepository
{
    #region PostRank
    Task<PostRank?> GetPostRank(int postRankId);
    Task<List<PostRank>> GetPostRanks();
    Task<PostRank> CreatePostRank(PostRank postRank);
    Task<bool> UpdatePostRank(PostRank postRank);
    Task<bool> DeletePostRank(int postRankId);
    #endregion
    #region PostBracket
    Task<PostBracket?> GetPostBracket(int postBracketId);
    Task<List<PostBracket>> GetPostBrackets();
    Task<PostBracket> CreatePostBracket(PostBracket postBracket);
    Task<bool> UpdatePostBracket(PostBracket postBracket);
    Task<bool> DeletePostBracket(int postBracketId);
    #endregion
    #region PostBingo
    Task<PostBingo?> GetPostBingo(int postBingoId);
    Task<List<PostBingo>> GetPostBingos();
    Task<PostBingo> CreatePostBingo(PostBingo postBingo);
    Task<bool> UpdatePostBingo(PostBingo postBingo);
    Task<bool> DeletePostBingo(int postBingoId);
    #endregion
}
