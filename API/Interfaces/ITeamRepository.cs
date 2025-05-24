using System;
using API.Entities;

namespace API.Interfaces;

public interface ITeamRepository
{
    Task<Team?> CreateTeamAsync(Team team);
    Task<Team?> UpdateTeamAsync(Team team);
    Task<Team?> GetTeamAsync(int id);
    Task<List<Team>> GetAllTeamsAsync();
    Task<List<Team>> GetTemplateTeamsAsync(int templateId, PredictionType predictionType);
    Task<List<Team>> GetUserTeamsAsync(int userId);
    Task<bool> DeleteTeamAsync(int id);
    Task<bool> TeamExistsAsync(int id);
}
