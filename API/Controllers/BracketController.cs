// using API.DTO;
// using API.Entities;
// using API.Extensions;
// using API.Interfaces;
// using AutoMapper;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;

// namespace API.Controllers;

// [Authorize]
// public class BracketController : BaseAPIController
// {
//     private readonly IUnitOfWork _unitOfWork;
//     private readonly IMapper _mapper;

//     public BracketController(IUnitOfWork unitOfWork, IMapper mapper)
//     {
//         _unitOfWork = unitOfWork;
//         _mapper = mapper;
//     }

//     [HttpPost]
//     public async Task<ActionResult<BracketPredictionDTO>> CreateBracket(CreateBracketDTO createBracketDTO)
//     {
//         var userId = User.GetUserId();

//         // Create the prediction entity
//         var prediction = new Prediction
//         {
//             Title = createBracketDTO.Title,
//             Description = createBracketDTO.Description,
//             Type = PredictionType.Bracket,
//             PrivacyType = Enum.Parse<PrivacyType>(createBracketDTO.PrivacyType, true),
//             CreatedAt = DateTime.UtcNow,
//             LastModified = DateTime.UtcNow,
//             IsDraft = !createBracketDTO.IsPublished,
//             UserId = userId
//         };

//         // Create the PostBracket entity
//         var postBracket = new PostBracket
//         {
//             CreatedAt = DateTime.UtcNow,
//             UpdatedAt = DateTime.UtcNow,
//             UserId = userId,
//             IsOfficialResult = false,
//             TotalScore = 0
//         };

//         // Create RootBracket entity with brackets
//         var rootBracket = new RootBracket
//         {
//             Content = createBracketDTO.Title,
//             CreatedAt = DateTime.UtcNow,
//             UpdatedAt = DateTime.UtcNow,
//             Score = 0
//         };

//         // Process bracket structure from DTO
//         var allBrackets = new List<Bracket>();

//         // Process the rounds and create bracket hierarchy
//         for (int round = 1; round <= createBracketDTO.Rounds; round++)
//         {
//             var matchesInRound = Math.Pow(2, createBracketDTO.Rounds - round);

//             for (int matchIndex = 0; matchIndex < matchesInRound; matchIndex++)
//             {
//                 var matchId = (int)Math.Pow(2, createBracketDTO.Rounds) - 1 + matchIndex;
//                 var matchDto = createBracketDTO.Matches.FirstOrDefault(m => m.Id == matchId);

//                 // Create bracket for this match
//                 var bracket = new Bracket
//                 {
//                     Content = matchDto?.Content ?? $"Match {matchIndex + 1} - Round {round}",
//                     CreatedAt = DateTime.UtcNow,
//                     UpdatedAt = DateTime.UtcNow,
//                     Order = matchIndex,
//                     Score = 0
//                 };

//                 // Link to parent bracket if not in first round
//                 if (round > 1)
//                 {
//                     var parentMatchIndex = matchIndex / 2;
//                     var parentBracketIndex = allBrackets.FindIndex(b =>
//                         b.Order == parentMatchIndex &&
//                         // Calculate parent round number
//                         b.Order == parentMatchIndex &&
//                         b.RootBracketId == rootBracket.Id);

//                     if (parentBracketIndex >= 0)
//                     {
//                         var parentBracket = allBrackets[parentBracketIndex];
//                         bracket.ParentBracketId = parentBracket.Id;

//                         // Set left or right child based on match index
//                         if (matchIndex % 2 == 0)
//                         {
//                             parentBracket.LeftBracketId = bracket.Id;
//                             parentBracket.LeftBracket = bracket;
//                         }
//                         else
//                         {
//                             parentBracket.RightBracketId = bracket.Id;
//                             parentBracket.RightBracket = bracket;
//                         }
//                     }
//                 }

//                 // Add winner information if available
//                 if (matchDto != null && !string.IsNullOrEmpty(matchDto.Winner))
//                 {
//                     bracket.Content = matchDto.Winner;
//                 }

