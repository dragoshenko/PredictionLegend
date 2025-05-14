using API.DTO;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class PredictionRepository : IPredictionRepository
{
    private readonly DataContext _context;

    public PredictionRepository(DataContext context)
    {
        _context = context;
    }

    public async Task<Prediction?> GetPredictionByIdAsync(int id)
    {
        return await _context.Predictions
            .Include(p => p.AppUser)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Prediction>> GetPredictionsForUserAsync(int userId)
    {
        return await _context.Predictions
            .Where(p => p.AppUserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Prediction>> GetPublicPredictionsAsync()
    {
        return await _context.Predictions
            .Include(p => p.AppUser)
            .Where(p => p.PrivacyType == "public" && p.IsPublished)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Prediction> CreatePredictionAsync(Prediction prediction)
    {
        _context.Predictions.Add(prediction);
        await _context.SaveChangesAsync();
        return prediction;
    }

    public async Task<bool> UpdatePredictionAsync(Prediction prediction)
    {
        _context.Predictions.Update(prediction);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeletePredictionAsync(int id)
    {
        var prediction = await _context.Predictions.FindAsync(id);
        if (prediction == null) return false;

        _context.Predictions.Remove(prediction);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UserCanEditPredictionAsync(int userId, int predictionId)
    {
        var prediction = await _context.Predictions.FindAsync(predictionId);
        return prediction != null && prediction.AppUserId == userId;
    }
}