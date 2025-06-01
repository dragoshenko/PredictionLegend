using API.Data;
using API.DTO;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class DiscussionService : IDiscussionService
{
    private readonly IDiscussionRepository _discussionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DiscussionService(IDiscussionRepository discussionRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _discussionRepository = discussionRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ActionResult<DiscussionPostDTO>> CreateDiscussionPostAsync(CreateDiscussionPostDTO createDiscussionPostDTO, int userId)
    {
        try
        {
            var discussionPost = new DiscussionPost
            {
                Title = createDiscussionPostDTO.Title,
                Description = createDiscussionPostDTO.Description,
                PrivacyType = createDiscussionPostDTO.PrivacyType,
                Tags = createDiscussionPostDTO.Tags,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                LastModified = DateTime.UtcNow,
                IsDraft = false
            };

            if (createDiscussionPostDTO.PrivacyType == PrivacyType.Private)
            {
                discussionPost.AccessCode = GenerateUniqueAccessCode();
            }

            var createdPost = await _discussionRepository.CreateDiscussionPostAsync(discussionPost);
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            
            var result = _mapper.Map<DiscussionPostDTO>(createdPost);
            result.Author = _mapper.Map<MemberDTO>(user);

            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error creating discussion post: {ex.Message}");
        }
    }

    public async Task<ActionResult<DiscussionPostDTO>> GetDiscussionPostAsync(int id)
    {
        try
        {
            var discussionPost = await _discussionRepository.GetDiscussionPostAsync(id);
            if (discussionPost == null)
            {
                return new NotFoundObjectResult("Discussion post not found");
            }

            var result = _mapper.Map<DiscussionPostDTO>(discussionPost);
            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error getting discussion post: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<DiscussionPostDTO>>> GetDiscussionPostsAsync(PaginationParams paginationParams)
    {
        try
        {
            var discussionPosts = await _discussionRepository.GetDiscussionPostsAsync(paginationParams);
            var result = _mapper.Map<List<DiscussionPostDTO>>(discussionPosts);
            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error getting discussion posts: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<DiscussionPostDTO>>> GetUserDiscussionPostsAsync(int userId, PaginationParams paginationParams)
    {
        try
        {
            var discussionPosts = await _discussionRepository.GetUserDiscussionPostsAsync(userId, paginationParams);
            var result = _mapper.Map<List<DiscussionPostDTO>>(discussionPosts);
            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error getting user discussion posts: {ex.Message}");
        }
    }

    public async Task<ActionResult> UpdateDiscussionPostAsync(UpdateDiscussionPostDTO updateDiscussionPostDTO, int userId)
    {
        try
        {
            var discussionPost = await _discussionRepository.GetDiscussionPostAsync(updateDiscussionPostDTO.Id);
            if (discussionPost == null)
            {
                return new NotFoundObjectResult("Discussion post not found");
            }

            if (discussionPost.UserId != userId)
            {
                return new UnauthorizedObjectResult("You can only edit your own posts");
            }

            discussionPost.Title = updateDiscussionPostDTO.Title;
            discussionPost.Description = updateDiscussionPostDTO.Description;
            discussionPost.PrivacyType = updateDiscussionPostDTO.PrivacyType;
            discussionPost.Tags = updateDiscussionPostDTO.Tags;
            discussionPost.LastModified = DateTime.UtcNow;

            await _discussionRepository.UpdateDiscussionPostAsync(discussionPost);
            return new OkResult();
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error updating discussion post: {ex.Message}");
        }
    }

    public async Task<ActionResult> DeleteDiscussionPostAsync(int id, int userId)
    {
        try
        {
            var discussionPost = await _discussionRepository.GetDiscussionPostAsync(id);
            if (discussionPost == null)
            {
                return new NotFoundObjectResult("Discussion post not found");
            }

            if (discussionPost.UserId != userId)
            {
                return new UnauthorizedObjectResult("You can only delete your own posts");
            }

            await _discussionRepository.DeleteDiscussionPostAsync(id);
            return new OkResult();
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error deleting discussion post: {ex.Message}");
        }
    }

    public async Task<ActionResult<CommentDTO>> AddCommentAsync(int discussionPostId, string content, int userId, int? parentCommentId = null)
    {
        try
        {
            var discussionPost = await _discussionRepository.GetDiscussionPostAsync(discussionPostId);
            if (discussionPost == null)
            {
                return new NotFoundObjectResult("Discussion post not found");
            }

            var comment = new Comment
            {
                Content = content,
                UserId = userId,
                DiscussionPostId = discussionPostId,
                ParentCommentId = parentCommentId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdComment = await _discussionRepository.AddCommentAsync(comment);
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            
            var result = _mapper.Map<CommentDTO>(createdComment);
            result.Author = _mapper.Map<MemberDTO>(user);

            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error adding comment: {ex.Message}");
        }
    }

    public async Task<ActionResult> DeleteCommentAsync(int commentId, int userId)
    {
        try
        {
            var comment = await _unitOfWork.UserRepository.GetUserByIdAsync(userId); // This should be comment repository
            // Note: You'll need to add a method to get comment by ID
            
            await _discussionRepository.DeleteCommentAsync(commentId);
            return new OkResult();
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error deleting comment: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<DiscussionPostDTO>>> SearchDiscussionPostsAsync(string searchTerm, PaginationParams paginationParams)
    {
        try
        {
            var discussionPosts = await _discussionRepository.SearchDiscussionPostsAsync(searchTerm, paginationParams);
            var result = _mapper.Map<List<DiscussionPostDTO>>(discussionPosts);
            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error searching discussion posts: {ex.Message}");
        }
    }

    public async Task<ActionResult<List<DiscussionPostDTO>>> GetDiscussionPostsByTagAsync(string tag, PaginationParams paginationParams)
    {
        try
        {
            var discussionPosts = await _discussionRepository.GetDiscussionPostsByTagAsync(tag, paginationParams);
            var result = _mapper.Map<List<DiscussionPostDTO>>(discussionPosts);
            return new OkObjectResult(result);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult($"Error getting discussion posts by tag: {ex.Message}");
        }
    }

    private string GenerateUniqueAccessCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new();
        char[] code = new char[8];
        for (int i = 0; i < code.Length; i++)
        {
            code[i] = chars[random.Next(chars.Length)];
        }
        return new string(code);
    }
}