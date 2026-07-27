using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("SavingsTransactions")]
    public class SavingsTransaction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TransactionId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public ApplicationUser? User { get; set; }

        [Required]
        public Guid UnitId { get; set; }

        [ForeignKey("UnitId")]
        public AyalkoottamUnit? Unit { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [Required]
        [StringLength(50)]
        public string ReceiptNumber { get; set; } = string.Empty;

        [Required]
        public Guid RecordedBy { get; set; } // Treasurer / Secretary [cite: 77, 93]

        [ForeignKey("RecordedBy")]
        public ApplicationUser? Recorder { get; set; }
    }
}