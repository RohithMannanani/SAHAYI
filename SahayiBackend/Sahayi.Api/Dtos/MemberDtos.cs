using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    public class ApplyMemberLoanDto
    {
        [Required]
        public int UserId { get; set; }

        public int UnitId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string Purpose { get; set; } = string.Empty;

        public int TenureMonths { get; set; } = 12;
    }

    public class MemberSavingsSummaryDto
    {
        public decimal TotalSavings { get; set; }
        public decimal SavingsThisMonth { get; set; }
        public decimal SavingsGoal { get; set; } = 100000;
        public int ProgressPct { get; set; }
        public bool IsWeeklyPaid { get; set; }
        public string WeeklyStatus { get; set; } = "Pending";
        public string LastPaymentDate { get; set; } = string.Empty;
    }

    public class MemberLoanStatusDto
    {
        public bool HasLoan { get; set; }
        public int LoanId { get; set; }
        public decimal LoanAmount { get; set; }
        public decimal RemainingBalance { get; set; }
        public string Status { get; set; } = "No Active Loan";
        public decimal NextPayment { get; set; }
        public string DueDate { get; set; } = string.Empty;
    }

    public class MemberRepaymentRowDto
    {
        public int Id { get; set; }
        public string Month { get; set; } = string.Empty;
        public string Principal { get; set; } = "₹0";
        public string Interest { get; set; } = "₹0";
        public string Total { get; set; } = "₹0";
        public string Status { get; set; } = "pending"; // paid, pending
    }

    public class MemberAttendanceSummaryDto
    {
        public int AnnualPct { get; set; } = 100;
        public int TotalMeetings { get; set; }
        public int PresentCount { get; set; }
        public int MissedCount { get; set; }
        public Dictionary<int, string> Calendar { get; set; } = new Dictionary<int, string>();
    }

    public class MemberNotificationDto
    {
        public int Id { get; set; }
        public string Icon { get; set; } = "meeting"; // meeting, loan
        public string Title { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public List<string> Actions { get; set; } = new List<string>();
    }

    public class MemberDashboardDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string HouseName { get; set; } = string.Empty;
        public int UnitId { get; set; }
        public string UnitName { get; set; } = string.Empty;
        public string MemberIdStr { get; set; } = string.Empty;
        public string RoleName { get; set; } = "Member";
        public string AvatarUrl { get; set; } = string.Empty;

        public MemberSavingsSummaryDto Savings { get; set; } = new MemberSavingsSummaryDto();
        public MemberLoanStatusDto ActiveLoan { get; set; } = new MemberLoanStatusDto();
        public List<MemberRepaymentRowDto> RepaymentSchedule { get; set; } = new List<MemberRepaymentRowDto>();
        public MemberAttendanceSummaryDto Attendance { get; set; } = new MemberAttendanceSummaryDto();
        public List<MemberNotificationDto> Notifications { get; set; } = new List<MemberNotificationDto>();
    }
}
