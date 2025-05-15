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
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PredictionController(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PredictionDTO>>> GetUserPredictions()
    {
        var userId = User.GetUserId();
        var predictions = await _unitOfWork.PredictionRepository.GetPredictionsForUserAsync(userId);
        var predictionsDto = _mapper.Map<IEnumerable<PredictionDTO>>(predictions);
        return Ok(predictionsDto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PredictionDTO>> GetPrediction(int id)
    {
        var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(id);
        
        if (prediction == null) return NotFound();
        
        // Check if the prediction is private and if the user is authorized
        if (prediction.PrivacyType == "private" && prediction.AppUserId != User.GetUserId())
        {
            return Unauthorized("You are not authorized to view this prediction");
        }
        
        var predictionDto = _mapper.Map<PredictionDTO>(prediction);
        return Ok(predictionDto);
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PredictionDTO>>> GetPublicPredictions()
    {
        var predictions = await _unitOfWork.PredictionRepository.GetPublicPredictionsAsync();
        var predictionsDto = _mapper.Map<IEnumerable<PredictionDTO>>(predictions);
        return Ok(predictionsDto);
    }

    [HttpPost]
    public async Task<ActionResult<PredictionDTO>> CreatePrediction(CreatePredictionDTO createPredictionDto)
    {
        var userId = User.GetUserId();
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        
        if (user == null) return Unauthorized();
        
        var prediction = new Prediction
        {
            Title = createPredictionDto.Title,
            Description = createPredictionDto.Description,
            PredictionType = createPredictionDto.PredictionType,
            PrivacyType = createPredictionDto.PrivacyType,
            Rows = createPredictionDto.Rows,
            Columns = createPredictionDto.Columns,
            AppUserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        
        var createdPrediction = await _unitOfWork.PredictionRepository.CreatePredictionAsync(prediction);
        Console.WriteLine($"Created prediction with ID: {createdPrediction.Id}");
        var result = await _unitOfWork.Complete(); // Check if this is being called
        Console.WriteLine($"UnitOfWork.Complete() result: {result}");

        var predictionDto = _mapper.Map<PredictionDTO>(createdPrediction);
        
        return CreatedAtAction(nameof(GetPrediction), new { id = predictionDto.Id }, predictionDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePrediction(int id, CreatePredictionDTO updatePredictionDto)
    {
        var userId = User.GetUserId();
        var canEdit = await _unitOfWork.PredictionRepository.UserCanEditPredictionAsync(userId, id);
        
        if (!canEdit) return Unauthorized("You are not authorized to edit this prediction");
        
        var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(id);
        if (prediction == null) return NotFound();
        
        prediction.Title = updatePredictionDto.Title;
        prediction.Description = updatePredictionDto.Description;
        prediction.PredictionType = updatePredictionDto.PredictionType;
        prediction.PrivacyType = updatePredictionDto.PrivacyType;
        prediction.Rows = updatePredictionDto.Rows;
        prediction.Columns = updatePredictionDto.Columns;
        prediction.LastModified = DateTime.UtcNow;
        
        var result = await _unitOfWork.PredictionRepository.UpdatePredictionAsync(prediction);
        
        if (result) return NoContent();
        
        return BadRequest("Failed to update prediction");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePrediction(int id)
    {
        var userId = User.GetUserId();
        var canEdit = await _unitOfWork.PredictionRepository.UserCanEditPredictionAsync(userId, id);
        
        if (!canEdit) return Unauthorized("You are not authorized to delete this prediction");
        
        var result = await _unitOfWork.PredictionRepository.DeletePredictionAsync(id);
        
        if (result) return NoContent();
        
        return BadRequest("Failed to delete prediction");
    }
    
    [HttpPut("{id}/publish")]
    public async Task<IActionResult> PublishPrediction(int id)
    {
        var userId = User.GetUserId();
        var canEdit = await _unitOfWork.PredictionRepository.UserCanEditPredictionAsync(userId, id);
        
        if (!canEdit) return Unauthorized("You are not authorized to publish this prediction");
        
        var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(id);
        if (prediction == null) return NotFound();
        
        prediction.IsPublished = true;
        prediction.LastModified = DateTime.UtcNow;
        
        var result = await _unitOfWork.PredictionRepository.UpdatePredictionAsync(prediction);
        
        if (result) return NoContent();
        
        return BadRequest("Failed to publish prediction");
    }
}