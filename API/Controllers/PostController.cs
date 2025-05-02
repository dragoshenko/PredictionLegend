using API.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class PostController(IUnitOfWork unitOfWork) : BaseAPIController
{

}