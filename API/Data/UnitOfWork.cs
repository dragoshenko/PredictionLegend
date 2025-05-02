using API.Data;
using API.Interfaces;
namespace API.Data;

public class UnitOfWork(DataContext context,IUserRepository userRepository) : IUnitOfWork
{
    public IUserRepository UserRepository => userRepository;
    public async Task<bool> Complete()
    {
        return await context.SaveChangesAsync() > 0;
    }
}
