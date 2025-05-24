using API.DTO;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class PostController : BaseAPIController
{
    private IPostService _postService;
    public PostController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpPost("rank/create")]
    public async Task<ActionResult<PostRankDTO>> CreateRank([FromBody] PostRankDTO postRankDTO)
    {
        var userId = User.GetUserId();
        var result = await _postService.CreatePostRankAsync(postRankDTO, userId);
        return result;
    }
}