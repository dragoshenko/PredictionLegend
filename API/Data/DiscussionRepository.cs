using API.DTO;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public interface IDiscussionRepository
{
    Task<DiscussionPost> CreateDiscussionPostAsync(DiscussionPost discussionPost);
    Task<DiscussionPost?> GetDiscussionPostAsync(int id);
    Task<List<DiscussionPost>> GetDiscussionPostsAsync(PaginationParams paginationParams);
    Task<List<DiscussionPost>> GetUserDiscussionPostsAsync(int userId, PaginationParams paginationParams);
    Task<DiscussionPost?> UpdateDiscussionPostAsync(DiscussionPost discussionPost);
    Task<bool> DeleteDiscussionPostAsync(int id);
    Task<Comment> AddCommentAsync(Comment comment);
    Task<bool> DeleteCommentAsync(int commentId);
    Task<List<DiscussionPost>> SearchDiscussionPostsAsync(string searchTerm, PaginationParams paginationParams);
    Task<List<DiscussionPost>> GetDiscussionPostsByTagAsync(string tag, PaginationParams paginationParams);
}

public class DiscussionRepository : IDiscussionRepository
{
    private readonly DataContext _context;
    private readonly IMapper _mapper;

    public DiscussionRepository(DataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<DiscussionPost> CreateDiscussionPostAsync(DiscussionPost discussionPost)
    {
        await _context.DiscussionPosts.AddAsync(discussionPost);
        await _context.SaveChangesAsync();
        return discussionPost;
    }

    public async Task<DiscussionPost?> GetDiscussionPostAsync(int id)
    {
        return await _context.DiscussionPosts
            .Include(dp => dp.User)
            .Include(dp => dp.Comments)
                .ThenInclude(c => c.User)
            .Include(dp => dp.Comments)
                .ThenInclude(c => c.Replies)
                    .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(dp => dp.Id == id);
    }

    public async Task<List<DiscussionPost>> GetDiscussionPostsAsync(PaginationParams paginationParams)
    {
        return await _context.DiscussionPosts
            .Include(dp => dp.User)
            .Include(dp => dp.Comments)
            .Where(dp => !dp.IsDraft && dp.PrivacyType == PrivacyType.Public)
            .OrderByDescending(dp => dp.CreatedAt)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();
    }

    public async Task<List<DiscussionPost>> GetUserDiscussionPostsAsync(int userId, PaginationParams paginationParams)
    {
        return await _context.DiscussionPosts
            .Include(dp => dp.User)
            .Include(dp => dp.Comments)
            .Where(dp => dp.UserId == userId)
            .OrderByDescending(dp => dp.CreatedAt)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();
    }

    public async Task<DiscussionPost?> UpdateDiscussionPostAsync(DiscussionPost discussionPost)
    {
        _context.Entry(discussionPost).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return discussionPost;
    }

    public async Task<bool> DeleteDiscussionPostAsync(int id)
    {
        var discussionPost = await _context.DiscussionPosts.FindAsync(id);
        if (discussionPost == null) return false;

        _context.DiscussionPosts.Remove(discussionPost);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<Comment> AddCommentAsync(Comment comment)
    {
        await _context.Comments.AddAsync(comment);
        await _context.SaveChangesAsync();
        return comment;
    }

    public async Task<bool> DeleteCommentAsync(int commentId)
    {
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null) return false;

        _context.Comments.Remove(comment);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<DiscussionPost>> SearchDiscussionPostsAsync(string searchTerm, PaginationParams paginationParams)
    {
        return await _context.DiscussionPosts
            .Include(dp => dp.User)
            .Include(dp => dp.Comments)
            .Where(dp => !dp.IsDraft && 
                         dp.PrivacyType == PrivacyType.Public &&
                         (dp.Title.Contains(searchTerm) || 
                          (dp.Description != null && dp.Description.Contains(searchTerm))))
            .OrderByDescending(dp => dp.CreatedAt)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();
    }

    public async Task<List<DiscussionPost>> GetDiscussionPostsByTagAsync(string tag, PaginationParams paginationParams)
    {
        return await _context.DiscussionPosts
            .Include(dp => dp.User)
            .Include(dp => dp.Comments)
            .Where(dp => !dp.IsDraft && 
                         dp.PrivacyType == PrivacyType.Public &&
                         dp.Tags.Contains(tag))
            .OrderByDescending(dp => dp.CreatedAt)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();
    }
}
