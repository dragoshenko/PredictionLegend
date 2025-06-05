using API.DTO;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class CreationFlowController : BaseAPIController
{
    private readonly ICreationFlowService _creationFlowService;

    public CreationFlowController(ICreationFlowService creationFlowService)
    {
        _creationFlowService = creationFlowService;
    }

    [HttpPost("start")]
    public async Task<ActionResult<CreatePredictionFlowDTO>> StartCreationFlow([FromBody] PredictionDTO predictionDTO)
    {
        var userId = User.GetUserId();
        return await _creationFlowService.StartCreationFlowAsync(predictionDTO, userId);
    }

    [HttpPost("edit-template")]
    public async Task<ActionResult<EditTemplateResponseDTO>> EditTemplate([FromBody] EditTemplateRequestDTO request)
    {
        var userId = User.GetUserId();
        return await _creationFlowService.EditTemplateAsync(request, userId);
    }

    [HttpPost("select-teams")]
    public async Task<ActionResult> SelectTeams([FromBody] SelectTeamsDTO selectTeamsDTO)
    {
        var userId = User.GetUserId();
        return await _creationFlowService.SelectTeamsAsync(selectTeamsDTO, userId);
    }

    [HttpPost("create-post")]
    public async Task<ActionResult> CreatePost([FromBody] CreatePostRequestDTO request)
    {
        var userId = User.GetUserId();
        return await _creationFlowService.CreatePostAsync(request, userId);
    }

    [HttpPost("abandon")]
    public async Task<ActionResult> AbandonFlow([FromBody] AbandonFlowDTO abandonFlowDTO)
    {
        var userId = User.GetUserId();
        return await _creationFlowService.AbandonFlowAsync(abandonFlowDTO, userId);
    }

    [HttpPost("counter-prediction")]
    public async Task<ActionResult<PostRankDTO>> CreateCounterPrediction([FromBody] CreateCounterPredictionDTO request)
    {
        var userId = User.GetUserId();
        return await _creationFlowService.CreateCounterPredictionAsync(request, userId);
    }

    [HttpPost("cleanup-expired")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<ActionResult> CleanupExpiredFlows()
    {
        return await _creationFlowService.CleanupExpiredFlowsAsync();
    }
}