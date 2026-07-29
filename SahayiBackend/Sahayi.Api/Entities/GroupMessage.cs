using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class GroupMessage
    {
        [Key]
        public long GroupMessageId { get; set; }

        [Required]
        public int GroupId { get; set; }

        [Required]
        public Guid SenderId { get; set; }

        [Required]
        [Column(TypeName = "varchar(max)")]
        public string MessageText { get; set; } = string.Empty;

        [Required]
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsDeleted { get; set; } = false;

        // Navigation Properties
        [ForeignKey("GroupId")]
        public virtual ChatGroup? ChatGroup { get; set; }

        [ForeignKey("SenderId")]
        public virtual ApplicationUser? Sender { get; set; }
    }
}