// API/Data/TeamRepository.cs
using System;
using API.Entities;
using API.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class TeamRepository : ITeamRepository
{
    private DataContext _context;
    private UserManager<AppUser> _userManager;
    
    public TeamRepository(DataContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<Team?> CreateTeamAsync(Team team)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(team.Name))
            {
                throw new ArgumentException("Team name is required");
            }

            if (team.CreatedByUserId <= 0)
            {
                throw new ArgumentException("CreatedByUserId is required");
            }

            // Ensure CreatedAt is set
            if (team.CreatedAt == default(DateTime))
            {
                team.CreatedAt = DateTime.UtcNow;
            }

            // Ensure CreatedByUser is loaded if we have the ID
            if (team.CreatedByUser == null && team.CreatedByUserId > 0)
            {
                team.CreatedByUser = await _userManager.FindByIdAsync(team.CreatedByUserId.ToString());
                if (team.CreatedByUser == null)
                {
                    throw new ArgumentException($"User with ID {team.CreatedByUserId} not found");
                }
            }

            // Ensure description is not null (set to empty string if null)
            if (team.Description == null)
            {
                team.Description = string.Empty;
            }

            Console.WriteLine($"Adding team to context: {team.Name}, UserId: {team.CreatedByUserId}");

            // Add to context
            await _context.Teams.AddAsync(team);
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"Team saved to database with ID: {team.Id}");
            
            // Reload the team with all navigation properties
            var savedTeam = await _context.Teams
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(t => t.Id == team.Id);
            
            return savedTeam;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreateTeamAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            
            // Log inner exception if it exists
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            
            throw;
        }
    }

    public async Task<Team?> UpdateTeamAsync(Team team)
    {
        try
        {
            if (team.Id <= 0)
            {
                throw new ArgumentException("Team ID is required for update");
            }

            _context.Entry(team).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            
            // Reload the team with navigation properties
            var updatedTeam = await _context.Teams
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(t => t.Id == team.Id);
            
            return updatedTeam;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in UpdateTeamAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    public async Task<Team?> GetTeamAsync(int id)
    {
        try
        {
            var team = await _context.Teams
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(t => t.Id == id);
            return team;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetTeamAsync: {ex.Message}");
            throw;
        }
    }

    public async Task<List<Team>> GetAllTeamsAsync()
    {
        try
        {
            var teams = await _context.Teams
                .Include(t => t.CreatedByUser)
                .ToListAsync();
            return teams;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAllTeamsAsync: {ex.Message}");
            throw;
        }
    }

    public async Task<List<Team>> GetTemplateTeamsAsync(int templateId, PredictionType predictionType)
    {
        var teams = new List<Team>();
        RankingTemplate? rankingTemplate;
        BracketTemplate? bracketTemplate;
        BingoTemplate? bingoTemplate;
        
        try
        {
            switch (predictionType)
            {
                case PredictionType.Ranking:
                    rankingTemplate = await _context.RankingTemplates
                        .Include(t => t.Teams)
                            .ThenInclude(team => team.CreatedByUser)
                        .FirstOrDefaultAsync(t => t.Id == templateId);
                    if (rankingTemplate != null)
                    {
                        teams = [.. rankingTemplate.Teams];
                    }
                    break;
                    
                case PredictionType.Bracket:
                    bracketTemplate = await _context.BracketTemplates
                        .Include(t => t.Teams)
                            .ThenInclude(team => team.CreatedByUser)
                        .FirstOrDefaultAsync(t => t.Id == templateId);
                    if (bracketTemplate != null)
                    {
                        teams = [.. bracketTemplate.Teams];
                    }
                    break;
                    
                case PredictionType.Bingo:
                    bingoTemplate = await _context.BingoTemplates
                        .Include(t => t.Teams)
                            .ThenInclude(team => team.CreatedByUser)
                        .FirstOrDefaultAsync(t => t.Id == templateId);
                    if (bingoTemplate != null)
                    {
                        teams = [.. bingoTemplate.Teams];
                    }
                    break;
                    
                default:
                    throw new ArgumentOutOfRangeException(nameof(predictionType), predictionType, null);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetTemplateTeamsAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
        
        return teams;
    }

    public async Task<List<Team>> GetUserTeamsAsync(int userId)
    {
        try
        {
            // Get teams created by the user
            var userTeams = await _context.Teams
                .Include(t => t.CreatedByUser)
                .Where(t => t.CreatedByUserId == userId)
                .ToListAsync();

            return userTeams;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetUserTeamsAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return new List<Team>();
        }
    }

    public async Task<bool> DeleteTeamAsync(int id)
    {
        try
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null) return false;
            
            _context.Teams.Remove(team);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in DeleteTeamAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    public async Task<bool> TeamExistsAsync(int id)
    {
        try
        {
            return await _context.Teams.AnyAsync(t => t.Id == id);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in TeamExistsAsync: {ex.Message}");
            throw;
        }
    }
}