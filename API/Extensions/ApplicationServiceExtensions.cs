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
        services.AddScoped<ITemplateRepository, TemplateRepository>();
        services.AddScoped<IPostRepository, PostRepository>();
        services.AddScoped<IPredictionRepository, PredictionRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ITeamRepository, TeamRepository>(); // Added missing registration
        services.AddScoped<IMapper, Mapper>();

        services.AddScoped<ITemplateService, TemplateService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<IPhotoService, PhotoService>();
        services.AddScoped<IPredictionService, PredictionService>();
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<ICreationFlowRepository, CreationFlowRepository>();
        services.AddScoped<ICreationFlowService, CreationFlowService>();
        services.AddScoped<IDiscussionRepository, DiscussionRepository>();
        services.AddScoped<IDiscussionService, DiscussionService>();
        services.AddScoped<ISearchService, SearchService>();
        
        return services;
    }
}