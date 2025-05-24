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
    public async Task<ActionResult<TeamDTO>> CreateTeamAsync(TeamDTO team, int userId)
    {
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        if (user == null) return new NotFoundResult();
        var teamEntity = _mapper.Map<Team>(team);
        await _unitOfWork.TeamRepository.CreateTeamAsync(teamEntity);
        user.Teams.Add(teamEntity);
        await _unitOfWork.Complete();
        var teamDTO = _mapper.Map<TeamDTO>(teamEntity);
        return teamDTO;
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

    public async Task<ActionResult> UpdateTeamAsync(TeamDTO team)
    {
        var teamEntity = await _unitOfWork.TeamRepository.GetTeamAsync(team.Id);
        if (teamEntity == null) return new NotFoundResult();
        _mapper.Map(team, teamEntity);
        await _unitOfWork.TeamRepository.UpdateTeamAsync(teamEntity);
        await _unitOfWork.Complete();
        var teamDTO = _mapper.Map<TeamDTO>(teamEntity);
        return new OkObjectResult(teamDTO);
    }

    public async Task<ActionResult> DeleteTeamAsync(int id)
    {
        await _unitOfWork.TeamRepository.DeleteTeamAsync(id);
        await _unitOfWork.Complete();
        return new NoContentResult();
    }
}
