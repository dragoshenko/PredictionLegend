using API.DTO;
using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class PredictionRepository : IPredictionRepository
{
    private readonly DataContext _context;

    public PredictionRepository(DataContext context)
    {
        _context = context;
    }

}