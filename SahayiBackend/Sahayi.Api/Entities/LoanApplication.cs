using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    [Table("LoanApplications")]
    public class LoanApplication
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LoanId { get; set; }

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
        public decimal AmountRequested { get; set; }

        [Required]
        [StringLength(500)]
        public string Purpose { get; set; } = string.Empty;

        [Required]
        public int TenureMonths { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal InterestRate { get; set; } // e.g., Reducing interest rate percentage [cite: 83, 91]

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Disbursed, Closed [cite: 84]

        public DateTime AppliedDate { get; set; } = DateTime.UtcNow;

        public Guid? ApprovedBy { get; set; } // Secretary / President [cite: 86]

        [ForeignKey("ApprovedBy")]
        public ApplicationUser? Approver { get; set; }

        public DateTime? DisbursedDate { get; set; }

        // Navigation Properties
        public ICollection<LoanRepayment> Repayments { get; set; } = new List<LoanRepayment>();
    }
}