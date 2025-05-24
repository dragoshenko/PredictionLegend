using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class CreationFlowRepository : ICreationFlowRepository
{
    private readonly DataContext _context;

    public CreationFlowRepository(DataContext context)
    {
        _context = context;
    }

    public async Task<CreationFlow> CreateFlowAsync(CreationFlow creationFlow)
    {
        await _context.CreationFlows.AddAsync(creationFlow);
        await _context.SaveChangesAsync();
        return creationFlow;
    }

    public async Task<CreationFlow?> GetFlowByTokenAsync(string flowToken)
    {
        return await _context.CreationFlows
            .Include(cf => cf.User)
            .Include(cf => cf.Prediction)
            .FirstOrDefaultAsync(cf => cf.FlowToken == flowToken && !cf.IsAbandoned && cf.ExpiresAt > DateTime.UtcNow);
    }

    public async Task<CreationFlow?> GetFlowByIdAsync(int id)
    {
        return await _context.CreationFlows
            .Include(cf => cf.User)
            .Include(cf => cf.Prediction)
            .FirstOrDefaultAsync(cf => cf.Id == id);
    }

    public async Task<List<CreationFlow>> GetUserActiveFlowsAsync(int userId)
    {
        return await _context.CreationFlows
            .Where(cf => cf.UserId == userId && !cf.IsCompleted && !cf.IsAbandoned && cf.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<bool> UpdateFlowAsync(CreationFlow creationFlow)
    {
        _context.Entry(creationFlow).State = EntityState.Modified;
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteFlowAsync(int id)
    {
        var flow = await _context.CreationFlows.FindAsync(id);
        if (flow == null) return false;

        _context.CreationFlows.Remove(flow);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> AbandonFlowAsync(string flowToken, string reason)
    {
        var flow = await GetFlowByTokenAsync(flowToken);
        if (flow == null) return false;

        flow.IsAbandoned = true;
        flow.AbandonReason = reason;
        flow.AbandonedAt = DateTime.UtcNow;

        return await UpdateFlowAsync(flow);
    }

    public async Task<bool> CompleteFlowAsync(string flowToken)
    {
        var flow = await GetFlowByTokenAsync(flowToken);
        if (flow == null) return false;

        flow.IsCompleted = true;
        flow.CompletedAt = DateTime.UtcNow;

        return await UpdateFlowAsync(flow);
    }

    public async Task<bool> CleanupExpiredFlowsAsync()
    {
        var expiredFlows = await _context.CreationFlows
            .Where(cf => cf.ExpiresAt < DateTime.UtcNow && !cf.IsCompleted)
            .ToListAsync();

        foreach (var flow in expiredFlows)
        {
            flow.IsAbandoned = true;
            flow.AbandonReason = "Expired";
            flow.AbandonedAt = DateTime.UtcNow;
        }

        return await _context.SaveChangesAsync() > 0;
    }
}