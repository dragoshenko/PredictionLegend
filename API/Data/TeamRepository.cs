// API/Data/TeamRepository.cs - FIXED VERSION
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
            // FIXED: Ensure all required properties are set
            if (team.CreatedAt == default(DateTime))
            {
                team.CreatedAt = DateTime.UtcNow;
            }

            // FIXED: Ensure CreatedByUser is loaded properly
            if (team.CreatedByUser == null && team.CreatedByUserId > 0)
            {
                team.CreatedByUser = await _userManager.FindByIdAsync(team.CreatedByUserId.ToString());
                if (team.CreatedByUser == null)
                {
                    throw new InvalidOperationException($"User with ID {team.CreatedByUserId} not found");
                }
            }

            // FIXED: Validate required fields before saving
            if (string.IsNullOrWhiteSpace(team.Name))
            {
                throw new ArgumentException("Team name is required");
            }

            if (team.Name.Length < 2 || team.Name.Length > 100)
            {
                throw new ArgumentException("Team name must be between 2 and 100 characters");
            }

            // FIXED: Ensure Description is never null (entity requires non-null)
            if (team.Description == null)
            {
                team.Description = string.Empty;
            }

            // FIXED: Check for duplicate team names per user
            var existingTeam = await _context.Teams
                .FirstOrDefaultAsync(t => t.CreatedByUserId == team.CreatedByUserId && 
                                         t.Name.ToLower() == team.Name.ToLower());
            
            if (existingTeam != null)
            {
                throw new InvalidOperationException("A team with this name already exists for this user");
            }

            // Add to context
            await _context.Teams.AddAsync(team);
            await _context.SaveChangesAsync();
            
            // FIXED: Reload the team with all navigation properties
            var savedTeam = await _context.Teams
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(t => t.Id == team.Id);
            
            return savedTeam;
        }
        catch (DbUpdateException ex)
        {
            // FIXED: Handle database constraint violations
            Console.WriteLine($"Database error in CreateTeamAsync: {ex.Message}");
            if (ex.InnerException?.Message.Contains("UNIQUE") == true || 
                ex.InnerException?.Message.Contains("duplicate") == true)
            {
                throw new InvalidOperationException("A team with this name already exists");
            }
            throw new InvalidOperationException("Failed to create team due to database error", ex);
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
            // FIXED: Check if team exists before updating
            var existingTeam = await _context.Teams
                .FirstOrDefaultAsync(t => t.Id == team.Id);
            
            if (existingTeam == null)
            {
                throw new InvalidOperationException($"Team with ID {team.Id} not found");
            }

            // FIXED: Update only the changed properties
            existingTeam.Name = team.Name;
            existingTeam.Description = team.Description ?? string.Empty;
            existingTeam.PhotoUrl = team.PhotoUrl;
            existingTeam.Score = team.Score;

            _context.Entry(existingTeam).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            
            // Reload the team with navigation properties
            var updatedTeam = await _context.Teams
                .Include(t => t.CreatedByUser)
                .FirstOrDefaultAsync(t => t.Id == existingTeam.Id);
            
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
            .OrderBy(t => t.Name)
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
            // FIXED: Direct query instead of loading user first
            var teams = await _context.Teams
                .Include(t => t.CreatedByUser)
                .Where(t => t.CreatedByUserId == userId)
                .OrderBy(t => t.Name)
                .ToListAsync();

            return teams;
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