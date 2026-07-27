using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("Meetings")]
    public class Meeting
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MeetingId { get; set; }

        [Required]
        public Guid UnitId { get; set; }

        [ForeignKey("UnitId")]
        public AyalkoottamUnit? Unit { get; set; }

        [Required]
        public DateTime MeetingDate { get; set; }

        [Required]
        [StringLength(200)]
        public string Venue { get; set; } = string.Empty;

        public string? MinutesOfMeeting { get; set; }

        [Required]
        public Guid CreatedBy { get; set; } // Secretary UserId [cite: 65]

        [ForeignKey("CreatedBy")]
        public ApplicationUser? Creator { get; set; }

        // Navigation Properties
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }
}