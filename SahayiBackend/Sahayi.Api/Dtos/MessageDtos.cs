using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    public class SendGroupMessageDto
    {
        [Required]
        public int GroupId { get; set; }

        [Required]
        public Guid SenderId { get; set; }

        [Required]
        public string MessageText { get; set; } = string.Empty;
    }

    public class SendDirectMessageDto
    {
        [Required]
        public Guid SenderId { get; set; }

        [Required]
        public Guid ReceiverId { get; set; }

        [Required]
        public string MessageText { get; set; } = string.Empty;
    }
}