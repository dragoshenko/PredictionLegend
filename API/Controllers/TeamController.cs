// API/Controllers/TeamController.cs - FIXED VERSION
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
    public async Task<ActionResult<TeamDTO>> CreateTeam([FromBody] CreateTeamRequestDTO teamRequest)
    {
        try
        {
            var userId = User.GetUserId();
            
            // FIXED: Validate input more thoroughly
            if (teamRequest == null)
            {
                return BadRequest("Team data is required");
            }

            if (string.IsNullOrWhiteSpace(teamRequest.Name))
            {
                return BadRequest("Team name is required");
            }

            if (teamRequest.Name.Length < 2 || teamRequest.Name.Length > 100)
            {
                return BadRequest("Team name must be between 2 and 100 characters");
            }

            // FIXED: Validate description length if provided
            if (!string.IsNullOrEmpty(teamRequest.Description) && teamRequest.Description.Length > 500)
            {
                return BadRequest("Description must be less than 500 characters");
            }

            // FIXED: Create a proper TeamDTO with validated data
            var teamDTO = new TeamDTO
            {
                Name = teamRequest.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(teamRequest.Description) ? string.Empty : teamRequest.Description.Trim(),
                PhotoUrl = string.IsNullOrWhiteSpace(teamRequest.PhotoUrl) ? string.Empty : teamRequest.PhotoUrl.Trim(),
                Score = teamRequest.Score ?? 0,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            var createdTeam = await _teamService.CreateTeamAsync(teamDTO, userId);
            return createdTeam;
        }
        catch (Exception ex)
        {
            // FIXED: Better error logging and response
            Console.WriteLine($"Error creating team: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            
            // Return more specific error messages
            if (ex.Message.Contains("duplicate") || ex.Message.Contains("unique"))
            {
                return BadRequest("A team with this name already exists");
            }
            
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

// FIXED: Create a separate DTO for create requests to avoid confusion
public class CreateTeamRequestDTO
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PhotoUrl { get; set; }
    public float? Score { get; set; }
}