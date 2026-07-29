using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class ChatGroup
    {
        [Key]
        public int GroupId { get; set; }

        [Required]
        public Guid UnitId { get; set; }

        [Required]
        [Column(TypeName = "varchar(100)")]
        public string GroupName { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("UnitId")]
        public virtual AyalkoottamUnit? AyalkoottamUnit { get; set; }

        public virtual ICollection<GroupMessage> GroupMessages { get; set; } = new List<GroupMessage>();
    }
}