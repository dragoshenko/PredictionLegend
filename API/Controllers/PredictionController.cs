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

    public PredictionController(IPredictionService predictionService, IMapper mapper)
    {
        _predictionService = predictionService;
        _mapper = mapper;
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

}