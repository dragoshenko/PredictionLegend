using API.DTO;
using API.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface IDiscussionService
{
    Task<ActionResult<DiscussionPostDTO>> CreateDiscussionPostAsync(CreateDiscussionPostDTO createDiscussionPostDTO, int userId);
    Task<ActionResult<DiscussionPostDTO>> GetDiscussionPostAsync(int id);
    Task<ActionResult<List<DiscussionPostDTO>>> GetDiscussionPostsAsync(PaginationParams paginationParams);
    Task<ActionResult<List<DiscussionPostDTO>>> GetUserDiscussionPostsAsync(int userId, PaginationParams paginationParams);
    Task<ActionResult> UpdateDiscussionPostAsync(UpdateDiscussionPostDTO updateDiscussionPostDTO, int userId);
    Task<ActionResult> DeleteDiscussionPostAsync(int id, int userId);
    Task<ActionResult<CommentDTO>> AddCommentAsync(int discussionPostId, string content, int userId, int? parentCommentId = null);
    Task<ActionResult> DeleteCommentAsync(int commentId, int userId);
    Task<ActionResult<List<DiscussionPostDTO>>> SearchDiscussionPostsAsync(string searchTerm, PaginationParams paginationParams);
    Task<ActionResult<List<DiscussionPostDTO>>> GetDiscussionPostsByTagAsync(string tag, PaginationParams paginationParams);
}