using API.DTO;
using API.Entities;
using API.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface IPredictionRepository
{
    // General prediction methods
    Task<Prediction> CreatePrediction(Prediction prediction);
    Task<bool> DeletePrediction(Prediction prediction);
    Task<Prediction?> GetPredictionByIdAsync(int id, bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false);
    Task<Prediction?> GetPredictionByUserIdAsync(int userId, bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false);
    Task<List<Prediction>> GetPredictionsByUserIdAsync(int userId, bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false);
    Task<IEnumerable<PredictionDTO>> GetUserPredictionsAsync(int userId);
    Task<IEnumerable<PredictionDTO>> GetPublicPredictionsAsync(PaginationParams paginationParams);
    Task<IEnumerable<PredictionDTO>> GetPredictionsByCategoryAsync(int categoryId, PaginationParams paginationParams);
    Task<int> GetPredictionsCountAsync();
    Task<Prediction?> UpdatePredictionAsync(Prediction prediction);

    // Bracket-specific methods
    Task<BracketPredictionDetailDTO?> GetBracketDetailAsync(int predictionId);
    Task<IEnumerable<BracketPredictionDTO>> GetUserBracketPredictionsAsync(int userId);
    Task<IEnumerable<BracketPredictionDTO>> GetPublicBracketPredictionsAsync(PaginationParams paginationParams);

    // Ranking-specific methods
    Task<IEnumerable<PredictionDTO>> GetUserRankingPredictionsAsync(int userId);

    // Category-related prediction methods
    Task<IEnumerable<PredictionDTO>> GetTrendingPredictionsAsync(int count);
    Task AddPredictionCategoryAsync(int predictionId, int categoryId);
    Task RemovePredictionCategoryAsync(int predictionId, int categoryId);
    Task<List<Prediction>> GetAllPublishedPredictionsAsync(bool includeUser = false, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false);
}