using API.DTO;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface ICreationFlowService
{
    Task<ActionResult<CreatePredictionFlowDTO>> StartCreationFlowAsync(PredictionDTO predictionDTO, int userId);
    Task<ActionResult<EditTemplateResponseDTO>> EditTemplateAsync(EditTemplateRequestDTO request, int userId);
    Task<ActionResult> SelectTeamsAsync(SelectTeamsDTO selectTeamsDTO, int userId);
    Task<ActionResult> CreatePostAsync(CreatePostRequestDTO request, int userId);
    Task<ActionResult> AbandonFlowAsync(AbandonFlowDTO abandonFlowDTO, int userId);
    Task<ActionResult<PostRankDTO>> CreateCounterPredictionAsync(CreateCounterPredictionDTO request, int userId);
    Task<ActionResult> CleanupExpiredFlowsAsync();
}