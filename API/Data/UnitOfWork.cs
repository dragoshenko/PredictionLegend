using API.Data;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly DataContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ITemplateRepository _templateRepository;
    private readonly IPostRepository _postRepository;
    private readonly ITeamRepository _teamRepository;

    public UnitOfWork(
        DataContext context,
        IUserRepository userRepository,
        IPredictionRepository predictionRepository,
        ICategoryRepository categoryRepository,
        ITemplateRepository templateRepository,
        IPostRepository postRepository,
        ITeamRepository teamRepository)
    {
        _context = context;
        _userRepository = userRepository;
        _predictionRepository = predictionRepository;
        _categoryRepository = categoryRepository;
        _templateRepository = templateRepository;
        _postRepository = postRepository;
        _teamRepository = teamRepository;
    }

    public IUserRepository UserRepository => _userRepository;
    public IPredictionRepository PredictionRepository => _predictionRepository;
    public ICategoryRepository CategoryRepository => _categoryRepository;
    public ITemplateRepository TemplateRepository => _templateRepository;
    public IPostRepository PostRepository => _postRepository;
    public ITeamRepository TeamRepository => _teamRepository;
    
    public async Task<bool> Complete()
    {
        try
        {
            return await _context.SaveChangesAsync() > 0;
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // Handle concurrency exceptions
            var entry = ex.Entries[0];
            var databaseValues = await entry.GetDatabaseValuesAsync();
            if (databaseValues == null)
            {
                throw new DbUpdateConcurrencyException("The entity was deleted by another user.", ex);
            }
            else
            {
                entry.OriginalValues.SetValues(databaseValues);
                return await _context.SaveChangesAsync() > 0;
            }
        }
        catch (DbUpdateException ex)
        {
            throw new DbUpdateException("An error occurred while updating the database.", ex);
        }
        catch (Exception ex)
        {
            throw new Exception("An error occurred while saving changes to the database.", ex);
        }
    }
}