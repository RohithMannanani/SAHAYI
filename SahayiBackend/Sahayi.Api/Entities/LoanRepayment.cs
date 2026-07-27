using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("LoanRepayments")]
    public class LoanRepayment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RepaymentId { get; set; }

        [Required]
        public int LoanId { get; set; }

        [ForeignKey("LoanId")]
        public LoanApplication? Loan { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrincipalComponent { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal InterestComponent { get; set; } // Calculated reducing interest [cite: 87, 91]

        public DateTime RepaymentDate { get; set; } = DateTime.UtcNow;

        [Required]
        [StringLength(50)]
        public string ReceiptNumber { get; set; } = string.Empty;

        [Required]
        public Guid RecordedBy { get; set; } // Treasurer UserId [cite: 93]

        [ForeignKey("RecordedBy")]
        public ApplicationUser? Recorder { get; set; }
    }
}