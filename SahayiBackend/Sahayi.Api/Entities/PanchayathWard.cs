using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("PanchayathWards")]
    public class PanchayathWard
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int WardId { get; set; }

        [Required]
        public int WardNumber { get; set; }

        [Required]
        [StringLength(100)]
        public string WardName { get; set; } = string.Empty;

        // Navigation Properties
        public ICollection<AyalkoottamUnit> Units { get; set; } = new List<AyalkoottamUnit>();
    }
}