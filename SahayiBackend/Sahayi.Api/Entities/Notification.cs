using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class Notification
    {
        [Key]
        public int NotificationId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [Column(TypeName = "varchar(100)")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(500)")]
        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Property
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }
}