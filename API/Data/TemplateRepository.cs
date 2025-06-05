using System;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class TemplateRepository : ITemplateRepository
{
    private DataContext _context;
    public TemplateRepository(DataContext context)
    {
        _context = context;
    }
    #region Ranking Templates
    public async Task<RankingTemplate> CreateRankingTemplate(RankingTemplate rankingTemplate)
    {
        var entity = await _context.RankingTemplates.AddAsync(rankingTemplate);
        return entity.Entity;
    }
    public async Task<bool> DeleteRankingTemplate(int id)
    {
        var template = await _context.RankingTemplates.FindAsync(id);
        if (template == null) return false;
        _context.RankingTemplates.Remove(template);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
    public async Task<RankingTemplate?> GetRankingTemplate(int id)
    {
        var template = await _context.RankingTemplates.FindAsync(id);
        return template;
    }
    public async Task<List<RankingTemplate>> GetOfficialRankingTemplates()
    {
        var templates = await _context.RankingTemplates.Where(t => t.OfficialTemplate).ToListAsync();
        return templates;
    }
    public Task<List<RankingTemplate>> GetUserRankingTemplates(int userId)
    {
        var templates = _context.RankingTemplates.Where(t => t.UserId == userId).ToListAsync();
        return templates;
    }
    public async Task<bool> UpdateRankingTemplate(RankingTemplate rankingTemplate)
    {

        _context.Entry(rankingTemplate).State = EntityState.Modified;
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
    #endregion
    #region Bracket Templates
    public async Task<BracketTemplate> CreateBracketTemplate(BracketTemplate bracketTemplate)
    {
        var entity = await _context.BracketTemplates.AddAsync(bracketTemplate);
        return entity.Entity;
    }
    public async Task<bool> DeleteBracketTemplate(int id)
    {
        var template = await _context.BracketTemplates.FindAsync(id);
        if (template == null) return false;
        _context.BracketTemplates.Remove(template);
        var result = _context.SaveChanges();
        return result > 0;
    }
    public async Task<BracketTemplate?> GetBracketTemplate(int id)
    {
        var template = await _context.BracketTemplates
            .Include(bt => bt.Teams)
            .Include(bt => bt.User)
            .FirstOrDefaultAsync(bt => bt.Id == id);
        return template;
    }

    public async Task<List<BracketTemplate>> GetOfficialBracketTemplates()
    {
        var templates = await _context.BracketTemplates
            .Include(bt => bt.Teams)
            .Where(t => t.OfficialTemplate)
            .OrderBy(t => t.Name)
            .ToListAsync();
        return templates;
    }

    public async Task<List<BracketTemplate>> GetUserBracketTemplates(int userId)
    {
        var templates = await _context.BracketTemplates
            .Include(bt => bt.Teams)
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Name)
            .ToListAsync();
        return templates;
    }
    public async Task<bool> UpdateBracketTemplate(BracketTemplate bracketTemplate)
    {
        var entity = _context.Entry(bracketTemplate);
        entity.State = EntityState.Modified;
        var result = await _context.SaveChangesAsync();
        return result > 0;

    }
    #endregion
    #region Bingo Templates
    public async Task<BingoTemplate> CreateBingoTemplate(BingoTemplate bingoTemplate)
    {
        var entity = await _context.BingoTemplates.AddAsync(bingoTemplate);
        return entity.Entity;
    }
    public async Task<bool> DeleteBingoTemplate(int id)
    {
        var template = await _context.BingoTemplates.FindAsync(id);
        if (template == null) return false;
        _context.BingoTemplates.Remove(template);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
    public async Task<BingoTemplate?> GetBingoTemplate(int id)
    {
        var template = await _context.BingoTemplates.FindAsync(id);
        return template;
    }
    public async Task<List<BingoTemplate>> GetOfficialBingoTemplates()
    {
        var templates = await _context.BingoTemplates.Where(t => t.OfficialTemplate).ToListAsync();
        return templates;
    }
    public async Task<List<BingoTemplate>> GetUserBingoTemplates(int userId)
    {
        var templates = await _context.BingoTemplates.Where(t => t.UserId == userId).ToListAsync();
        return templates;
    }
    public async Task<bool> UpdateBingoTemplate(BingoTemplate bingoTemplate)
    {
        var entity = _context.Entry(bingoTemplate);
        entity.State = EntityState.Modified;
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }
    #endregion
}
