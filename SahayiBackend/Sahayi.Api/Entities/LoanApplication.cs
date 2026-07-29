using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sahayi.Api.Entities
{
    public class LoanApplication
    {
        [Key]
        public int LoanId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid UnitId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountRequested { get; set; }

        [Required]
        [Column(TypeName = "varchar(500)")]
        public string Purpose { get; set; } = string.Empty;

        [Required]
        public int TenureMonths { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal InterestRate { get; set; }

        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Disbursed, Closed

        [Required]
        public DateTime AppliedDate { get; set; } = DateTime.UtcNow;

        public Guid? ApprovedBy { get; set; }

        public DateTime? DisbursedDate { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("UnitId")]
        public virtual AyalkoottamUnit? AyalkoottamUnit { get; set; }

        [ForeignKey("ApprovedBy")]
        public virtual ApplicationUser? Approver { get; set; }

        public virtual ICollection<LoanRepayment> LoanRepayments { get; set; } = new List<LoanRepayment>();
    }
}