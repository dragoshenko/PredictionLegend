using System;
using API.DTO;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface ITemplateService
{
    #region "Ranking Template"
    Task<ActionResult<RankingTemplateDTO>> GetRankingTemplate(int id);
    Task<ActionResult<RankingTemplateDTO>> CreateRankingTemplate(int id, RankingTemplateDTO rankingTemplate);
    Task<ActionResult> UpdateRankingTemplate(RankingTemplateDTO rankingTemplate);
    Task<ActionResult> DeleteRankingTemplate(int id);
    Task<ActionResult<List<RankingTemplateDTO>>> GetOfficialRankingTemplates();
    Task<ActionResult<List<RankingTemplateDTO>>> GetUserRankingTemplates(int userId);
    #endregion
    #region "Bracket Template"
    Task<ActionResult<BracketTemplateDTO>> GetBracketTemplate(int id);
    Task<ActionResult<BracketTemplateDTO>> CreateBracketTemplate(int id, BracketTemplateDTO bracketTemplate);
    Task<ActionResult> UpdateBracketTemplate(BracketTemplateDTO bracketTemplate);
    Task<ActionResult> DeleteBracketTemplate(int id);
    Task<ActionResult<List<BracketTemplateDTO>>> GetOfficialBracketTemplates();
    Task<ActionResult<List<BracketTemplateDTO>>> GetUserBracketTemplates(int userId);
    #endregion
    #region "Bingo Template"
    Task<ActionResult<BingoTemplateDTO>> GetBingoTemplate(int id);
    Task<ActionResult<BingoTemplateDTO>> CreateBingoTemplate(int id, BingoTemplateDTO bingoTemplate);
    Task<ActionResult> UpdateBingoTemplate(BingoTemplateDTO bingoTemplate);
    Task<ActionResult> DeleteBingoTemplate(int id);
    Task<ActionResult<List<BingoTemplateDTO>>> GetOfficialBingoTemplates();
    Task<ActionResult<List<BingoTemplateDTO>>> GetUserBingoTemplates(int userId);
    #endregion
}