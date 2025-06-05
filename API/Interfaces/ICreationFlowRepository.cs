using API.Entities;

namespace API.Interfaces;

public interface ICreationFlowRepository
{
    Task<CreationFlow> CreateFlowAsync(CreationFlow creationFlow);
    Task<CreationFlow?> GetFlowByTokenAsync(string flowToken);
    Task<CreationFlow?> GetFlowByIdAsync(int id);
    Task<List<CreationFlow>> GetUserActiveFlowsAsync(int userId);
    Task<bool> UpdateFlowAsync(CreationFlow creationFlow);
    Task<bool> DeleteFlowAsync(int id);
    Task<bool> AbandonFlowAsync(string flowToken, string reason);
    Task<bool> CompleteFlowAsync(string flowToken);
    Task<bool> CleanupExpiredFlowsAsync();
}

