using System;
using API.Entities;

namespace API.Interfaces;

public interface ITemplateRepository
{
    #region Ranking Templates
    Task<RankingTemplate?> GetRankingTemplate(int id);
    Task<RankingTemplate> CreateRankingTemplate(RankingTemplate rankingTemplate);
    Task<bool> UpdateRankingTemplate(RankingTemplate rankingTemplate);
    Task<bool> DeleteRankingTemplate(int id);
    Task<List<RankingTemplate>> GetOfficialRankingTemplates();
    Task<List<RankingTemplate>> GetUserRankingTemplates(int userId);
    #endregion
    #region Bracket Templates
    Task<BracketTemplate?> GetBracketTemplate(int id);
    Task<BracketTemplate> CreateBracketTemplate(BracketTemplate bracketTemplate);
    Task<bool> UpdateBracketTemplate(BracketTemplate bracketTemplate);
    Task<bool> DeleteBracketTemplate(int id);
    Task<List<BracketTemplate>> GetOfficialBracketTemplates();
    Task<List<BracketTemplate>> GetUserBracketTemplates(int userId);
    #endregion
    #region Bingo Templates
    Task<BingoTemplate?> GetBingoTemplate(int id);
    Task<BingoTemplate> CreateBingoTemplate(BingoTemplate bingoTemplate);
    Task<bool> UpdateBingoTemplate(BingoTemplate bingoTemplate);
    Task<bool> DeleteBingoTemplate(int id);
    Task<List<BingoTemplate>> GetOfficialBingoTemplates();
    Task<List<BingoTemplate>> GetUserBingoTemplates(int userId);
    #endregion
}
