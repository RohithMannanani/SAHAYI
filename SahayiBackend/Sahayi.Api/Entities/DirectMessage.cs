using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class DirectMessage
    {
        [Key]
        public long DirectMessageId { get; set; }

        [Required]
        public Guid SenderId { get; set; }

        [Required]
        public Guid ReceiverId { get; set; }

        [Required]
        [Column(TypeName = "varchar(max)")]
        public string MessageText { get; set; } = string.Empty;

        [Required]
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        // Navigation Properties
        [ForeignKey("SenderId")]
        public virtual ApplicationUser? Sender { get; set; }

        [ForeignKey("ReceiverId")]
        public virtual ApplicationUser? Receiver { get; set; }
    }
}