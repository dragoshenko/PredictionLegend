using System;
using API.Interfaces;

namespace API.Interfaces;

public interface IUnitOfWork
{
    IUserRepository UserRepository { get; }
    IPredictionRepository PredictionRepository { get; }
    ICategoryRepository CategoryRepository { get; }
    ITemplateRepository TemplateRepository { get; }
    IPostRepository PostRepository { get; }
    ITeamRepository TeamRepository { get; }
    ICreationFlowRepository CreationFlowRepository { get; }
    Task<bool> Complete();
}