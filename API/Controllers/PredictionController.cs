using API.DTO;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class PredictionController : BaseAPIController
{
    private readonly IPredictionService _predictionService;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;

    public PredictionController(IPredictionService predictionService, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _predictionService = predictionService;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PredictionDTO>> GetPrediction(int id)
    {
        var prediction = await _predictionService.GetPrediction(id);
        return prediction;
    }

    [HttpGet("rank/user/{userId}")]
    public async Task<ActionResult<List<PredictionDTO>>> GetPredictionsByUserId(int userId)
    {
        var predictions = await _predictionService.GetPredictionsByUserId(userId, true, false, false);
        return predictions;
    }

    [HttpPost("create")]
    public async Task<ActionResult<PredictionDTO>> CreatePrediction([FromBody] PredictionDTO predictionDTO)
    {
        var userId = User.GetUserId();
        var predictionCreationResult = await _predictionService.CreatePrediction(predictionDTO, userId);
        return predictionCreationResult;
    }

    [HttpPut("update")]
    public async Task<ActionResult> UpdatePrediction([FromBody] PredictionDTO predictionDTO)
    {
        var userId = User.GetUserId();
        var predictionUpdateResult = await _predictionService.UpdatePrediction(predictionDTO, userId);
        return predictionUpdateResult;
    }
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeletePrediction(int id)
    {
        try
        {
            var userId = User.GetUserId();
            Console.WriteLine($"=== DELETE PREDICTION CONTROLLER ===");
            Console.WriteLine($"Deleting prediction: ID={id}, User={userId}");

            if (userId <= 0)
            {
                Console.WriteLine("Invalid user ID");
                return Unauthorized("Invalid user authentication");
            }

            // Get the prediction with all related data
            Console.WriteLine("Loading prediction with related data...");
            var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(
                id,
                includeUser: true,
                includePostRanks: true,
                includePostBingos: true,
                includePostBrackets: true
            );

            if (prediction == null)
            {
                Console.WriteLine("Prediction not found");
                return NotFound("Prediction not found");
            }

            Console.WriteLine($"Found prediction: {prediction.Title} by user {prediction.UserId}");

            // Verify ownership
            if (prediction.UserId != userId)
            {
                Console.WriteLine($"Ownership mismatch: prediction owned by {prediction.UserId}, current user {userId}");
                return Unauthorized("You can only delete your own predictions");
            }

            // Check if prediction has counter predictions from other users
            var counterRanks = prediction.PostRanks?.Where(pr => pr.UserId != userId).Count() ?? 0;
            var counterBingos = prediction.PostBingos?.Where(pb => pb.UserId != userId).Count() ?? 0;
            var counterBrackets = prediction.PostBrackets?.Where(pb => pb.UserId != userId).Count() ?? 0;

            Console.WriteLine($"Counter predictions: Ranks={counterRanks}, Bingos={counterBingos}, Brackets={counterBrackets}");

            var hasCounterPredictions = counterRanks > 0 || counterBingos > 0 || counterBrackets > 0;

            if (hasCounterPredictions && !prediction.IsDraft)
            {
                Console.WriteLine("Cannot delete published prediction with counter predictions");
                return BadRequest("Cannot delete published predictions with counter predictions");
            }

            // Delete the prediction
            Console.WriteLine("Calling repository delete method...");
            var deleteResult = await _unitOfWork.PredictionRepository.DeletePrediction(prediction);

            if (!deleteResult)
            {
                Console.WriteLine($"Repository delete method returned false for prediction {id}");
                return BadRequest("Failed to delete prediction");
            }

            Console.WriteLine($"Successfully deleted prediction with ID {id}");
            return Ok("Prediction deleted successfully");
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
        {
            Console.WriteLine($"=== DATABASE ERROR DELETING PREDICTION ===");
            Console.WriteLine($"DbUpdateException: {dbEx.Message}");
            if (dbEx.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {dbEx.InnerException.Message}");
            }
            Console.WriteLine($"Stack trace: {dbEx.StackTrace}");

            return StatusCode(500, "Database error occurred while deleting the prediction");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== GENERAL ERROR DELETING PREDICTION ===");
            Console.WriteLine($"Exception type: {ex.GetType().Name}");
            Console.WriteLine($"Error message: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");

            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }

            return StatusCode(500, "An error occurred while deleting the prediction");
        }
    }
}