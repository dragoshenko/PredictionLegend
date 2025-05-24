using API.DTOs;
using API.DTO;
using API.Entities;
using API.Extensions;
using AutoMapper;

namespace API.Helpers;

public class AutoMapperProfiles: Profile
{
    public AutoMapperProfiles()
    {
        // User mappings
        CreateMap<AppUser, UserDTO>();
        CreateMap<RegisterDTO, AppUser>();
        CreateMap<AppUser, MemberDTO>()
            .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src =>
                src.Photo != null ? src.Photo.Url : null));

        // Prediction mappings
        CreateMap<Prediction, PredictionDTO>();
        CreateMap<PredictionDTO, Prediction>();

        CreateMap<Bracket, BracketDTO>();
        CreateMap<BracketDTO, Bracket>();

        CreateMap<RootBracket, RootBracketDTO>();
        CreateMap<RootBracketDTO, RootBracket>();

        // Category mappings
        CreateMap<Category, CategoryDTO>()
            .ForMember(dest => dest.SubCategories, opt => opt.Ignore());

        CreateMap<RankingTemplate, RankingTemplateDTO>();
        CreateMap<RankingTemplateDTO, RankingTemplate>();

        CreateMap<Team, TeamDTO>();
        CreateMap<TeamDTO, Team>();

        CreateMap<Bracket, BracketDTO>();
        CreateMap<BracketDTO, Bracket>();

        CreateMap<PostBingo, PostBingoDTO>();
        CreateMap<PostBingoDTO, PostBingo>();

        CreateMap<Comment, CommentDTO>();
        CreateMap<CommentDTO, Comment>();

        CreateMap<PostRank, PostRankDTO>();
        CreateMap<PostRankDTO, PostRank>();

        CreateMap<PostBracket, PostBracketDTO>();
        CreateMap<PostBracketDTO, PostBracket>();

        CreateMap<RankTable, RankTableDTO>();
        CreateMap<RankTableDTO, RankTable>();

        CreateMap<Row, RowDTO>();
        CreateMap<RowDTO, Row>();

        CreateMap<Column, ColumnDTO>();
        CreateMap<ColumnDTO, Column>();

        CreateMap<PredictionDTO, Prediction>()
            .ForMember(dest => dest.Categories, opt => opt.Ignore());
        CreateMap<Prediction, PredictionDTO>()
            .ForMember(dest => dest.Categories, opt => opt.MapFrom(src =>
                src.Categories.Select(c => c.categoryId).ToList()));

        CreateMap<PredictionCategory, PredictionCategoryDTO>();
        CreateMap<PredictionCategoryDTO, PredictionCategory>();

        CreateMap<BracketTemplate, BracketTemplateDTO>();
        CreateMap<BracketTemplateDTO, BracketTemplate>();

        CreateMap<BracketToBracket, BracketToBracketDTO>();
        CreateMap<BracketToBracketDTO, BracketToBracket>();
        CreateMap<BingoTemplate, BingoTemplateDTO>();
        CreateMap<BingoTemplateDTO, BingoTemplate>();

        CreateMap<BingoCell, BingoCellDTO>();
        CreateMap<BingoCellDTO, BingoCell>();
    }
}