using System;
using API.DTO;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class TeamController : BaseAPIController
{
    public ITeamService _teamService { get; }
    public TeamController(ITeamService teamService)
    {
        _teamService = teamService;
    }



    [HttpPost("create")]
    public async Task<ActionResult<TeamDTO>> CreateTeam([FromBody] TeamDTO team)
    {
        var userId = User.GetUserId();
        var createdTeam = await _teamService.CreateTeamAsync(team, userId);
        return createdTeam;
    }

    [HttpPut("update")]
    public async Task<ActionResult<TeamDTO>> UpdateTeam([FromBody] TeamDTO team)
    {
        var updatedTeam = await _teamService.UpdateTeamAsync(team);
        return updatedTeam;
    }

    [HttpGet("user")]
    public async Task<ActionResult<List<TeamDTO>>> GetUserTeams()
    {
        var userId = User.GetUserId();
        var wantedTeams = await _teamService.GetUserTeamsAsync(userId);
        return wantedTeams;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TeamDTO>> GetTeam(int id)
    {
        var wantedTeam = await _teamService.GetTeamAsync(id);
        return wantedTeam;
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTeam(int id)
    {
        var result = await _teamService.DeleteTeamAsync(id);
        return result;
    }
}
