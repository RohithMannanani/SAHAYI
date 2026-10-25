using Sahayi.Api.Entities;

namespace Sahayi.Api.Services.Interfaces
{
    public interface IChatService
    {
        Task<ChatGroup> GetOrCreateUnitChatGroupAsync(int unitId);
        Task<GroupMessage> SaveGroupMessageAsync(int unitId, int senderId, string messageText);
        Task<IEnumerable<object>> GetUnitMessageHistoryAsync(int unitId, int count = 50);
        
        Task<DirectMessage> SaveDirectMessageAsync(int senderId, int receiverId, string messageText);
        Task<IEnumerable<object>> GetDirectMessageHistoryAsync(int userId1, int userId2, int count = 50);
        Task<IEnumerable<object>> GetUnitMembersForChatAsync(int unitId, int currentUserId);
    }
}
