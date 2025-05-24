using System;
using API.DTO;
using API.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface IPredictionService
{
    Task<ActionResult<PredictionDTO>> CreatePrediction(PredictionDTO predictionDTO, int userId);
    Task<ActionResult> UpdatePrediction(PredictionDTO predictionDTO, int userId);
    Task<ActionResult<PredictionDTO>> GetPrediction(int predictionId, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false);
    Task<ActionResult<List<PredictionDTO>>> GetPredictionsByUserId(int userId, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false);
    
}
