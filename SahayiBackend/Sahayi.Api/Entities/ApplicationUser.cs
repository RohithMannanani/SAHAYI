using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("ApplicationUsers")]
    public class ApplicationUser
    {
        [Key]
        public Guid UserId { get; set; } = Guid.NewGuid();

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(150)")]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(15)")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(150)")]
        public string HouseName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(max)")]
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsPasswordChanged { get; set; } = false; // Forces initial password update [cite: 6, 56]

        [Required]
        public int RoleId { get; set; }

        [ForeignKey("RoleId")]
        public UserRole? UserRole { get; set; }

        public Guid? UnitId { get; set; } // Nullable for CDS Admin [cite: 58]

        [ForeignKey("UnitId")]
        public AyalkoottamUnit? AyalkoottamUnit { get; set; }

        public DateTime JoinedDate { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
    }
}