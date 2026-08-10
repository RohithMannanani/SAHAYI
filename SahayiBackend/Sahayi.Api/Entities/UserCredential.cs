using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class UserCredential
    {
        [Key]
        public int LoginId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string UserName { get; set; } = string.Empty; 

        [Required]
        [Column(TypeName = "varchar(max)")]
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsPasswordChanged { get; set; } = false;

        public DateTime? LastLoginAt { get; set; }

        public bool IsLocked { get; set; } = false;

        // Navigation Property
        [ForeignKey("UserId")]
        public virtual ApplicationUser? ApplicationUser { get; set; }
    }
}