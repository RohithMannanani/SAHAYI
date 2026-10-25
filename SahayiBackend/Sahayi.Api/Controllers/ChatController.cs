using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sahayi.Api.Services.Interfaces;

namespace Sahayi.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("unit/{unitId}")]
        public async Task<IActionResult> GetUnitMessageHistory(int unitId, [FromQuery] int count = 50)
        {
            var userUnitIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UnitId")?.Value;
            
            // Only CDS_Admin can view other units' chats, otherwise user must belong to the requested unit.
            var roleClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            if (roleClaim != "CDS_Admin" && userUnitIdClaim != unitId.ToString())
            {
                return Forbid();
            }

            var messages = await _chatService.GetUnitMessageHistoryAsync(unitId, count);
            return Ok(messages);
        }
        [HttpGet("direct/{receiverId}")]
        public async Task<IActionResult> GetDirectMessageHistory(int receiverId, [FromQuery] int count = 50)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (!int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized();
            }

            var messages = await _chatService.GetDirectMessageHistoryAsync(currentUserId, receiverId, count);
            return Ok(messages);
        }

        [HttpGet("members/{unitId}")]
        public async Task<IActionResult> GetUnitMembersForChat(int unitId)
        {
            var userUnitIdClaim = User.Claims.FirstOrDefault(c => c.Type == "UnitId")?.Value;
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

            if (!int.TryParse(userIdClaim, out int currentUserId))
            {
                return Unauthorized();
            }

            if (roleClaim != "CDS_Admin" && userUnitIdClaim != unitId.ToString())
            {
                return Forbid();
            }

            var members = await _chatService.GetUnitMembersForChatAsync(unitId, currentUserId);
            return Ok(members);
        }
    }
}
