using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("UserRoles")]
    public class UserRole
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RoleId { get; set; }
       
        [Required]
        [Column(TypeName = "varchar(50)")]
        public string RoleName { get; set; } = string.Empty;

        [Column(TypeName = "varchar(255)")]
        public string? Description { get; set; }
    }
}