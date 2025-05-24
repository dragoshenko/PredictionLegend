using API.DTO;
using API.Helpers;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace API.Extensions;

public static class PaginationExtensions
{
    public static void AddPaginationHeader<T>(this HttpResponse response, PaginatedResponse<T> paginatedResponse)
    {
        var paginationHeader = new PaginationHeader(
            paginatedResponse.PageNumber,
            paginatedResponse.PageSize,
            paginatedResponse.TotalItems,
            paginatedResponse.TotalPages
        );

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        response.Headers.Append("Pagination", JsonSerializer.Serialize(paginationHeader, options));
        response.Headers.Append("Access-Control-Expose-Headers", "Pagination");
    }

    public static PaginatedResponse<T> CreatePaginatedResponse<T>(
        this IEnumerable<T> source,
        PaginationParams paginationParams,
        int totalCount)
    {
        var totalPages = (int)Math.Ceiling((double)totalCount / paginationParams.PageSize);

        return new PaginatedResponse<T>
        {
            Items = source.ToList(),
            TotalItems = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize,
            TotalPages = totalPages,
            HasNext = paginationParams.PageNumber < totalPages,
            HasPrevious = paginationParams.PageNumber > 1
        };
    }
}