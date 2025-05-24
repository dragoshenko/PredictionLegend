using System;
using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class TemplateService : ITemplateService
{
    private IUnitOfWork _unitOfWork;
    private IMapper _mapper;
    private UserManager<AppUser> _userManager;

    public TemplateService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<AppUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _userManager = userManager;
    }
    #region "Ranking Template"
    public async Task<ActionResult<RankingTemplateDTO>> GetRankingTemplate(int id)
    {
        var template = await _unitOfWork.TemplateRepository.GetRankingTemplate(id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error getting ranking template");
        }
        var rankingTemplateDTO = _mapper.Map<RankingTemplateDTO>(template);
        return rankingTemplateDTO;
    }
    public async Task<ActionResult<RankingTemplateDTO>> CreateRankingTemplate(int id, RankingTemplateDTO rankingTemplate)
    {
        var userId = id;
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            return new BadRequestObjectResult("User not found");
        }

        var rankingTemplateDTO = rankingTemplate;
        var mappedTemplate = new RankingTemplate(rankingTemplateDTO.NumberOfRows, rankingTemplateDTO.NumberOfColumns);
        var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
        if (isAdmin)
        {
            mappedTemplate.OfficialTemplate = true;
        }

        mappedTemplate.UserId = user.Id;
        mappedTemplate.User = user;

        var createdTemplate = await _unitOfWork.TemplateRepository.CreateRankingTemplate(mappedTemplate);
        if (createdTemplate == null)
        {
            return new BadRequestObjectResult("Error creating ranking template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving ranking template");
        }

        var rankingTemplateResult = _mapper.Map<RankingTemplateDTO>(createdTemplate);
        return rankingTemplateResult; 
    }
    public async Task<ActionResult> UpdateRankingTemplate(RankingTemplateDTO rankingTemplate)
    {
        var template = await _unitOfWork.TemplateRepository.GetRankingTemplate(rankingTemplate.Id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error updating ranking template");
        }
        template.NumberOfRows = rankingTemplate.NumberOfRows;
        template.NumberOfColumns = rankingTemplate.NumberOfColumns;
        var result = await _unitOfWork.TemplateRepository.UpdateRankingTemplate(template);
        if (!result)
        {
            return new BadRequestObjectResult("Error updating ranking template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving changes");
        }
        return new OkResult();
    }
    public async Task<ActionResult> DeleteRankingTemplate(int id)
    {
        var template = await _unitOfWork.TemplateRepository.GetRankingTemplate(id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error deleting ranking template");
        }
        var result = await _unitOfWork.TemplateRepository.DeleteRankingTemplate(id);
        if (!result)
        {
            return new BadRequestObjectResult("Error deleting ranking template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving changes");
        }
        return new OkResult();
    }
    public async Task<ActionResult<List<RankingTemplateDTO>>> GetOfficialRankingTemplates()
    {
        var templates = await _unitOfWork.TemplateRepository.GetOfficialRankingTemplates();
        if (templates == null)
        {
            return new BadRequestObjectResult("Error getting official ranking templates");
        }
        var rankingTemplateDTOs = _mapper.Map<List<RankingTemplateDTO>>(templates);
        return rankingTemplateDTOs;
    }
    public async Task<ActionResult<List<RankingTemplateDTO>>> GetUserRankingTemplates(int userId)
    {
        var rankingTemplates = await _unitOfWork.TemplateRepository.GetUserRankingTemplates(userId);
        if (rankingTemplates == null)
        {
            return new BadRequestObjectResult("Error getting user ranking templates");
        }
        var rankingTemplateDTOs = _mapper.Map<List<RankingTemplateDTO>>(rankingTemplates);
        return rankingTemplateDTOs;
    }
    #endregion
    #region "Bracket Template"
    public async Task<ActionResult<BracketTemplateDTO>> GetBracketTemplate(int id)
    {
        var template = await _unitOfWork.TemplateRepository.GetBracketTemplate(id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error getting bracket template");
        }
        var bracketTemplateDTO = _mapper.Map<BracketTemplateDTO>(template);
        return bracketTemplateDTO;
    }
    public async Task<ActionResult<BracketTemplateDTO>> CreateBracketTemplate(int id, BracketTemplateDTO bracketTemplate)
    {
        var userId = id;
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            return new BadRequestObjectResult("User not found");
        }

        var mappedTemplate = new BracketTemplate(bracketTemplate.NumberOfRounds);
        mappedTemplate.Name = bracketTemplate.Name;
        mappedTemplate.UserId = user.Id;
        mappedTemplate.User = user;

        var createdTemplate = await _unitOfWork.TemplateRepository.CreateBracketTemplate(mappedTemplate);
        if (createdTemplate == null)
        {
            return new BadRequestObjectResult("Error creating bracket template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving bracket template");
        }

        var bracketTemplateResult = _mapper.Map<BracketTemplateDTO>(createdTemplate);
        return bracketTemplateResult;
    }
    public async Task<ActionResult> UpdateBracketTemplate(BracketTemplateDTO bracketTemplate)
    {
        var template = await _unitOfWork.TemplateRepository.GetBracketTemplate(bracketTemplate.Id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error updating bracket template");
        }
        template.NumberOfRounds = bracketTemplate.NumberOfRounds;
        var result = await _unitOfWork.TemplateRepository.UpdateBracketTemplate(template);
        if (!result)
        {
            return new BadRequestObjectResult("Error updating bracket template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving changes");
        }
        return new OkResult();
    }
    public async Task<ActionResult> DeleteBracketTemplate(int id)
    {
        var template = await _unitOfWork.TemplateRepository.GetBracketTemplate(id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error deleting bracket template");
        }
        var result = await _unitOfWork.TemplateRepository.DeleteBracketTemplate(id);
        if (!result)
        {
            return new BadRequestObjectResult("Error deleting bracket template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving changes");
        }
        return new OkResult();
    }
    public async Task<ActionResult<List<BracketTemplateDTO>>> GetOfficialBracketTemplates()
    {
        var templates = await _unitOfWork.TemplateRepository.GetOfficialBracketTemplates();
        if (templates == null)
        {
            return new BadRequestObjectResult("Error getting official bracket templates");
        }
        var bracketTemplateDTOs = _mapper.Map<List<BracketTemplateDTO>>(templates);
        return bracketTemplateDTOs;
    }
    public async Task<ActionResult<List<BracketTemplateDTO>>> GetUserBracketTemplates(int userId)
    {
        var bracketTemplates = await _unitOfWork.TemplateRepository.GetUserBracketTemplates(userId);
        if (bracketTemplates == null)
        {
            return new BadRequestObjectResult("Error getting user bracket templates");
        }
        var bracketTemplateDTOs = _mapper.Map<List<BracketTemplateDTO>>(bracketTemplates);
        return bracketTemplateDTOs;
    }
    #endregion
    #region "Bingo Template"
    public async Task<ActionResult<BingoTemplateDTO>> GetBingoTemplate(int id)
    {
        var template = await _unitOfWork.TemplateRepository.GetBingoTemplate(id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error getting bingo template");
        }
        var bingoTemplateDTO = _mapper.Map<BingoTemplateDTO>(template);
        return bingoTemplateDTO;
    }
    public async Task<ActionResult<BingoTemplateDTO>> CreateBingoTemplate(int id, BingoTemplateDTO bingoTemplate)
    {
        var userId = id;
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        if (user == null)
        {
            return new BadRequestObjectResult("User not found");
        }

        var mappedTemplate = new BingoTemplate();
        mappedTemplate = _mapper.Map<BingoTemplate>(bingoTemplate);
        mappedTemplate.UserId = user.Id;
        mappedTemplate.User = user;

        var createdTemplate = await _unitOfWork.TemplateRepository.CreateBingoTemplate(mappedTemplate);
        if (createdTemplate == null)
        {
            return new BadRequestObjectResult("Error creating bingo template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving bingo template");
        }

        var bingoTemplateResult = _mapper.Map<BingoTemplateDTO>(createdTemplate);
        return bingoTemplateResult;
    }
    public async Task<ActionResult> UpdateBingoTemplate(BingoTemplateDTO bingoTemplate)
    {
        var template = await _unitOfWork.TemplateRepository.GetBingoTemplate(bingoTemplate.Id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error updating bingo template");
        }
        template.OfficialTemplate = bingoTemplate.OfficialTemplate;
        var result = await _unitOfWork.TemplateRepository.UpdateBingoTemplate(template);
        if (!result)
        {
            return new BadRequestObjectResult("Error updating bingo template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving changes");
        }
        return new OkResult();
    }
    public async Task<ActionResult> DeleteBingoTemplate(int id)
    {
        var template = await _unitOfWork.TemplateRepository.GetBingoTemplate(id);
        if (template == null)
        {
            return new BadRequestObjectResult("Error deleting bingo template");
        }
        var result = await _unitOfWork.TemplateRepository.DeleteBingoTemplate(id);
        if (!result)
        {
            return new BadRequestObjectResult("Error deleting bingo template");
        }
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Error saving changes");
        }
        return new OkResult();
    }
    public async Task<ActionResult<List<BingoTemplateDTO>>> GetOfficialBingoTemplates()
    {
        var templates = await _unitOfWork.TemplateRepository.GetOfficialBingoTemplates();
        if (templates == null)
        {
            return new BadRequestObjectResult("Error getting official bingo templates");
        }
        var bingoTemplateDTOs = _mapper.Map<List<BingoTemplateDTO>>(templates);
        return bingoTemplateDTOs;
    }
    public async Task<ActionResult<List<BingoTemplateDTO>>> GetUserBingoTemplates(int userId)
    {
        var bingoTemplates = await _unitOfWork.TemplateRepository.GetUserBingoTemplates(userId);
        if (bingoTemplates == null)
        {
            return new BadRequestObjectResult("Error getting user bingo templates");
        }
        var bingoTemplateDTOs = _mapper.Map<List<BingoTemplateDTO>>(bingoTemplates);
        return bingoTemplateDTOs;
    }
    #endregion
}
