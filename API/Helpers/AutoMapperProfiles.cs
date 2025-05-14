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
        CreateMap<AppUser, UserDTO>();
        CreateMap<RegisterDTO, AppUser>();

        CreateMap<Prediction, PredictionDTO>()
            .ForMember(dest => dest.Author, opt => opt.MapFrom(src => src.AppUser));
        CreateMap<AppUser, MemberDTO>()
            .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => 
                src.Photo != null ? src.Photo.Url : null));
    }
}
