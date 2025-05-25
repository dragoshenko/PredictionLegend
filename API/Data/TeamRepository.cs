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
            // Ensure CreatedAt is set
            if (team.CreatedAt == default(DateTime))
            {
                team.CreatedAt = DateTime.UtcNow;
            }

            // Ensure CreatedByUser is loaded if we have the ID
            if (team.CreatedByUser == null && team.CreatedByUserId > 0)
            {
                team.CreatedByUser = await _userManager.FindByIdAsync(team.CreatedByUserId.ToString());
            }

            // Add to context
            await _context.Teams.AddAsync(team);
            await _context.SaveChangesAsync();
            
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
            throw;
        }
    }

    public async Task<Team?> UpdateTeamAsync(Team team)
    {
        try
        {
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
        var team = await _context.Teams
            .Include(t => t.CreatedByUser)
            .FirstOrDefaultAsync(t => t.Id == id);
        return team;
    }

    public async Task<List<Team>> GetAllTeamsAsync()
    {
        var teams = await _context.Teams
            .Include(t => t.CreatedByUser)
            .ToListAsync();
        return teams;
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
            var user = await _userManager.Users
                .Include(u => u.Teams)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.Teams == null)
            {
                return new List<Team>();
            }

            // Load the teams with CreatedByUser navigation property
            var teamIds = user.Teams.Select(t => t.Id).ToList();
            var teamsWithNavigation = await _context.Teams
                .Include(t => t.CreatedByUser)
                .Where(t => teamIds.Contains(t.Id))
                .ToListAsync();

            return teamsWithNavigation;
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
        return await _context.Teams.AnyAsync(t => t.Id == id);
    }
}