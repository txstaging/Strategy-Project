using Mod.Core.DTOs.DirectionItems;

namespace Mod.Core.Services.Contract.DirectionItemsService
{
    public interface IDirectionItemsService
    {
        Task<APIsGenralResponseDto<AddDirectionItemsDto>> Add(AddDirectionItemsDto element,int PlanID);
        Task<APIsGenralResponseDto<AddDirectionItemsDto>> Get(string type,int PlanID);
        Task<APIsGenralResponseDto<AddDirectionItemsDto>> Approve(string type,int PlanID);
        Task<APIsGenralResponseDto<AddDirectionItemsDto>> Reject(string type,int PlanID);
        Task<APIsGenralResponseDto<AddDirectionItemsDto>> Return(string type,int PlanID);
    }
}
