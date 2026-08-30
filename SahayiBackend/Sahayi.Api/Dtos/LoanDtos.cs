using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.Dtos
{
    public class ApplyLoanDto
    {
        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Amount requested must be greater than 0.")]
        public decimal AmountRequested { get; set; }

        [Required]
        [StringLength(500, MinimumLength = 10, ErrorMessage = "Purpose must be between 10 and 500 characters.")]
        public string Purpose { get; set; } = string.Empty;

        [Required]
        [Range(1, 120, ErrorMessage = "Tenure must be between 1 and 120 months.")]
        public int TenureMonths { get; set; }

        [Required]
        [Range(0.01, 100, ErrorMessage = "Interest rate must be between 0.01 and 100.")]
        public decimal InterestRate { get; set; }
    }

    public class LoanReviewDto
    {
        [Required]
        [RegularExpression("^(Approved|Rejected)$", ErrorMessage = "Status must be 'Approved' or 'Rejected'.")]
        public string Status { get; set; } = string.Empty;
    }

    public class RecordRepaymentDto
    {
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount paid must be greater than 0.")]
        public decimal AmountPaid { get; set; }
    }

    public class LoanSummaryDto
    {
        public int LoanId { get; set; }
        public int UserId { get; set; }
        public string MemberName { get; set; } = string.Empty;
        public decimal AmountRequested { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public int TenureMonths { get; set; }
        public decimal InterestRate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AppliedDate { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? DisbursedDate { get; set; }

        // Computed Fields
        public decimal TotalPrincipalPaid { get; set; }
        public decimal OutstandingBalance { get; set; }
        public decimal TotalInterestPaid { get; set; }
        public List<LoanRepaymentHistoryDto> Repayments { get; set; } = new List<LoanRepaymentHistoryDto>();
    }

    public class LoanRepaymentHistoryDto
    {
        public int RepaymentId { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal PrincipalComponent { get; set; }
        public decimal InterestComponent { get; set; }
        public DateTime RepaymentDate { get; set; }
        public string ReceiptNumber { get; set; } = string.Empty;
        public string RecordedByName { get; set; } = string.Empty;
    }

    public class LoanDetailsResponseDto
    {
        public LoanSummaryDto Loan { get; set; } = new LoanSummaryDto();
        public List<LoanRepaymentHistoryDto> Repayments { get; set; } = new List<LoanRepaymentHistoryDto>();
    }

    public class LoanInstallmentDueDto
    {
        public int LoanId { get; set; }
        public string BorrowerName { get; set; } = string.Empty;
        public decimal RemainingBalance { get; set; }
        public decimal FixedPrincipalDue { get; set; }
        public decimal CurrentMonthInterestDue { get; set; }
        public decimal TotalInstallmentDue { get; set; }
        public int CurrentInstallmentNumber { get; set; }
        public int TotalTenureMonths { get; set; }
    }

    public class RepaymentScheduleItemDto
    {
        public int Month { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal PrincipalComponent { get; set; }
        public decimal InterestComponent { get; set; }
        public decimal TotalPayment { get; set; }
        public decimal ClosingBalance { get; set; }
        public string Status { get; set; } = "Upcoming";
    }
}
