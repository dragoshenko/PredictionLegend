using System;
using API.DTO;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class RankController : BaseAPIController
{
    private IPostService _postService;
    public RankController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateRank([FromBody] PostRankDTO postRankDTO)
    {
        //var result = await _postService.CreateRank(rankTableDTO);
        return Ok();
    }
}
