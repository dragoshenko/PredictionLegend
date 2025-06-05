using API.DTO;
using API.Entities;
using AutoMapper;

public class SelectedTeamIdsToJsonResolver : IValueResolver<CreatePredictionFlowDTO, CreationFlow, string>
{
    public string Resolve(CreatePredictionFlowDTO source, CreationFlow destination, string destMember, ResolutionContext context)
    {
        return System.Text.Json.JsonSerializer.Serialize(source.SelectedTeamIds);
    }
}
public class SelectedTeamIdsFromJsonResolver : IValueResolver<CreationFlow, CreatePredictionFlowDTO, List<int>>
{
    public List<int> Resolve(CreationFlow source, CreatePredictionFlowDTO destination, List<int> destMember, ResolutionContext context)
    {
        if (string.IsNullOrEmpty(source.SelectedTeamIds))
            return new List<int>();

        return System.Text.Json.JsonSerializer.Deserialize<List<int>>(source.SelectedTeamIds, (System.Text.Json.JsonSerializerOptions?)null)
               ?? new List<int>();
    }
}