//                 bracket.RootBracket = rootBracket;
//                 allBrackets.Add(bracket);

//                 // If final match, set it as root bracket's left and right
//                 if (round == createBracketDTO.Rounds)
//                 {
//                     rootBracket.LeftBracket = bracket;
//                     rootBracket.RightBracket = bracket;
//                     rootBracket.LeftBracketId = bracket.Id;
//                     rootBracket.RightBracketId = bracket.Id;
//                 }
//             }
//         }

//         // Set up the entity relationships
//         rootBracket.Brackets = allBrackets;
//         postBracket.RootBracket = rootBracket;
//         prediction.PostBrackets.Add(postBracket);

//         // Save to database
//         _unitOfWork.PredictionRepository.AddPrediction(prediction);

//         if (await _unitOfWork.Complete())
//         {
//             // Map to DTO and return
//             var resultDto = new BracketPredictionDTO
//             {
//                 Id = prediction.Id,
//                 Title = prediction.Title,
//                 Description = prediction.Description,
//                 PredictionType = prediction.Type.ToString(),
//                 PrivacyType = prediction.PrivacyType.ToString(),
//                 Rounds = createBracketDTO.Rounds,
//                 CreatedAt = prediction.CreatedAt,
//                 LastModified = prediction.LastModified,
//                 IsPublished = !prediction.IsDraft,
//                 Author = _mapper.Map<MemberDTO>(await _unitOfWork.UserRepository.GetUserByIdAsync(userId, false, false, true))
//             };

//             return Ok(resultDto);
//         }

//         return BadRequest("Failed to create bracket prediction");
//     }

//     [HttpGet("{id}")]
//     public async Task<ActionResult<BracketPredictionDetailDTO>> GetBracket(int id)
//     {
//         var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(id);

//         if (prediction == null)
//             return NotFound("Prediction not found");

//         // Check if user has access to this prediction
//         if (prediction.PrivacyType != PrivacyType.Public && prediction.UserId != User.GetUserId())
//             return Unauthorized("You do not have permission to view this prediction");

//         // Map prediction to DTO
//         var bracketDetail = await _unitOfWork.PredictionRepository.GetBracketDetailAsync(id);

//         if (bracketDetail == null)
//             return NotFound("Bracket details not found");

//         return Ok(bracketDetail);
//     }

//     [HttpGet("user")]
//     public async Task<ActionResult<IEnumerable<BracketPredictionDTO>>> GetUserBrackets()
//     {
//         var userId = User.GetUserId();
//         var brackets = await _unitOfWork.PredictionRepository.GetUserBracketPredictionsAsync(userId);

//         return Ok(brackets);
//     }

//     [HttpDelete("{id}")]
//     public async Task<ActionResult> DeleteBracket(int id)
//     {
//         var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(id);

//         if (prediction == null)
//             return NotFound("Prediction not found");

//         // Check if user has permission to delete this prediction
//         if (prediction.UserId != User.GetUserId())
//             return Unauthorized("You do not have permission to delete this prediction");

//         _unitOfWork.PredictionRepository.DeletePrediction(prediction);

//         if (await _unitOfWork.Complete())
//             return Ok();

//         return BadRequest("Failed to delete prediction");
//     }

//     [HttpPut("{id}/publish")]
//     public async Task<ActionResult> PublishBracket(int id)
//     {
//         var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(id);

//         if (prediction == null)
//             return NotFound("Prediction not found");

//         // Check if user has permission to update this prediction
//         if (prediction.UserId != User.GetUserId())
//             return Unauthorized("You do not have permission to update this prediction");

//         prediction.IsDraft = false;
//         prediction.LastModified = DateTime.UtcNow;

//         if (await _unitOfWork.Complete())
//             return Ok();

//         return BadRequest("Failed to publish prediction");
//     }
// }