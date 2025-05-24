using System;
using API.Entities;

namespace API.DTO;

public class PredictionCategoryDTO
{
    public int Id { get; set; }
    public CategoryDTO Category { get; set; } = null!;
    public PredictionDTO Prediction { get; set; } = null!;
}
