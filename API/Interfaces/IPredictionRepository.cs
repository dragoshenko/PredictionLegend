using API.DTO;
using API.Entities;
using API.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface IPredictionRepository
{
    Task<Prediction?> GetPredictionByIdAsync(int id);
    Task<IEnumerable<Prediction>> GetPredictionsForUserAsync(int userId);
    Task<IEnumerable<Prediction>> GetPublicPredictionsAsync();
    Task<Prediction> CreatePredictionAsync(Prediction prediction);
    Task<bool> UpdatePredictionAsync(Prediction prediction);
    Task<bool> DeletePredictionAsync(int id);
    // This method will check if the user is authorized to edit the prediction
    Task<bool> UserCanEditPredictionAsync(int userId, int predictionId);
}