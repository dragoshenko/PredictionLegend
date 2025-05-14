using System;
using API.Interfaces;

namespace API.Interfaces;

public interface IUnitOfWork
{
    IUserRepository UserRepository { get; }
    IPredictionRepository PredictionRepository { get; }
    Task<bool> Complete();
}