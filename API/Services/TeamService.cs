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
        try
        {
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null) 
                return new NotFoundObjectResult("User not found");
            
            // Validate required fields
            if (string.IsNullOrWhiteSpace(teamDTO.Name))
                return new BadRequestObjectResult("Team name is required");

            if (teamDTO.Name.Length < 2 || teamDTO.Name.Length > 100)
                return new BadRequestObjectResult("Team name must be between 2 and 100 characters");

            // Create the team entity with all required fields
            var teamEntity = new Team
            {
                Name = teamDTO.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(teamDTO.Description) ? string.Empty : teamDTO.Description.Trim(),
                PhotoUrl = string.IsNullOrWhiteSpace(teamDTO.PhotoUrl) ? null : teamDTO.PhotoUrl.Trim(),
                Score = teamDTO.Score ?? 0,
                CreatedByUserId = userId,
                CreatedByUser = user,
                CreatedAt = DateTime.UtcNow
            };

            Console.WriteLine($"Creating team entity: {teamEntity.Name}, UserId: {teamEntity.CreatedByUserId}");

            // Create the team
            var createdTeam = await _unitOfWork.TeamRepository.CreateTeamAsync(teamEntity);
            if (createdTeam == null)
            {
                return new BadRequestObjectResult("Failed to create team");
            }

            // Add team to user's teams collection if it exists
            if (user.Teams == null)
                user.Teams = new List<Team>();
            
            user.Teams.Add(createdTeam);
            
            // Save changes
            var saveResult = await _unitOfWork.Complete();
            if (!saveResult)
            {
                return new BadRequestObjectResult("Failed to save team");
            }

            // Map back to DTO for response
            var teamDTOResult = _mapper.Map<TeamDTO>(createdTeam);
            Console.WriteLine($"Team created successfully with ID: {teamDTOResult.Id}");
            
            return new OkObjectResult(teamDTOResult);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreateTeamAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return new StatusCodeResult(500);
        }
    }

    public async Task<ActionResult<List<TeamDTO>>> GetAllTeamsAsync()
    {
        try
        {
            var teams = await _unitOfWork.TeamRepository.GetAllTeamsAsync();
            var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
            return new OkObjectResult(teamDTOs);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAllTeamsAsync: {ex.Message}");
            return new StatusCodeResult(500);
        }
    }

    public async Task<ActionResult<TeamDTO>> GetTeamAsync(int id)
    {
        try
        {
            if (id <= 0)
                return new BadRequestObjectResult("Valid team ID is required");

            var team = await _unitOfWork.TeamRepository.GetTeamAsync(id);
            if (team == null) 
                return new NotFoundObjectResult("Team not found");
            
            var teamDTO = _mapper.Map<TeamDTO>(team);
            return new OkObjectResult(teamDTO);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetTeamAsync: {ex.Message}");
            return new StatusCodeResult(500);
        }
    }

    public async Task<ActionResult<List<TeamDTO>>> GetTemplateTeamsAsync(int templateId)
    {
        try
        {
            var teams = await _unitOfWork.TeamRepository.GetTemplateTeamsAsync(templateId, PredictionType.Ranking);
            if (teams == null) 
                return new NotFoundObjectResult("No teams found for template");
            
            var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
            return new OkObjectResult(teamDTOs);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetTemplateTeamsAsync: {ex.Message}");
            return new StatusCodeResult(500);
        }
    }

    public async Task<ActionResult<List<TeamDTO>>> GetTemplateTeamsAsync(int templateId, PredictionType predictionType)
    {
        try
        {
            var teams = await _unitOfWork.TeamRepository.GetTemplateTeamsAsync(templateId, predictionType);
            if (teams == null) 
                return new NotFoundObjectResult("No teams found for template");
            
            var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
            return new OkObjectResult(teamDTOs);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetTemplateTeamsAsync: {ex.Message}");
            return new StatusCodeResult(500);
        }
    }

    public async Task<ActionResult<List<TeamDTO>>> GetUserTeamsAsync(int userId)
    {
        try
        {
            var teams = await _unitOfWork.TeamRepository.GetUserTeamsAsync(userId);
            if (teams == null) 
                return new NotFoundObjectResult("No teams found for user");
            
            var teamDTOs = _mapper.Map<List<TeamDTO>>(teams);
            return new OkObjectResult(teamDTOs);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetUserTeamsAsync: {ex.Message}");
            return new StatusCodeResult(500);
        }
    }

    public async Task<ActionResult<TeamDTO>> UpdateTeamAsync(TeamDTO teamDTO)
    {
        try
        {
            if (teamDTO.Id <= 0)
                return new BadRequestObjectResult("Valid team ID is required");

            var teamEntity = await _unitOfWork.TeamRepository.GetTeamAsync(teamDTO.Id);
            if (teamEntity == null) 
                return new NotFoundObjectResult("Team not found");
            
            // Update only the fields that can be changed
            teamEntity.Name = teamDTO.Name?.Trim() ?? teamEntity.Name;
            teamEntity.Description = string.IsNullOrWhiteSpace(teamDTO.Description) ? string.Empty : teamDTO.Description.Trim();
            teamEntity.PhotoUrl = string.IsNullOrWhiteSpace(teamDTO.PhotoUrl) ? null : teamDTO.PhotoUrl.Trim();
            teamEntity.Score = teamDTO.Score ?? teamEntity.Score;
            
            // Validate team name length
            if (teamEntity.Name.Length < 2 || teamEntity.Name.Length > 100)
            {
                return new BadRequestObjectResult("Team name must be between 2 and 100 characters");
            }

            var updatedTeam = await _unitOfWork.TeamRepository.UpdateTeamAsync(teamEntity);
            var saveResult = await _unitOfWork.Complete();
            
            if (!saveResult)
            {
                return new BadRequestObjectResult("Failed to update team");
            }
            
            var teamDTOResult = _mapper.Map<TeamDTO>(updatedTeam);
            return new OkObjectResult(teamDTOResult);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in UpdateTeamAsync: {ex.Message}");
            return new StatusCodeResult(500);
        }
    }

    public async Task<ActionResult> DeleteTeamAsync(int id)
    {
        try
        {
            if (id <= 0)
                return new BadRequestObjectResult("Valid team ID is required");

            var result = await _unitOfWork.TeamRepository.DeleteTeamAsync(id);
            if (!result)
            {
                return new NotFoundObjectResult("Team not found");
            }
            
            var saveResult = await _unitOfWork.Complete();
            if (!saveResult)
            {
                return new BadRequestObjectResult("Failed to delete team");
            }
            
            return new NoContentResult();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in DeleteTeamAsync: {ex.Message}");
            return new StatusCodeResult(500);
        }
    }
}