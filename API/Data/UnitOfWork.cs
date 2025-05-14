using API.Data;
using API.Interfaces;

namespace API.Data;

public class UnitOfWork(
    DataContext context, 
    IUserRepository userRepository,
    IPredictionRepository predictionRepository) : IUnitOfWork
{
    public IUserRepository UserRepository => userRepository;
    public IPredictionRepository PredictionRepository => predictionRepository;
    
    public async Task<bool> Complete()
    {
        return await context.SaveChangesAsync() > 0;
    }
}