// API/Controllers/TeamController.cs
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
        try
        {
            var userId = User.GetUserId();
            
            // Validate input
            if (string.IsNullOrWhiteSpace(team.Name))
            {
                return BadRequest("Team name is required");
            }

            if (team.Name.Length < 2 || team.Name.Length > 100)
            {
                return BadRequest("Team name must be between 2 and 100 characters");
            }

            var createdTeam = await _teamService.CreateTeamAsync(team, userId);
            return createdTeam;
        }
        catch (Exception ex)
        {
            // Log the exception details
            Console.WriteLine($"Error creating team: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, "An error occurred while creating the team");
        }
    }

    [HttpPut("update")]
    public async Task<ActionResult<TeamDTO>> UpdateTeam([FromBody] TeamDTO team)
    {
        try
        {
            // Validate input
            if (team.Id <= 0)
            {
                return BadRequest("Valid team ID is required");
            }

            if (string.IsNullOrWhiteSpace(team.Name))
            {
                return BadRequest("Team name is required");
            }

            if (team.Name.Length < 2 || team.Name.Length > 100)
            {
                return BadRequest("Team name must be between 2 and 100 characters");
            }

            var updatedTeam = await _teamService.UpdateTeamAsync(team);
            return updatedTeam;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating team: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, "An error occurred while updating the team");
        }
    }

    [HttpGet("user")]
    public async Task<ActionResult<List<TeamDTO>>> GetUserTeams()
    {
        try
        {
            var userId = User.GetUserId();
            var wantedTeams = await _teamService.GetUserTeamsAsync(userId);
            return wantedTeams;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting user teams: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, "An error occurred while retrieving teams");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TeamDTO>> GetTeam(int id)
    {
        try
        {
            if (id <= 0)
            {
                return BadRequest("Valid team ID is required");
            }

            var wantedTeam = await _teamService.GetTeamAsync(id);
            return wantedTeam;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting team: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, "An error occurred while retrieving the team");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTeam(int id)
    {
        try
        {
            if (id <= 0)
            {
                return BadRequest("Valid team ID is required");
            }

            var result = await _teamService.DeleteTeamAsync(id);
            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting team: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, "An error occurred while deleting the team");
        }
    }
}