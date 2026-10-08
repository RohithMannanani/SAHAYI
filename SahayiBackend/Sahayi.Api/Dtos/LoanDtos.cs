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

        [StringLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters.")]
        public string? Reason { get; set; }
    }

    public class RecordRepaymentDto
    {
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount paid must be greater than 0.")]
        public decimal AmountPaid { get; set; }

        public string RepaymentType { get; set; } = "Combined"; // InterestOnly, PrincipalOnly, Combined, FullPayoff
        public decimal? PrincipalComponent { get; set; }
        public decimal? InterestComponent { get; set; }
        public string? Notes { get; set; }
        public string? PaymentMode { get; set; } = "Cash";
    }

    public class PassbookLedgerEntryDto
    {
        public int EntryId { get; set; }
        public DateTime Date { get; set; }
        public string EntryType { get; set; } = string.Empty; // Disbursement, Repayment
        public decimal LoanDisbursed { get; set; }
        public decimal PrincipalRepaid { get; set; }
        public decimal InterestPaid { get; set; }
        public decimal RemainingBalance { get; set; }
        public string ReceiptNumber { get; set; } = string.Empty;
        public string SecretarySignature { get; set; } = string.Empty;
    }

    public class EarlyPayoffNoticeDto
    {
        public bool IsLowUnitFunds { get; set; }
        public decimal UnitAvailableSavings { get; set; }
        public decimal PendingLoanRequested { get; set; }
        public decimal DeficitAmount { get; set; }
        public string ApplicantName { get; set; } = string.Empty;
        public string NoticeMessage { get; set; } = string.Empty;
    }

    public class LoanSummaryDto
    {
        public int LoanId { get; set; }
        public int UserId { get; set; }
        public string MemberName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public decimal AmountRequested { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public int TenureMonths { get; set; }
        public decimal InterestRate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AppliedDate { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? DisbursedDate { get; set; }
        public string? RejectionReason { get; set; }

        // Computed Fields
        public decimal FineAmount { get; set; }
        public decimal TotalLoanAmount { get; set; }
        public decimal TotalPrincipalPaid { get; set; }
        public decimal OutstandingBalance { get; set; }
        public decimal TotalInterestPaid { get; set; }
        public List<LoanRepaymentHistoryDto> Repayments { get; set; } = new List<LoanRepaymentHistoryDto>();
    }

    public class LoanRepaymentHistoryDto
    {
        public int RepaymentId { get; set; }
        public int? LoanId { get; set; }
        public string? BorrowerName { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal PrincipalComponent { get; set; }
        public decimal InterestComponent { get; set; }
        public DateTime RepaymentDate { get; set; }
        public string ReceiptNumber { get; set; } = string.Empty;
        public string RecordedByName { get; set; } = string.Empty;
        public string PaymentMode { get; set; } = "Cash";
        public bool IsBankDeposited { get; set; }
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
        public decimal FineAmount { get; set; }
        public decimal TotalLoanAmount { get; set; }
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
