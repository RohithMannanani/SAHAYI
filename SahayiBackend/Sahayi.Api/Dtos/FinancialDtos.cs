using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    // Record Weekly Thrift Deposit
    public class RecordSavingsDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid UnitId { get; set; }

        [Required]
        [Range(1, 100000, ErrorMessage = "Amount must be greater than 0.")]
        public decimal Amount { get; set; }

        [Required]
        public Guid RecordedBy { get; set; }
    }

    // Submit Loan Application
    public class ApplyLoanDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid UnitId { get; set; }

        [Required]
        [Range(100, 500000)]
        public decimal AmountRequested { get; set; }

        [Required]
        public string Purpose { get; set; } = string.Empty;

        [Required]
        [Range(1, 60)]
        public int TenureMonths { get; set; }

        [Required]
        [Range(0, 100)]
        public decimal InterestRate { get; set; }
    }

    // Approve / Reject Loan Request
    public class ApproveRejectLoanDto
    {
        [Required]
        public int LoanId { get; set; }

        [Required]
        public Guid ApprovedBy { get; set; }

        [Required]
        public bool IsApproved { get; set; }
    }

    // Record EMI Loan Repayment
    public class RecordRepaymentDto
    {
        [Required]
        public int LoanId { get; set; }

        [Required]
        public decimal AmountPaid { get; set; }

        [Required]
        public decimal PrincipalComponent { get; set; }

        [Required]
        public decimal InterestComponent { get; set; }

        [Required]
        public Guid RecordedBy { get; set; }
    }
}