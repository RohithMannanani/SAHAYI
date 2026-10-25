using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.Entities;
using Sahayi.Api.Services.Interfaces;

namespace Sahayi.Api.Services.Implementations
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;

        public ChatService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ChatGroup> GetOrCreateUnitChatGroupAsync(int unitId)
        {
            var group = await _context.ChatGroups.FirstOrDefaultAsync(g => g.UnitId == unitId);
            if (group == null)
            {
                var unit = await _context.AyalkoottamUnits.FindAsync(unitId);
                group = new ChatGroup
                {
                    UnitId = unitId,
                    GroupName = unit != null ? $"{unit.UnitName} Group" : "Unit Group",
                    CreatedDate = DateTime.UtcNow
                };
                _context.ChatGroups.Add(group);
                await _context.SaveChangesAsync();
            }
            return group;
        }

        public async Task<GroupMessage> SaveGroupMessageAsync(int unitId, int senderId, string messageText)
        {
            var group = await GetOrCreateUnitChatGroupAsync(unitId);

            var message = new GroupMessage
            {
                GroupId = group.GroupId,
                SenderId = senderId,
                MessageText = messageText,
                SentAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.GroupMessages.Add(message);
            await _context.SaveChangesAsync();

            return await _context.GroupMessages
                .Include(m => m.Sender)
                .ThenInclude(s => s.UserRole)
                .FirstOrDefaultAsync(m => m.GroupMessageId == message.GroupMessageId);
        }

        public async Task<IEnumerable<object>> GetUnitMessageHistoryAsync(int unitId, int count = 50)
        {
            var group = await _context.ChatGroups.FirstOrDefaultAsync(g => g.UnitId == unitId);
            if (group == null)
            {
                return Enumerable.Empty<object>();
            }

            var messages = await _context.GroupMessages
                .Include(m => m.Sender)
                .ThenInclude(s => s.UserRole)
                .Where(m => m.GroupId == group.GroupId && !m.IsDeleted)
                .OrderByDescending(m => m.SentAt)
                .Take(count)
                .ToListAsync();

            return messages.Select(m => new
            {
                m.GroupMessageId,
                m.GroupId,
                m.SenderId,
                m.MessageText,
                m.SentAt,
                SenderName = m.Sender != null ? (m.Sender.FullName ?? m.Sender.Username) : "Unknown",
                SenderRole = m.Sender != null && m.Sender.UserRole != null ? m.Sender.UserRole.RoleName : "Member",
                SenderAvatar = m.Sender != null ? m.Sender.AvatarUrl : null
            }).Reverse().ToList();
        }
        public async Task<DirectMessage> SaveDirectMessageAsync(int senderId, int receiverId, string messageText)
        {
            var message = new DirectMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                MessageText = messageText,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.DirectMessages.Add(message);
            await _context.SaveChangesAsync();

            return await _context.DirectMessages
                .Include(m => m.Sender)
                .ThenInclude(s => s.UserRole)
                .FirstOrDefaultAsync(m => m.DirectMessageId == message.DirectMessageId);
        }

        public async Task<IEnumerable<object>> GetDirectMessageHistoryAsync(int userId1, int userId2, int count = 50)
        {
            var messages = await _context.DirectMessages
                .Include(m => m.Sender)
                .ThenInclude(s => s.UserRole)
                .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                            (m.SenderId == userId2 && m.ReceiverId == userId1))
                .OrderByDescending(m => m.SentAt)
                .Take(count)
                .ToListAsync();

            return messages.Select(m => new
            {
                m.DirectMessageId,
                m.SenderId,
                m.ReceiverId,
                m.MessageText,
                m.SentAt,
                m.IsRead,
                SenderName = m.Sender != null ? (m.Sender.FullName ?? m.Sender.Username) : "Unknown",
                SenderRole = m.Sender != null && m.Sender.UserRole != null ? m.Sender.UserRole.RoleName : "Member",
                SenderAvatar = m.Sender != null ? m.Sender.AvatarUrl : null
            }).Reverse().ToList();
        }

        public async Task<IEnumerable<object>> GetUnitMembersForChatAsync(int unitId, int currentUserId)
        {
            var users = await _context.ApplicationUsers
                .Include(u => u.UserRole)
                .Where(u => u.UnitId == unitId && u.IsActive && u.UserId != currentUserId)
                .OrderBy(u => u.FullName)
                .ToListAsync();

            return users.Select(u => new
            {
                u.UserId,
                Name = u.FullName,
                Role = u.UserRole?.RoleName ?? "Member",
                Avatar = u.AvatarUrl,
                IsOnline = false // Default to false, can be extended later
            }).ToList();
        }
    }
}
