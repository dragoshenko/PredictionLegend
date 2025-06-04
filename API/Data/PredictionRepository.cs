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

    public async Task<Prediction?> GetPredictionByIdAsync(
    int id,
    bool includeUser = false,
    bool includePostRanks = false,
    bool includePostBingos = false,
    bool includePostBrackets = false)
    {
        var query = _context.Predictions.AsQueryable();

        if (includeUser)
        {
            query = query.Include(p => p.User);
        }

        if (includePostRanks)
        {
            query = query
                .Include(p => p.PostRanks)
                    .ThenInclude(pr => pr.User) // ENSURE this is included
                .Include(p => p.PostRanks)
                    .ThenInclude(pr => pr.RankTable)
                        .ThenInclude(rt => rt.Rows)
                            .ThenInclude(r => r.Columns)
                                .ThenInclude(c => c.Team)
                .Include(p => p.PostRanks)
                    .ThenInclude(pr => pr.Teams);
        }

        if (includePostBingos)
        {
            query = query
                .Include(p => p.PostBingos)
                    .ThenInclude(pb => pb.User) // ENSURE this is included
                .Include(p => p.PostBingos)
                    .ThenInclude(pb => pb.BingoCells)
                        .ThenInclude(bc => bc.Team)
                .Include(p => p.PostBingos)
                    .ThenInclude(pb => pb.Teams);
        }

        if (includePostBrackets)
        {
            query = query
                .Include(p => p.PostBrackets)
                    .ThenInclude(pb => pb.User) // ENSURE this is included
                .Include(p => p.PostBrackets)
                    .ThenInclude(pb => pb.RootBracket)
                        .ThenInclude(rb => rb.Brackets)
                .Include(p => p.PostBrackets)
                    .ThenInclude(pb => pb.Teams);
        }

        return await query.FirstOrDefaultAsync(p => p.Id == id);
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
    public async Task<Prediction?> GetPredictionWithAllPostDataAsync(int id)
    {
        return await _context.Predictions
            .Include(p => p.User)
                .ThenInclude(u => u.Photo)
            // PostRanks with full hierarchy
            .Include(p => p.PostRanks)
                .ThenInclude(pr => pr.User)
                    .ThenInclude(u => u.Photo)
            .Include(p => p.PostRanks)
                .ThenInclude(pr => pr.RankTable)
                    .ThenInclude(rt => rt.Rows)
                        .ThenInclude(r => r.Columns)
                            .ThenInclude(c => c.Team)
            .Include(p => p.PostRanks)
                .ThenInclude(pr => pr.Teams)
            // PostBingos with full hierarchy
            .Include(p => p.PostBingos)
                .ThenInclude(pb => pb.User)
                    .ThenInclude(u => u.Photo)
            .Include(p => p.PostBingos)
                .ThenInclude(pb => pb.BingoCells)
                    .ThenInclude(bc => bc.Team)
            .Include(p => p.PostBingos)
                .ThenInclude(pb => pb.Teams)
            // PostBrackets with full hierarchy
            .Include(p => p.PostBrackets)
                .ThenInclude(pb => pb.User)
                    .ThenInclude(u => u.Photo)
            .Include(p => p.PostBrackets)
                .ThenInclude(pb => pb.RootBracket)
                    .ThenInclude(rb => rb.Brackets)
            .Include(p => p.PostBrackets)
                .ThenInclude(pb => pb.Teams)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<List<Prediction>> GetAllPublishedPredictionsAsync(bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false)
    {
        try
        {
            Console.WriteLine("=== GetAllPublishedPredictionsAsync: Getting ALL users' predictions ===");

            var query = _context.Predictions.AsQueryable();

            // DON'T filter by draft/active here - let the service decide
            // We want to get ALL predictions and filter in the service layer

            if (includeUser)
            {
                query = query.Include(p => p.User)
                    .ThenInclude(u => u.Photo);
            }

            if (includePostRanks)
            {
                query = query
                    .Include(p => p.PostRanks)
                        .ThenInclude(pr => pr.User)
                            .ThenInclude(u => u.Photo)
                    .Include(p => p.PostRanks)
                        .ThenInclude(pr => pr.RankTable)
                            .ThenInclude(rt => rt.Rows)
                                .ThenInclude(r => r.Columns)
                                    .ThenInclude(c => c.Team)
                    .Include(p => p.PostRanks)
                        .ThenInclude(pr => pr.Teams);
            }

            if (includePostBingos)
            {
                query = query
                    .Include(p => p.PostBingos)
                        .ThenInclude(pb => pb.User)
                            .ThenInclude(u => u.Photo)
                    .Include(p => p.PostBingos)
                        .ThenInclude(pb => pb.BingoCells)
                            .ThenInclude(bc => bc.Team)
                    .Include(p => p.PostBingos)
                        .ThenInclude(pb => pb.Teams);
            }

            if (includePostBrackets)
            {
                query = query
                    .Include(p => p.PostBrackets)
                        .ThenInclude(pb => pb.User)
                            .ThenInclude(u => u.Photo)
                    .Include(p => p.PostBrackets)
                        .ThenInclude(pb => pb.RootBracket)
                            .ThenInclude(rb => rb.Brackets)
                                .ThenInclude(b => b.LeftTeam)
                    .Include(p => p.PostBrackets)
                        .ThenInclude(pb => pb.RootBracket)
                            .ThenInclude(rb => rb.Brackets)
                                .ThenInclude(b => b.RightTeam)
                    .Include(p => p.PostBrackets)
                        .ThenInclude(pb => pb.Teams);
            }

            var result = await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            Console.WriteLine($"GetAllPublishedPredictionsAsync found {result.Count} total predictions from ALL users");

            foreach (var prediction in result)
            {
                Console.WriteLine($"Prediction {prediction.Id}: '{prediction.Title}' by User {prediction.UserId}");
                Console.WriteLine($"  - IsDraft: {prediction.IsDraft}");
                Console.WriteLine($"  - IsActive: {prediction.IsActive}");
                Console.WriteLine($"  - PrivacyType: {prediction.PrivacyType}");
                Console.WriteLine($"  - PostRanks: {prediction.PostRanks?.Count ?? 0}");
                Console.WriteLine($"  - PostBingos: {prediction.PostBingos?.Count ?? 0}");
                Console.WriteLine($"  - PostBrackets: {prediction.PostBrackets?.Count ?? 0}");
                Console.WriteLine($"  - User: {prediction.User?.DisplayName ?? "Unknown"}");
            }

            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetAllPublishedPredictionsAsync: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }
}