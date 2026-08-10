using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class Meeting
    {
        [Key]
        public int MeetingId { get; set; }

        [Required]
        public int UnitId { get; set; }

        [Required]
        public DateTime MeetingDate { get; set; }

        [Required]
        [Column(TypeName = "varchar(200)")]
        public string Venue { get; set; } = string.Empty;

        [Column(TypeName = "varchar(max)")]
        public string? MinutesOfMeeting { get; set; }

        [Required]
        public int CreatedBy { get; set; }

        // Navigation Properties
        [ForeignKey("UnitId")]
        public virtual AyalkoottamUnit? AyalkoottamUnit { get; set; }

        [ForeignKey("CreatedBy")]
        public virtual ApplicationUser? Creator { get; set; }

        public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }
}