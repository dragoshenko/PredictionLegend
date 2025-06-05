using System;
using API.DTO;
using API.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface ITeamService
{
    Task<ActionResult<TeamDTO>> CreateTeamAsync(TeamDTO team, int userId);
    Task<ActionResult<List<TeamDTO>>> GetUserTeamsAsync(int userId);
    Task<ActionResult<List<TeamDTO>>> GetTemplateTeamsAsync(int templateId);
    Task<ActionResult<List<TeamDTO>>> GetTemplateTeamsAsync(int templateId, PredictionType predictionType);
    Task<ActionResult<TeamDTO>> GetTeamAsync(int id);
    Task<ActionResult<List<TeamDTO>>> GetAllTeamsAsync();
    Task<ActionResult<TeamDTO>> UpdateTeamAsync(TeamDTO team);
    Task<ActionResult> DeleteTeamAsync(int id);
}
