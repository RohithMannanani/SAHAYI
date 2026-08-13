using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class SavingsTransaction
    {
        [Key]
        public int TransactionId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int UnitId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string ReceiptNumber { get; set; } = string.Empty;

        [Column(TypeName = "varchar(50)")]
        public string PaymentMode { get; set; } = "Cash";

        [Required]
        public int RecordedBy { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("UnitId")]
        public virtual AyalkoottamUnit? AyalkoottamUnit { get; set; }

        [ForeignKey("RecordedBy")]
        public virtual ApplicationUser? Recorder { get; set; }
    }
}