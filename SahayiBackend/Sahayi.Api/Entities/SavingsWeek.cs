using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class SavingsWeek
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UnitId { get; set; }

        [Required]
        public int WeekNumber { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } = 100.00m;

        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Status { get; set; } = "Open";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("UnitId")]
        public virtual AyalkoottamUnit? AyalkoottamUnit { get; set; }

        public virtual ICollection<SavingsTransaction> SavingsTransactions { get; set; } = new List<SavingsTransaction>();
    }
}
