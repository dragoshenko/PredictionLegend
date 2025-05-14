namespace API.Extensions;
using API.Data;
using API.Helpers;
using API.Interfaces;
using API.Services;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddControllers();
        services.AddDbContext<DataContext>(opt => 
        {
            opt.UseSqlServer(config.GetConnectionString("DefaultConnection"));
        });
        services.AddCors(options =>
        {
            options.AddPolicy("CorsPolicy", policy =>
            {
                policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
            });
        });
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        services.AddScoped<IEmailService, GmailService>();
        services.Configure<CloudinarySettings>(config.GetSection(CloudinarySettings.CloudinarySettingsKey));
        services.Configure<GoogleSettings>(config.GetSection(GoogleSettings.GoogleSettingsKey));
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRespository>();
        services.AddScoped<IPredictionRepository, PredictionRepository>();
        services.AddScoped<IMapper, Mapper>();
        services.AddScoped<IAuthService, AuthService>();
        
        return services;
    }
}