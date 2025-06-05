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
    private readonly ICreationFlowRepository _creationFlowRepository;

    public UnitOfWork(
        DataContext context,
        IUserRepository userRepository,
        IPredictionRepository predictionRepository,
        ICategoryRepository categoryRepository,
        ITemplateRepository templateRepository,
        IPostRepository postRepository,
        ITeamRepository teamRepository,
        ICreationFlowRepository creationFlowRepository)
    {
        _context = context;
        _userRepository = userRepository;
        _predictionRepository = predictionRepository;
        _categoryRepository = categoryRepository;
        _templateRepository = templateRepository;
        _postRepository = postRepository;
        _teamRepository = teamRepository;
        _creationFlowRepository = creationFlowRepository;
    }

    public IUserRepository UserRepository => _userRepository;
    public IPredictionRepository PredictionRepository => _predictionRepository;
    public ICategoryRepository CategoryRepository => _categoryRepository;
    public ITemplateRepository TemplateRepository => _templateRepository;
    public IPostRepository PostRepository => _postRepository;
    public ITeamRepository TeamRepository => _teamRepository;
    public ICreationFlowRepository CreationFlowRepository => _creationFlowRepository;
    
    public async Task<bool> Complete()
    {
        try
        {
            var result = await _context.SaveChangesAsync();
            Console.WriteLine($"UnitOfWork.Complete() - Changes saved: {result}");
            return result > 0;
        }
        catch (DbUpdateConcurrencyException ex)
        {
            Console.WriteLine($"Concurrency exception in UnitOfWork.Complete(): {ex.Message}");
            
            // Handle concurrency exceptions
            foreach (var entry in ex.Entries)
            {
                var databaseValues = await entry.GetDatabaseValuesAsync();
                if (databaseValues == null)
                {
                    // The entity was deleted by another user
                    Console.WriteLine("Entity was deleted by another user");
                    throw new DbUpdateConcurrencyException("The entity was deleted by another user.", ex);
                }
                else
                {
                    // The entity was modified by another user
                    Console.WriteLine("Entity was modified by another user, refreshing values");
                    entry.OriginalValues.SetValues(databaseValues);
                }
            }
            
            // Try to save again after resolving conflicts
            try
            {
                var retryResult = await _context.SaveChangesAsync();
                Console.WriteLine($"UnitOfWork.Complete() retry - Changes saved: {retryResult}");
                return retryResult > 0;
            }
            catch (Exception retryEx)
            {
                Console.WriteLine($"Retry failed in UnitOfWork.Complete(): {retryEx.Message}");
                throw new DbUpdateConcurrencyException("Failed to resolve concurrency conflict.", retryEx);
            }
        }
        catch (DbUpdateException ex)
        {
            Console.WriteLine($"Database update exception in UnitOfWork.Complete(): {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            
            // FIXED: Don't throw here, let the calling service handle the specific error
            // The repository methods now handle their own transactions
            throw new DbUpdateException("An error occurred while updating the database.", ex);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"General exception in UnitOfWork.Complete(): {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw new Exception("An error occurred while saving changes to the database.", ex);
        }
    }
}