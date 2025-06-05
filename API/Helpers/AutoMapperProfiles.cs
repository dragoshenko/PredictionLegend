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

        CreateMap<Comment, CommentDTO>()
            .ForMember(dest => dest.Author, opt => opt.MapFrom(src => src.User))
            .ForMember(dest => dest.ChildComments, opt => opt.MapFrom(src => src.Replies))
            .ForMember(dest => dest.CommentsCount, opt => opt.MapFrom(src => src.Replies.Count));
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

        // Discussion Post mappings
        CreateMap<DiscussionPost, DiscussionPostDTO>()
            .ForMember(dest => dest.Author, opt => opt.MapFrom(src => src.User))
            .ForMember(dest => dest.CommentsCount, opt => opt.MapFrom(src => src.Comments.Count))
            .ForMember(dest => dest.UpVotes, opt => opt.MapFrom(src => 0)) // You can implement voting later
            .ForMember(dest => dest.DownVotes, opt => opt.MapFrom(src => 0));
        CreateMap<DiscussionPostDTO, DiscussionPost>();
        CreateMap<CreateDiscussionPostDTO, DiscussionPost>();
        CreateMap<UpdateDiscussionPostDTO, DiscussionPost>();

        // Creation Flow mappings
        CreateMap<CreatePredictionFlowDTO, CreationFlow>()
        .ForMember(dest => dest.SelectedTeamIds,
                opt => opt.MapFrom<SelectedTeamIdsToJsonResolver>());

        CreateMap<CreationFlow, CreatePredictionFlowDTO>()
            .ForMember(dest => dest.SelectedTeamIds,
                    opt => opt.MapFrom<SelectedTeamIdsFromJsonResolver>());
        
        CreateMap<Team, TeamDTO>()
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description ?? string.Empty))
            .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => src.PhotoUrl ?? string.Empty));

        CreateMap<TeamDTO, Team>()
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => 
                string.IsNullOrWhiteSpace(src.Description) ? string.Empty : src.Description))
            .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => 
                string.IsNullOrWhiteSpace(src.PhotoUrl) ? null : src.PhotoUrl))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => 
                src.CreatedAt == default(DateTime) ? DateTime.UtcNow : src.CreatedAt))
            .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore()); // Don't map navigation property

    }
}