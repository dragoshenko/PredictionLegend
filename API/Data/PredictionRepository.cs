using System.Threading.Tasks;
using API.DTO;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class PredictionRepository : IPredictionRepository
{
    private readonly DataContext _context;

    public PredictionRepository(DataContext context)
    {
        _context = context;
    }

    public async Task<Prediction> CreatePrediction(Prediction prediction)
    {
        var entity = await _context.Predictions.AddAsync(prediction);
        return entity.Entity;
    }

    public Task AddPredictionCategoryAsync(int predictionId, int categoryId)
    {
        throw new NotImplementedException();
    }

    public async Task<bool> DeletePrediction(Prediction prediction)
    {
        // entity context modified
        _context.Entry(prediction).State = EntityState.Deleted;
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public Task<BracketPredictionDetailDTO?> GetBracketDetailAsync(int predictionId)
    {
        throw new NotImplementedException();
    }

    public Task<Prediction?> GetPredictionByIdAsync(int id, bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false)
    {
        var query = _context.Predictions.AsQueryable();
        if (includeUser)
        {
            query = query.Include(p => p.User);
        }
        if (includePostRanks)
        {
            query = query.Include(p => p.PostRanks)
                .ThenInclude(pr => pr.RankTable)
                .ThenInclude(rt => rt.Rows)
                .ThenInclude(r => r.Columns)
                .ThenInclude(c => c.Team);
        }
        if (includePostBingos)
        {
            query = query.Include(p => p.PostBingos)
                .ThenInclude(pb => pb.BingoCells)
                .ThenInclude(bc => bc.Team);
        }
        if (includePostBrackets)
        {
            query = query.Include(p => p.PostBrackets)
                .ThenInclude(pb => pb.RootBracket)
                .ThenInclude(bc => bc.Brackets);
        }
        return query.FirstOrDefaultAsync(p => p.Id == id);
    }

    public Task<IEnumerable<PredictionDTO>> GetPredictionsByCategoryAsync(int categoryId, PaginationParams paginationParams)
    {
        throw new NotImplementedException();
    }

    public Task<int> GetPredictionsCountAsync()
    {
        throw new NotImplementedException();
    }

    public async Task<Prediction?> UpdatePredictionAsync(Prediction prediction)
    {
        _context.Entry(prediction).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return prediction;
    }

    public Task<IEnumerable<BracketPredictionDTO>> GetPublicBracketPredictionsAsync(PaginationParams paginationParams)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<PredictionDTO>> GetPublicPredictionsAsync(PaginationParams paginationParams)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<PredictionDTO>> GetTrendingPredictionsAsync(int count)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<BracketPredictionDTO>> GetUserBracketPredictionsAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<PredictionDTO>> GetUserPredictionsAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<PredictionDTO>> GetUserRankingPredictionsAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public Task RemovePredictionCategoryAsync(int predictionId, int categoryId)
    {
        throw new NotImplementedException();
    }

    public Task<Prediction?> GetPredictionByUserIdAsync(int userId, bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false)
    {
        var query = _context.Predictions.AsQueryable();
        if (includeUser)
        {
            query = query.Include(p => p.User);
        }
        if (includePostRanks)
        {
            query = query.Include(p => p.PostRanks)
                .ThenInclude(pr => pr.RankTable)
                .ThenInclude(rt => rt.Rows)
                .ThenInclude(r => r.Columns)
                .ThenInclude(c => c.Team);
        }
        if (includePostBingos)
        {
            query = query.Include(p => p.PostBingos)
                .ThenInclude(pb => pb.BingoCells)
                .ThenInclude(bc => bc.Team);
        }
        if (includePostBrackets)
        {
            query = query.Include(p => p.PostBrackets)
                .ThenInclude(pb => pb.RootBracket)
                .ThenInclude(bc => bc.Brackets);
        }
        return query.FirstOrDefaultAsync(p => p.UserId == userId);
    }

    public Task<List<Prediction>> GetPredictionsByUserIdAsync(int userId, bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false)
    {
        var query = _context.Predictions.AsQueryable();
        if (includeUser)
        {
            query = query.Include(p => p.User);
        }
        if (includePostRanks)
        {
            query = query.Include(p => p.PostRanks)
                .ThenInclude(pr => pr.RankTable)
                .ThenInclude(rt => rt.Rows)
                .ThenInclude(r => r.Columns)
                .ThenInclude(c => c.Team);
        }
        if (includePostBingos)
        {
            query = query.Include(p => p.PostBingos)
                .ThenInclude(pb => pb.BingoCells)
                .ThenInclude(bc => bc.Team);
        }
        if (includePostBrackets)
        {
            query = query.Include(p => p.PostBrackets)
                .ThenInclude(pb => pb.RootBracket)
                .ThenInclude(bc => bc.Brackets);
        }
        return query.Where(p => p.UserId == userId).ToListAsync();
    }
}