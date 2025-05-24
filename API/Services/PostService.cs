using System;
using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class PostService : IPostService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PostService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    #region PostRank
    public async Task<ActionResult<PostRankDTO>> CreatePostRankAsync(PostRankDTO postRank, int userId)
    {
        var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(postRank.RankingTemplateId) ?? throw new Exception("Ranking template not found");
        var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId) ?? throw new Exception("User not found");

        var mappedPostRank = _mapper.Map<PostRank>(postRank);
        var rankTable = new RankTable(rankingTemplate.NumberOfRows, rankingTemplate.NumberOfColumns);

        List<Row> rows = new List<Row>();
        for (int i = 0; i < rankTable.NumberOfRows; i++)
        {
            List<Column> columns = [];
            for (int j = 0; j < rankTable.NumberOfColumns; j++)
            {
                columns.Add(new Column());
                columns[j] = _mapper.Map<Column>(postRank.RankTable.Rows[i].Columns[j]);
            }
            rows.Add(new Row(columns));
        }
        rankTable.Rows = rows;

        mappedPostRank.User = user;
        mappedPostRank.UserId = userId;

        var prediction = await _unitOfWork.PredictionRepository.GetPredictionByIdAsync(postRank.PredictionId) ?? throw new Exception("Prediction not found");
        mappedPostRank.Prediction = prediction;
        mappedPostRank.RankTable = rankTable;
        rankingTemplate.PostRanks.Add(mappedPostRank);
        await _unitOfWork.PostRepository.CreatePostRank(mappedPostRank);
        user.PostRanks.Add(mappedPostRank);
        await _unitOfWork.Complete();

        return _mapper.Map<PostRankDTO>(mappedPostRank);
    }

    public async Task<ActionResult> UpdatePostRankAsync(PostRankDTO postRank)
    {
        var mappedPostRank = _mapper.Map<PostRank>(postRank);
        var rankingTemplate = await _unitOfWork.TemplateRepository.GetRankingTemplate(postRank.RankingTemplateId);
        if (rankingTemplate == null)
            throw new Exception("Ranking template not found");
        var rankTable = new RankTable(rankingTemplate.NumberOfRows, rankingTemplate.NumberOfColumns);
        mappedPostRank.RankTable = rankTable;
        await _unitOfWork.PostRepository.UpdatePostRank(mappedPostRank);
        await _unitOfWork.Complete();

        return new OkObjectResult("Post rank updated successfully");
    }

    public async Task<ActionResult> DeletePostRankAsync(int postRankId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult<PostRankDTO>> GetPostRankAsync(int id)
    {
        var postRank = await _unitOfWork.PostRepository.GetPostRank(id);
        if (postRank == null)
            throw new Exception("Post rank not found");
        return _mapper.Map<PostRankDTO>(postRank);
    }

    public async Task<List<PostRankDTO>> GetPostRanksAsync()
    {
        var postRanks = await _unitOfWork.PostRepository.GetPostRanks();
        return _mapper.Map<List<PostRankDTO>>(postRanks);
    }

    public async Task<List<PostRankDTO>> GetPostRanksByUserIdAsync(int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostRankDTO>> GetPostRanksByTemplateIdAsync(int templateId)
    {
        throw new Exception("Not implemented");
    }
    #endregion

    #region PostBracket
    public async Task<ActionResult<PostBracketDTO>> CreatePostBracketAsync(PostBracketDTO userPostBracket, int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<bool> UpdatePostBracketAsync(PostBracketDTO userPostBracket)
    {
        throw new Exception("Not implemented");
    }

    public async Task<bool> DeletePostBracketAsync(int postBracketId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult<PostBracketDTO?>> GetPostBracketAsync(int postBracketId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsAsync()
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsByUserIdAsync(int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBracketDTO>> GetPostBracketsByTemplateIdAsync(int templateId)
    {
        throw new Exception("Not implemented");
    }
    #endregion

    #region PostBingo
    public async Task<ActionResult<PostBingoDTO>> CreatePostBingoAsync(PostBingoDTO postBingoDTO, int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult> UpdatePostBingoAsync(PostBingoDTO userPostBingo)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult> DeletePostBingoAsync(int postBingoId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<ActionResult<PostBingoDTO?>> GetPostBingoAsync(int postBingoId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosAsync()
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosByUserIdAsync(int userId)
    {
        throw new Exception("Not implemented");
    }

    public async Task<List<PostBingoDTO>> GetPostBingosByTemplateIdAsync(int templateId)
    {
        throw new Exception("Not implemented");
    }
    #endregion
}
