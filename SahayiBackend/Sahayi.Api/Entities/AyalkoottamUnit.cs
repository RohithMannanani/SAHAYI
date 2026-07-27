using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("AyalkoottamUnits")]
    public class AyalkoottamUnit
    {
        [Key]
        public Guid UnitId { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(150)]
        public string UnitName { get; set; } = string.Empty;

        [Required]
        public int WardId { get; set; }

        [ForeignKey("WardId")]
        public PanchayathWard? Ward { get; set; }

        [Required]
        [StringLength(50)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string BankName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string IFSCCode { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        // Navigation Properties
        public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
        public ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();
        public ICollection<ChatGroup> ChatGroups { get; set; } = new List<ChatGroup>();
    }
}