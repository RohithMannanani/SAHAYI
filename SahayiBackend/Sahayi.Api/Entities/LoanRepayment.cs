using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class LoanRepayment
    {
        [Key]
        public int RepaymentId { get; set; }

        [Required]
        public int LoanId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrincipalComponent { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal InterestComponent { get; set; }

        [Required]
        public DateTime RepaymentDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string ReceiptNumber { get; set; } = string.Empty;

        [Required]
        public int RecordedBy { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string PaymentMode { get; set; } = "Cash";

        // Navigation Properties
        [ForeignKey("LoanId")]
        public virtual LoanApplication? LoanApplication { get; set; }

        [ForeignKey("RecordedBy")]
        public virtual ApplicationUser? Recorder { get; set; }
    }
}