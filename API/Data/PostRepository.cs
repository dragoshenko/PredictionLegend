using System;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class PostRepository : IPostRepository
{
    private DataContext _context;
    public PostRepository(DataContext context)
    {
        _context = context;
    }

    #region PostRank
    public async Task<PostRank?> GetPostRank(int postRankId)
    {
        return await _context.PostRanks
            .Include(x => x.RankTable)
            .ThenInclude(x => x.Rows)
            .ThenInclude(x => x.Columns)
            .FirstOrDefaultAsync(x => x.Id == postRankId);
    }
    public async Task<List<PostRank>> GetPostRanks()
    {
        return await _context.PostRanks
            .Include(x => x.RankTable)
            .ThenInclude(x => x.Rows)
            .ThenInclude(x => x.Columns)
            .ToListAsync();
    }
    public async Task<PostRank> CreatePostRank(PostRank postRank)
    {
        var entity = await _context.PostRanks.AddAsync(postRank);
        return entity.Entity;
    }
    public async Task<bool> UpdatePostRank(PostRank postRank)
    {
        _context.PostRanks.Update(postRank);
        return await _context.SaveChangesAsync() > 0;
    }
    public async Task<bool> DeletePostRank(int postRankId)
    {
        var postRank = await GetPostRank(postRankId);
        if (postRank == null) return false;

        _context.PostRanks.Remove(postRank);
        return await _context.SaveChangesAsync() > 0;
    }
    #endregion
    #region PostBracket
    public async Task<PostBracket?> GetPostBracket(int postBracketId)
    {
        return await _context.PostBrackets
            .Include(x => x.RootBracket)
            .FirstOrDefaultAsync(x => x.Id == postBracketId);
    }
    public async Task<List<PostBracket>> GetPostBrackets()
    {
        return await _context.PostBrackets
            .Include(x => x.RootBracket)
            .ToListAsync();
    }
    public async Task<PostBracket> CreatePostBracket(PostBracket postBracket)
    {
        var entity = await _context.PostBrackets.AddAsync(postBracket);
        return entity.Entity;
    }
    public async Task<bool> UpdatePostBracket(PostBracket postBracket)
    {
        _context.PostBrackets.Update(postBracket);
        return await _context.SaveChangesAsync() > 0;
    }
    public async Task<bool> DeletePostBracket(int postBracketId)
    {
        var postBracket = await GetPostBracket(postBracketId);
        if (postBracket == null) return false;

        _context.PostBrackets.Remove(postBracket);
        return await _context.SaveChangesAsync() > 0;
    }
    #endregion
    #region PostBingo
    public async Task<PostBingo?> GetPostBingo(int postBingoId)
    {
        return await _context.PostBingos
            .Include(x => x.BingoCells)
            .FirstOrDefaultAsync(x => x.Id == postBingoId);
    }
    public async Task<List<PostBingo>> GetPostBingos()
    {
        return await _context.PostBingos
            .Include(x => x.BingoCells)
            .ToListAsync();
    }
    public async Task<PostBingo> CreatePostBingo(PostBingo postBingo)
    {
        var entity = await _context.PostBingos.AddAsync(postBingo);
        return entity.Entity;
    }
    public async Task<bool> UpdatePostBingo(PostBingo postBingo)
    {
        _context.PostBingos.Update(postBingo);
        return await _context.SaveChangesAsync() > 0;
    }
    public async Task<bool> DeletePostBingo(int postBingoId)
    {
        var postBingo = await GetPostBingo(postBingoId);
        if (postBingo == null) return false;

        _context.PostBingos.Remove(postBingo);
        return await _context.SaveChangesAsync() > 0;
    }
    #endregion
    public async Task<List<PostRank>> GetPostRanksByUserIdAsync(int userId)
    {
        return await _context.PostRanks
            .Include(pr => pr.User)
            .Include(pr => pr.Prediction)
                .ThenInclude(p => p.User)
            .Include(pr => pr.RankTable)
                .ThenInclude(rt => rt.Rows)
                    .ThenInclude(r => r.Columns)
                        .ThenInclude(c => c.Team)
            .Include(pr => pr.Teams)
            .Where(pr => pr.UserId == userId)
            .OrderByDescending(pr => pr.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<List<PostBingo>> GetPostBingosByUserIdAsync(int userId)
    {
        return await _context.PostBingos
            .Include(pb => pb.User)
            .Include(pb => pb.Prediction)
                .ThenInclude(p => p.User)
            .Include(pb => pb.BingoCells)
                .ThenInclude(bc => bc.Team)
            .Include(pb => pb.Teams)
            .Where(pb => pb.UserId == userId)
            .OrderByDescending(pb => pb.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<List<PostBracket>> GetPostBracketsByUserIdAsync(int userId)
    {
        return await _context.PostBrackets
            .Include(pb => pb.User)
            .Include(pb => pb.Prediction)
                .ThenInclude(p => p.User)
            .Include(pb => pb.RootBracket)
                .ThenInclude(rb => rb.Brackets)
            .Include(pb => pb.Teams)
            .Where(pb => pb.UserId == userId)
            .OrderByDescending(pb => pb.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<PostRank?> GetPostRankWithDetailsAsync(int postRankId)
    {
        return await _context.PostRanks
            .Include(pr => pr.User)
            .Include(pr => pr.Prediction)
                .ThenInclude(p => p.User)
            .Include(pr => pr.RankTable)
                .ThenInclude(rt => rt.Rows)
                    .ThenInclude(r => r.Columns)
                        .ThenInclude(c => c.Team)
            .Include(pr => pr.Teams)
            .FirstOrDefaultAsync(pr => pr.Id == postRankId);
    }
    
    public async Task<PostBingo?> GetPostBingoWithDetailsAsync(int postBingoId)
    {
        return await _context.PostBingos
            .Include(pb => pb.User)
            .Include(pb => pb.Prediction)
                .ThenInclude(p => p.User)
            .Include(pb => pb.BingoCells)
                .ThenInclude(bc => bc.Team)
            .Include(pb => pb.Teams)
            .FirstOrDefaultAsync(pb => pb.Id == postBingoId);
    }
    
    public async Task<PostBracket?> GetPostBracketWithDetailsAsync(int postBracketId)
    {
        return await _context.PostBrackets
            .Include(pb => pb.User)
            .Include(pb => pb.Prediction)
                .ThenInclude(p => p.User)
            .Include(pb => pb.RootBracket)
                .ThenInclude(rb => rb.Brackets)
            .Include(pb => pb.Teams)
            .FirstOrDefaultAsync(pb => pb.Id == postBracketId);
    }
}

