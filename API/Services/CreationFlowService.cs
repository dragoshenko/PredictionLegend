using System.Text.Json;
using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class CreationFlowService : ICreationFlowService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreationFlowService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ActionResult<CreatePredictionFlowDTO>> StartCreationFlowAsync(PredictionDTO predictionDTO, int userId)
    {
        try
        {
            // Create the prediction first
            var prediction = _mapper.Map<Prediction>(predictionDTO);
            prediction.UserId = userId;
            prediction.IsDraft = true; // Mark as draft until flow is complete

            if (prediction.PrivacyType == PrivacyType.Private)
            {
                prediction.AccessCode = GenerateUniqueSixCharacterCode();
            }

            var createdPrediction = await _unitOfWork.PredictionRepository.CreatePrediction(prediction);
            await _unitOfWork.Complete();

            // Create prediction categories
            if (predictionDTO.Categories.Any())
            {
                await _unitOfWork.CategoryRepository.CreatePredictionCategoriesByIdsAsync(createdPrediction.Id, predictionDTO.Categories);
            }

            // Create the creation flow
            var flowToken = GenerateFlowToken();
            var creationFlow = new CreationFlow
            {
                FlowToken = flowToken,
                UserId = userId,
                PredictionType = predictionDTO.PredictionType,
                PredictionId = createdPrediction.Id,
                Prediction = createdPrediction
            };

            await _unitOfWork.CreationFlowRepository.CreateFlowAsync(creationFlow);

            var result = new CreatePredictionFlowDTO
            {
                Id = creationFlow.Id,
                FlowToken = flowToken,
                UserId = userId,
                PredictionType = predictionDTO.PredictionType,
                Prediction = _mapper.Map<PredictionDTO>(createdPrediction),
                CreatedAt = creationFlow.CreatedAt,
                ExpiresAt = creationFlow.ExpiresAt
            };

            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error starting creation flow: {ex.Message}");
        }
    }

    public async Task<ActionResult<EditTemplateResponseDTO>> EditTemplateAsync(EditTemplateRequestDTO request, int userId)
    {
        try
        {
            var flow = await _unitOfWork.CreationFlowRepository.GetFlowByTokenAsync(request.FlowToken);
            if (flow == null || flow.UserId != userId)
            {
                return new BadRequestObjectResult("Invalid or expired flow token");
            }

            // Update flow with template selection
            flow.TemplateId = request.TemplateId;
            await _unitOfWork.CreationFlowRepository.UpdateFlowAsync(flow);

            // Get template data based on prediction type
            var templateName = "";
            var isOfficialTemplate = false;
            var existingTeams = new List<TeamDTO>();
            var minimumTeamsRequired = 0;

            switch (request.PredictionType)
            {
                case PredictionType.Ranking:
                    var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(request.TemplateId);
                    if (rankingTemplate == null) return new BadRequestObjectResult("Template not found");
                    templateName = rankingTemplate.Name;
                    isOfficialTemplate = rankingTemplate.OfficialTemplate;
                    minimumTeamsRequired = rankingTemplate.NumberOfRows * rankingTemplate.NumberOfColumns;
                    break;

                case PredictionType.Bracket:
                    var bracketTemplate = await _unitOfWork.TemplateRepository.GetBracketTemplate(request.TemplateId);
                    if (bracketTemplate == null) return new BadRequestObjectResult("Template not found");
                    templateName = bracketTemplate.Name;
                    isOfficialTemplate = bracketTemplate.OfficialTemplate;
                    minimumTeamsRequired = bracketTemplate.NumberOfBrackets;
                    break;

                case PredictionType.Bingo:
                    var bingoTemplate = await _unitOfWork.TemplateRepository.GetBingoTemplate(request.TemplateId);
                    if (bingoTemplate == null) return new BadRequestObjectResult("Template not found");
                    templateName = bingoTemplate.Name;
                    isOfficialTemplate = bingoTemplate.OfficialTemplate;
                    minimumTeamsRequired = bingoTemplate.GridSize * bingoTemplate.GridSize;
                    break;
            }

            // Get existing teams for this template
            var templateTeams = await _unitOfWork.TeamRepository.GetTemplateTeamsAsync(request.TemplateId, request.PredictionType);
            existingTeams = _mapper.Map<List<TeamDTO>>(templateTeams);

            // Get user's teams
            var userTeams = await _unitOfWork.TeamRepository.GetUserTeamsAsync(userId);
            var userTeamDTOs = _mapper.Map<List<TeamDTO>>(userTeams);

            // If it's an official template, we need to copy it for the user
            if (isOfficialTemplate)
            {
                await CopyOfficialTemplateForUser(request.TemplateId, request.PredictionType, userId);
            }

            var response = new EditTemplateResponseDTO
            {
                TemplateId = request.TemplateId,
                TemplateName = templateName,
                PredictionType = request.PredictionType,
                IsOfficialTemplate = isOfficialTemplate,
                ExistingTeams = existingTeams,
                UserTeams = userTeamDTOs,
                MinimumTeamsRequired = minimumTeamsRequired,
                FlowToken = request.FlowToken
            };

            return new OkObjectResult(response);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error editing template: {ex.Message}");
        }
    }

    public async Task<ActionResult> SelectTeamsAsync(SelectTeamsDTO selectTeamsDTO, int userId)
    {
        try
        {
            var flow = await _unitOfWork.CreationFlowRepository.GetFlowByTokenAsync(selectTeamsDTO.FlowToken);
            if (flow == null || flow.UserId != userId)
            {
                return new BadRequestObjectResult("Invalid or expired flow token");
            }

            // Create new teams if any
            var createdTeamIds = new List<int>();
            foreach (var newTeam in selectTeamsDTO.NewTeams)
            {
                var team = _mapper.Map<Team>(newTeam);
                team.CreatedByUserId = userId;
                var createdTeam = await _unitOfWork.TeamRepository.CreateTeamAsync(team);
                if (createdTeam != null)
                {
                    createdTeamIds.Add(createdTeam.Id);
                }
            }

            // Update flow with selected teams
            flow.SelectedTeamIds = JsonSerializer.Serialize(selectTeamsDTO.SelectedTeamIds);
            flow.CreatedTeamIds = JsonSerializer.Serialize(createdTeamIds);
            await _unitOfWork.CreationFlowRepository.UpdateFlowAsync(flow);

            return new OkResult();
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error selecting teams: {ex.Message}");
        }
    }

    public async Task<ActionResult> CreatePostAsync(CreatePostRequestDTO request, int userId)
    {
        try
        {
            var flow = await _unitOfWork.CreationFlowRepository.GetFlowByTokenAsync(request.FlowToken);
            if (flow == null || flow.UserId != userId)
            {
                return new BadRequestObjectResult("Invalid or expired flow token");
            }

            if (flow.PredictionId == null)
            {
                return new BadRequestObjectResult("No prediction associated with this flow");
            }

            // Create the appropriate post type
            switch (flow.PredictionType)
            {
                case PredictionType.Ranking:
                    if (request.PostRank == null) return new BadRequestObjectResult("PostRank data required");
                    await CreatePostRankAsync(request.PostRank, flow.PredictionId.Value, userId);
                    break;

                case PredictionType.Bracket:
                    if (request.PostBracket == null) return new BadRequestObjectResult("PostBracket data required");
                    await CreatePostBracketAsync(request.PostBracket, flow.PredictionId.Value, userId);
                    break;

                case PredictionType.Bingo:
                    if (request.PostBingo == null) return new BadRequestObjectResult("PostBingo data required");
                    await CreatePostBingoAsync(request.PostBingo, flow.PredictionId.Value, userId);
                    break;
            }

            // Mark prediction as no longer draft
            if (flow.Prediction != null)
            {
                flow.Prediction.IsDraft = false;
                await _unitOfWork.PredictionRepository.UpdatePredictionAsync(flow.Prediction);
            }

            // Complete the flow
            await _unitOfWork.CreationFlowRepository.CompleteFlowAsync(request.FlowToken);

            return new OkResult();
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error creating post: {ex.Message}");
        }
    }

    public async Task<ActionResult> AbandonFlowAsync(AbandonFlowDTO abandonFlowDTO, int userId)
    {
        try
        {
            var flow = await _unitOfWork.CreationFlowRepository.GetFlowByTokenAsync(abandonFlowDTO.FlowToken);
            if (flow == null || flow.UserId != userId)
            {
                return new BadRequestObjectResult("Invalid or expired flow token");
            }

            // Delete any created teams during this flow
            if (!string.IsNullOrEmpty(flow.CreatedTeamIds))
            {
                var createdTeamIds = JsonSerializer.Deserialize<List<int>>(flow.CreatedTeamIds) ?? new List<int>();
                foreach (var teamId in createdTeamIds)
                {
                    await _unitOfWork.TeamRepository.DeleteTeamAsync(teamId);
                }
            }

            // Delete the draft prediction if it exists
            if (flow.PredictionId.HasValue && flow.Prediction != null)
            {
                await _unitOfWork.PredictionRepository.DeletePrediction(flow.Prediction);
            }

            // Mark flow as abandoned
            await _unitOfWork.CreationFlowRepository.AbandonFlowAsync(abandonFlowDTO.FlowToken, abandonFlowDTO.Reason);

            return new OkResult();
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error abandoning flow: {ex.Message}");
        }
    }

    public async Task<ActionResult<PostRankDTO>> CreateCounterPredictionAsync(CreateCounterPredictionDTO request, int userId)
    {
        try
        {
            // Get the original prediction
            var originalPrediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(request.OriginalPredictionId);
            if (originalPrediction == null)
            {
                return new BadRequestObjectResult("Original prediction not found");
            }

            // Create the appropriate counter prediction post
            switch (request.PredictionType)
            {
                case PredictionType.Ranking:
                    if (request.PostRank == null) return new BadRequestObjectResult("PostRank data required");
                    await CreatePostRankAsync(request.PostRank, request.OriginalPredictionId, userId);
                    return new OkObjectResult(request.PostRank);

                case PredictionType.Bracket:
                    if (request.PostBracket == null) return new BadRequestObjectResult("PostBracket data required");
                    await CreatePostBracketAsync(request.PostBracket, request.OriginalPredictionId, userId);
                    return new OkObjectResult(request.PostBracket);

                case PredictionType.Bingo:
                    if (request.PostBingo == null) return new BadRequestObjectResult("PostBingo data required");
                    await CreatePostBingoAsync(request.PostBingo, request.OriginalPredictionId, userId);
                    return new OkObjectResult(request.PostBingo);

                default:
                    return new BadRequestObjectResult("Invalid prediction type");
            }
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error creating counter prediction: {ex.Message}");
        }
    }

    public async Task<ActionResult> CleanupExpiredFlowsAsync()
    {
        try
        {
            await _unitOfWork.CreationFlowRepository.CleanupExpiredFlowsAsync();
            return new OkResult();
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error cleaning up expired flows: {ex.Message}");
        }
    }

    private async Task CopyOfficialTemplateForUser(int templateId, PredictionType predictionType, int userId)
    {
        // Implementation to copy official template for user
        // This creates a user-specific copy of the official template
        switch (predictionType)
        {
            case PredictionType.Ranking:
                var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(templateId);
                if (rankingTemplate != null)
                {
                    var userTemplate = new RankingTemplate
                    {
                        Name = $"{rankingTemplate.Name} (My Copy)",
                        NumberOfRows = rankingTemplate.NumberOfRows,
                        NumberOfColumns = rankingTemplate.NumberOfColumns,
                        UserId = userId,
                        OfficialTemplate = false
                    };
                    await _unitOfWork.TemplateRepository.CreateRankingTemplate(userTemplate);
                }
                break;
                
            case PredictionType.Bracket:
                var bracketTemplate = await _unitOfWork.TemplateRepository.GetBracketTemplate(templateId);
                if (bracketTemplate != null)
                {
                    var userTemplate = new BracketTemplate(bracketTemplate.NumberOfRounds)
                    {
                        Name = $"{bracketTemplate.Name} (My Copy)",
                        UserId = userId,
                        OfficialTemplate = false,
                        BracketType = bracketTemplate.BracketType
                    };
                    await _unitOfWork.TemplateRepository.CreateBracketTemplate(userTemplate);
                }
                break;
                
            case PredictionType.Bingo:
                var bingoTemplate = await _unitOfWork.TemplateRepository.GetBingoTemplate(templateId);
                if (bingoTemplate != null)
                {
                    var userTemplate = new BingoTemplate
                    {
                        Name = $"{bingoTemplate.Name} (My Copy)",
                        GridSize = bingoTemplate.GridSize,
                        UserId = userId,
                        OfficialTemplate = false
                    };
                    await _unitOfWork.TemplateRepository.CreateBingoTemplate(userTemplate);
                }
                break;
        }
    }

    private async Task CreatePostRankAsync(PostRankDTO postRankDTO, int predictionId, int userId)
    {
        var postRank = _mapper.Map<PostRank>(postRankDTO);
        postRank.UserId = userId;
        postRank.PredictionId = predictionId;
        await _unitOfWork.PostRepository.CreatePostRank(postRank);
    }

    private async Task CreatePostBracketAsync(PostBracketDTO postBracketDTO, int predictionId, int userId)
    {
        var postBracket = _mapper.Map<PostBracket>(postBracketDTO);
        postBracket.UserId = userId;
        postBracket.PredictionId = predictionId;
        await _unitOfWork.PostRepository.CreatePostBracket(postBracket);
    }

    private async Task CreatePostBingoAsync(PostBingoDTO postBingoDTO, int predictionId, int userId)
    {
        var postBingo = _mapper.Map<PostBingo>(postBingoDTO);
        postBingo.UserId = userId;
        // Note: PostBingo doesn't have PredictionId in the current model, you may need to add it
        await _unitOfWork.PostRepository.CreatePostBingo(postBingo);
    }

    private string GenerateFlowToken()
    {
        return Guid.NewGuid().ToString("N")[..16].ToUpper();
    }

    private string GenerateUniqueSixCharacterCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new();
        char[] code = new char[6];
        for (int i = 0; i < code.Length; i++)
        {
            code[i] = chars[random.Next(chars.Length)];
        }
        return new string(code);
    }
}