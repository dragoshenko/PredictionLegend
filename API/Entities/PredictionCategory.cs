using System;

namespace API.Entities;

public class PredictionCategory
{
    public int Id { get; set; }
    public int categoryId { get; set; }
    public Category Category { get; set; } = null!;
    public int PredictionId { get; set; }
    public Prediction Prediction { get; set; } = null!;
    
}
