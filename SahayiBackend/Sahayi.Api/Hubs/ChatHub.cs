using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Sahayi.Api.Services.Interfaces;
using System.Security.Claims;

namespace Sahayi.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;

        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        public override async Task OnConnectedAsync()
        {
            var unitIdClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == "UnitId")?.Value;
            if (int.TryParse(unitIdClaim, out int unitId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Unit_{unitId}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var unitIdClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == "UnitId")?.Value;
            if (int.TryParse(unitIdClaim, out int unitId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Unit_{unitId}");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(string messageText)
        {
            var unitIdClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == "UnitId")?.Value;
            var userIdClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(unitIdClaim, out int unitId) && int.TryParse(userIdClaim, out int userId))
            {
                var message = await _chatService.SaveGroupMessageAsync(unitId, userId, messageText);
                
                var payload = new
                {
                    message.GroupMessageId,
                    message.GroupId,
                    message.SenderId,
                    message.MessageText,
                    message.SentAt,
                    SenderName = message.Sender?.FullName ?? message.Sender?.Username ?? "Unknown",
                    SenderRole = message.Sender?.UserRole?.RoleName ?? "Member",
                    SenderAvatar = message.Sender?.AvatarUrl
                };

                await Clients.Group($"Unit_{unitId}").SendAsync("ReceiveMessage", payload);
            }
        }

        public async Task SendDirectMessage(int receiverId, string messageText)
        {
            var userIdClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out int senderId))
            {
                var message = await _chatService.SaveDirectMessageAsync(senderId, receiverId, messageText);
                
                var payload = new
                {
                    message.DirectMessageId,
                    message.SenderId,
                    message.ReceiverId,
                    message.MessageText,
                    message.SentAt,
                    message.IsRead,
                    SenderName = message.Sender?.FullName ?? message.Sender?.Username ?? "Unknown",
                    SenderRole = message.Sender?.UserRole?.RoleName ?? "Member",
                    SenderAvatar = message.Sender?.AvatarUrl
                };

                // Send to receiver
                await Clients.User(receiverId.ToString()).SendAsync("ReceiveDirectMessage", payload);
                
                // Also send back to sender so their UI updates
                if (senderId != receiverId)
                {
                    await Clients.Caller.SendAsync("ReceiveDirectMessage", payload);
                }
            }
        }
    }
}
