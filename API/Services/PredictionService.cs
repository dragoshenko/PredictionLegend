using System;
using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class PredictionService : IPredictionService
{
    private IUnitOfWork _unitOfWork;
    private IMapper _mapper;

    public PredictionService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<ActionResult<PredictionDTO>> CreatePrediction(PredictionDTO predictionDTO, int userId)
    {
        var mappedPrediction = _mapper.Map<Prediction>(predictionDTO);

        PrivacyType privacyType = predictionDTO.PrivacyType;

        if (privacyType == PrivacyType.Private)
        {
            mappedPrediction.AccessCode = GenerateUniqueSixCharacterCode();
        }

        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        if (user == null)
            throw new Exception("User not found");
        mappedPrediction.User = user;
        mappedPrediction.UserId = userId;
        var createdPredictionResult = await _unitOfWork.PredictionRepository.CreatePrediction(mappedPrediction) ?? throw new Exception("Error creating prediction");
        var result = await _unitOfWork.Complete();
        if (!result)
            throw new Exception("Error creating prediction");

        result = await _unitOfWork.CategoryRepository.CreatePredictionCategoriesByIdsAsync(createdPredictionResult.Id, predictionDTO.Categories);

        if (!result)
            throw new Exception("Error creating prediction categories");
        
        user.Predictions.Add(createdPredictionResult);
        await _unitOfWork.Complete();


        var predictionDTOResult = _mapper.Map<PredictionDTO>(createdPredictionResult);
        var predictionCategories = await _unitOfWork.CategoryRepository.GetPredictionCategoriesByIdsAsync(createdPredictionResult.Id);
        predictionDTOResult.Categories = predictionCategories.Select(c => c.Id).ToList();
        return predictionDTOResult;
    }

    public async Task<ActionResult<PredictionDTO>> GetPrediction(int predictionId, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false)
    {
        var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(predictionId, false, includePostRanks, includePostBingos, includePostBrackets);
        if (prediction == null)
            throw new Exception("Prediction not found");
        var predictionDTO = _mapper.Map<PredictionDTO>(prediction);
        return predictionDTO;
    }

    public async Task<ActionResult<List<PredictionDTO>>> GetPredictionsByUserId(int userId, bool includePostRanks = false, bool includePostBingos = false, bool includePostBrackets = false)
    {
        var predictions = await _unitOfWork.PredictionRepository.GetPredictionsByUserIdAsync(userId, false, includePostRanks, includePostBingos, includePostBrackets);
        var predictionDTOs = _mapper.Map<List<PredictionDTO>>(predictions);
        return predictionDTOs;
    }

    public async Task<ActionResult> UpdatePrediction(PredictionDTO predictionDTO, int userId)
    {
        var mappedPrediction = _mapper.Map<Prediction>(predictionDTO);
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
        if (user == null)
            throw new Exception("User not found");
        mappedPrediction.User = user;
        mappedPrediction.UserId = userId;
        var updatedPredictionResult = await _unitOfWork.PredictionRepository.UpdatePredictionAsync(mappedPrediction) ?? throw new Exception("Error updating prediction");
        await _unitOfWork.Complete();

        var updatedPredictionDTO = _mapper.Map<PredictionDTO>(updatedPredictionResult);
        var predictionCategories = await _unitOfWork.CategoryRepository.GetPredictionCategoriesByIdsAsync(updatedPredictionResult.Id);
        updatedPredictionDTO.Categories = predictionCategories.Select(c => c.Id).ToList();

        return new OkObjectResult(updatedPredictionDTO);
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
