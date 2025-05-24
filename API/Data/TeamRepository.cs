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
        await _context.Teams.AddAsync(team);
        await _context.SaveChangesAsync();
        return team;
    }

    public async Task<Team?> UpdateTeamAsync(Team team)
    {
        _context.Entry(team).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return team;
    }

    public async Task<Team?> GetTeamAsync(int id)
    {
        var team = await _context.Teams
            .FirstOrDefaultAsync(t => t.Id == id);
        return team;
    }

    public async Task<List<Team>> GetAllTeamsAsync()
    {
        var teams = await _context.Teams.ToListAsync();
        return teams;
    }

    public async Task<List<Team>> GetTemplateTeamsAsync(int templateId, PredictionType predictionType)
    {
        var teams = new List<Team>();
        RankingTemplate? rankingTemplate;
        BracketTemplate? bracketTemplate;
        BingoTemplate? bingoTemplate;
        switch (predictionType)
        {
            case PredictionType.Ranking:
                rankingTemplate = await _context.RankingTemplates
                    .Include(t => t.Teams)
                    .FirstOrDefaultAsync(t => t.Id == templateId);
                if (rankingTemplate != null)
                {
                    teams = [.. rankingTemplate.Teams];
                }
                break;
            case PredictionType.Bracket:
                bracketTemplate = await _context.BracketTemplates
                    .Include(t => t.Teams)
                    .FirstOrDefaultAsync(t => t.Id == templateId);
                if (bracketTemplate != null)
                {
                    teams = [.. bracketTemplate.Teams];
                }
                break;
            case PredictionType.Bingo:
                bingoTemplate = await _context.BingoTemplates
                    .Include(t => t.Teams)
                    .FirstOrDefaultAsync(t => t.Id == templateId);
                if (bingoTemplate != null)
                {
                    teams = [.. bingoTemplate.Teams];
                }
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(predictionType), predictionType, null);
        }
        return teams;
    }

    public async Task<List<Team>> GetUserTeamsAsync(int userId)
    {
        var teams = await _userManager.Users
            .Include(t => t.Teams)
            .FirstOrDefaultAsync(u => u.Id == userId)
            .ContinueWith(t => t.Result?.Teams ?? []);
        return teams;
    }

    public async Task<bool> DeleteTeamAsync(int id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null) return false;
        _context.Teams.Remove(team);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> TeamExistsAsync(int id)
    {
        return await _context.Teams.AnyAsync(t => t.Id == id);
    }
}
