// API/Services/TeamService.cs
using System;
using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class TeamService : ITeamService
{
    private IUnitOfWork _unitOfWork;
    private IMapper _mapper;

    public TeamService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    
    public async Task<ActionResult<TeamDTO>> CreateTeamAsync(TeamDTO teamDTO, int userId)
    {
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        if (user == null) return new NotFoundResult();
        
        // Map the DTO to entity and ensure all required fields are set
        var teamEntity = new Team
        {
            Name = teamDTO.Name?.Trim() ?? throw new ArgumentException("Team name is required"),
            Description = string.IsNullOrWhiteSpace(teamDTO.Description) ? null : teamDTO.Description.Trim(),
            PhotoUrl = string.IsNullOrWhiteSpace(teamDTO.PhotoUrl) ? null : teamDTO.PhotoUrl.Trim(),
            Score = teamDTO.Score ?? 0,
            CreatedByUserId = userId,
            CreatedByUser = user,
            CreatedAt = DateTime.UtcNow
        };

        // Validate team name length
        if (teamEntity.Name.Length < 2 || teamEntity.Name.Length > 100)
        {
            return new BadRequestObjectResult("Team name must be between 2 and 100 characters");
        }

        // Create the team
        var createdTeam = await _unitOfWork.TeamRepository.CreateTeamAsync(teamEntity);
        if (createdTeam == null)
        {
            return new BadRequestObjectResult("Failed to create team");
        }

        // Add team to user's teams collection
        user.Teams.Add(createdTeam);
        
        // Save changes
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Failed to save team");
        }

        // Map back to DTO for response
        var teamDTOResult = _mapper.Map<TeamDTO>(createdTeam);
        return teamDTOResult;
    }

    public async Task<ActionResult<List<TeamDTO>>> GetAllTeamsAsync()
    {
        var teams = await _unitOfWork.TeamRepository.GetAllTeamsAsync();
        var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
        return teamDTOs;
    }

    public async Task<ActionResult<TeamDTO>> GetTeamAsync(int id)
    {
        var team = await _unitOfWork.TeamRepository.GetTeamAsync(id);
        if (team == null) return new NotFoundResult();
        var teamDTO = _mapper.Map<TeamDTO>(team);
        return teamDTO;
    }

    public async Task<ActionResult<List<TeamDTO>>> GetTemplateTeamsAsync(int templateId)
    {
        var teams = await _unitOfWork.TeamRepository.GetTemplateTeamsAsync(templateId, PredictionType.Ranking);
        if (teams == null) return new NotFoundResult();
        var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
        return teamDTOs;
    }

    public async Task<ActionResult<List<TeamDTO>>> GetTemplateTeamsAsync(int templateId, PredictionType predictionType)
    {
        var teams = await _unitOfWork.TeamRepository.GetTemplateTeamsAsync(templateId, predictionType);
        if (teams == null) return new NotFoundResult();
        var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
        return teamDTOs;
    }

    public async Task<ActionResult<List<TeamDTO>>> GetUserTeamsAsync(int userId)
    {
        var teams = await _unitOfWork.TeamRepository.GetUserTeamsAsync(userId);
        if (teams == null) return new NotFoundResult();
        var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
        return teamDTOs;
    }

    public async Task<ActionResult<TeamDTO>> UpdateTeamAsync(TeamDTO teamDTO)
    {
        var teamEntity = await _unitOfWork.TeamRepository.GetTeamAsync(teamDTO.Id);
        if (teamEntity == null) return new NotFoundResult();
        
        // Update only the fields that can be changed
        teamEntity.Name = teamDTO.Name?.Trim() ?? teamEntity.Name;
        teamEntity.Description = string.IsNullOrWhiteSpace(teamDTO.Description) ? null : teamDTO.Description.Trim();
        teamEntity.PhotoUrl = string.IsNullOrWhiteSpace(teamDTO.PhotoUrl) ? null : teamDTO.PhotoUrl.Trim();
        teamEntity.Score = teamDTO.Score ?? teamEntity.Score;
        
        // Validate team name length
        if (teamEntity.Name.Length < 2 || teamEntity.Name.Length > 100)
        {
            return new BadRequestObjectResult("Team name must be between 2 and 100 characters");
        }

        await _unitOfWork.TeamRepository.UpdateTeamAsync(teamEntity);
        var saveResult = await _unitOfWork.Complete();
        
        if (!saveResult)
        {
            return new BadRequestObjectResult("Failed to update team");
        }
        
        var teamDTOResult = _mapper.Map<TeamDTO>(teamEntity);
        return teamDTOResult; // This returns ActionResult<TeamDTO> implicitly
    }

    public async Task<ActionResult> DeleteTeamAsync(int id)
    {
        var result = await _unitOfWork.TeamRepository.DeleteTeamAsync(id);
        if (!result)
        {
            return new NotFoundResult();
        }
        
        var saveResult = await _unitOfWork.Complete();
        if (!saveResult)
        {
            return new BadRequestObjectResult("Failed to delete team");
        }
        
        return new NoContentResult();
    }
}