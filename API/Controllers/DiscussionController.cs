using API.DTO;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class DiscussionController : BaseAPIController
{
    private readonly IDiscussionService _discussionService;

    public DiscussionController(IDiscussionService discussionService)
    {
        _discussionService = discussionService;
    }

    [HttpPost("create")]
    public async Task<ActionResult<DiscussionPostDTO>> CreateDiscussionPost([FromBody] CreateDiscussionPostDTO createDiscussionPostDTO)
    {
        var userId = User.GetUserId();
        return await _discussionService.CreateDiscussionPostAsync(createDiscussionPostDTO, userId);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<DiscussionPostDTO>> GetDiscussionPost(int id)
    {
        return await _discussionService.GetDiscussionPostAsync(id);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<DiscussionPostDTO>>> GetDiscussionPosts([FromQuery] PaginationParams paginationParams)
    {
        return await _discussionService.GetDiscussionPostsAsync(paginationParams);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<DiscussionPostDTO>>> GetUserDiscussionPosts(int userId, [FromQuery] PaginationParams paginationParams)
    {
        return await _discussionService.GetUserDiscussionPostsAsync(userId, paginationParams);
    }

    [HttpGet("my-posts")]
    public async Task<ActionResult<List<DiscussionPostDTO>>> GetMyDiscussionPosts([FromQuery] PaginationParams paginationParams)
    {
        var userId = User.GetUserId();
        return await _discussionService.GetUserDiscussionPostsAsync(userId, paginationParams);
    }

    [HttpPut("update")]
    public async Task<ActionResult> UpdateDiscussionPost([FromBody] UpdateDiscussionPostDTO updateDiscussionPostDTO)
    {
        var userId = User.GetUserId();
        return await _discussionService.UpdateDiscussionPostAsync(updateDiscussionPostDTO, userId);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDiscussionPost(int id)
    {
        var userId = User.GetUserId();
        return await _discussionService.DeleteDiscussionPostAsync(id, userId);
    }

    [HttpPost("{id}/comment")]
    public async Task<ActionResult<CommentDTO>> AddComment(int id, [FromBody] AddCommentDTO addCommentDTO)
    {
        var userId = User.GetUserId();
        return await _discussionService.AddCommentAsync(id, addCommentDTO.Content, userId, addCommentDTO.ParentCommentId);
    }

    [HttpDelete("comment/{commentId}")]
    public async Task<ActionResult> DeleteComment(int commentId)
    {
        var userId = User.GetUserId();
        return await _discussionService.DeleteCommentAsync(commentId, userId);
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<List<DiscussionPostDTO>>> SearchDiscussionPosts([FromQuery] string searchTerm, [FromQuery] PaginationParams paginationParams)
    {
        return await _discussionService.SearchDiscussionPostsAsync(searchTerm, paginationParams);
    }

    [HttpGet("tag/{tag}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<DiscussionPostDTO>>> GetDiscussionPostsByTag(string tag, [FromQuery] PaginationParams paginationParams)
    {
        return await _discussionService.GetDiscussionPostsByTagAsync(tag, paginationParams);
    }
}

