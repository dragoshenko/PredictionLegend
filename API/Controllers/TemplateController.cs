using System;
using System.Threading.Tasks;
using API.DTO;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class TemplateController : BaseAPIController
{
    public ITemplateService _templateService { get; }
    public TemplateController(ITemplateService templateService)
    {
        _templateService = templateService;
    }

    [HttpPost("ranking")]
    public async Task<ActionResult<RankingTemplateDTO>> CreateRankingTemplate([FromBody] RankingTemplateDTO rankingTemplate)
    {
        var userId = User.GetUserId();
        var createdTemplate = await _templateService.CreateRankingTemplate(userId, rankingTemplate);
        return createdTemplate;
    }

    [HttpGet("ranking/user")]
    public async Task<ActionResult<List<RankingTemplateDTO>>> GetUserRankingTemplates()
    {
        var userId = User.GetUserId();
        var wantedTemplate = await _templateService.GetUserRankingTemplates(userId);
        return wantedTemplate;
    }

    [HttpGet("ranking/{id}")]
    public async Task<ActionResult<RankingTemplateDTO>> GetRankingTemplate(int id)
    {
        var wantedTemplate = await _templateService.GetRankingTemplate(id);
        return wantedTemplate;
    }

    [HttpGet("ranking/official")]
    public async Task<ActionResult<List<RankingTemplateDTO>>> GetOfficialRankingTemplates()
    {
        var wantedTemplate = await _templateService.GetOfficialRankingTemplates();
        return wantedTemplate;
    }

    [HttpPost("bracket")]
    public async Task<ActionResult<BracketTemplateDTO>> CreateBracketTemplate([FromBody] BracketTemplateDTO bracketTemplate)
    {
        var userId = User.GetUserId();
        var createdTemplate = await _templateService.CreateBracketTemplate(userId, bracketTemplate);
        return createdTemplate;
    }

    [HttpGet("bracket/user")]
    public async Task<ActionResult<List<BracketTemplateDTO>>> GetUserBracketTemplates()
    {
        var userId = User.GetUserId();
        var wantedTemplate = await _templateService.GetUserBracketTemplates(userId);
        return wantedTemplate;
    }

    [HttpGet("bracket/{id}")]
    public async Task<ActionResult<BracketTemplateDTO>> GetBracketTemplate(int id)
    {
        var wantedTemplate = await _templateService.GetBracketTemplate(id);
        return wantedTemplate;
    }

    [HttpPut("bracket/{id}")]
    public async Task<ActionResult> UpdateBracketTemplate(int id, [FromBody] BracketTemplateDTO bracketTemplate)
    {
        bracketTemplate.Id = id;
        var result = await _templateService.UpdateBracketTemplate(bracketTemplate);
        return result;
    }

    [HttpDelete("bracket/{id}")]
    public async Task<ActionResult> DeleteBracketTemplate(int id)
    {
        var result = await _templateService.DeleteBracketTemplate(id);
        return result;
    }

    [HttpGet("bracket/official")]
    public async Task<ActionResult<List<BracketTemplateDTO>>> GetOfficialBracketTemplates()
    {
        var wantedTemplate = await _templateService.GetOfficialBracketTemplates();
        return wantedTemplate;
    }

    [HttpPost("bingo")]
    public async Task<ActionResult<BingoTemplateDTO>> CreateBingoTemplate([FromBody] BingoTemplateDTO bingoTemplate)
    {
        var userId = User.GetUserId();
        var createdTemplate = await _templateService.CreateBingoTemplate(userId, bingoTemplate);
        return createdTemplate;
    }

    [HttpGet("bingo/user")]
    public async Task<ActionResult<List<BingoTemplateDTO>>> GetUserBingoTemplates()
    {
        var userId = User.GetUserId();
        var wantedTemplate = await _templateService.GetUserBingoTemplates(userId);
        return wantedTemplate;
    }

    [HttpGet("bingo/{id}")]
    public ActionResult GetBingoTemplate(string id)
    {
        return Ok(new { message = "Bingo template" });
    }

    [HttpGet("bingo/official")]
    public async Task<ActionResult<List<BingoTemplateDTO>>> GetOfficialBingoTemplates()
    {
        var wantedTemplate = await _templateService.GetOfficialBingoTemplates();
        return wantedTemplate;
    }
}
