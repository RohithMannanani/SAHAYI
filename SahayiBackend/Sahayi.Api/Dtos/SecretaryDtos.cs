using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    public class CreateSecretaryMemberDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string MemberId { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public decimal Savings { get; set; } = 100;
    }

    public class CreateSecretaryMeetingDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        public string Date { get; set; } = string.Empty;

        public string Time { get; set; } = string.Empty;

        [Required]
        public string Location { get; set; } = string.Empty;

        public string Tag { get; set; } = "NEXT WEEK";
    }

    public class RecordSecretarySavingsDto
    {
        [Required]
        public Guid UserId { get; set; }

        public decimal Amount { get; set; } = 100;
    }

    public class RecordAttendanceItemDto
    {
        [Required]
        public Guid UserId { get; set; }

        public bool IsPresent { get; set; }
    }

    public class RecordSecretaryAttendanceDto
    {
        public int MeetingId { get; set; }

        public List<RecordAttendanceItemDto> Attendances { get; set; } = new List<RecordAttendanceItemDto>();
    }

    public class SecretarySavingsItemDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MemberId { get; set; } = string.Empty;
        public string Amount { get; set; } = "0.00";
        public string Status { get; set; } = "Pending";
        public string Date { get; set; } = string.Empty;
    }

    public class SecretaryMeetingItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
        public string TagType { get; set; } = "dark";
        public string Time { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
    }

    public class SecretaryLoanItemDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Amount { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string IconType { get; set; } = "bank";
        public string ApplicantId { get; set; } = string.Empty;
        public string TrustScore { get; set; } = "9.0";
        public string MembershipYears { get; set; } = "1 Year";
        public string ExistingDues { get; set; } = "₹0";
        public string Status { get; set; } = "pending";
    }

    public class SecretaryMemberItemDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MemberId { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string HouseName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Status { get; set; } = "present";
    }

    public class SecretaryDashboardDto
    {
        public Guid UnitId { get; set; }
        public string UnitName { get; set; } = string.Empty;
        public string SecretaryName { get; set; } = string.Empty;
        public string SecretaryPhone { get; set; } = string.Empty;
        public decimal TotalWeeklyCollection { get; set; }
        public decimal DisbursedLoansTotal { get; set; }
        public int PendingDuesCount { get; set; }
        public List<SecretarySavingsItemDto> SavingsLogs { get; set; } = new List<SecretarySavingsItemDto>();
        public List<SecretaryMeetingItemDto> Meetings { get; set; } = new List<SecretaryMeetingItemDto>();
        public List<SecretaryLoanItemDto> PendingLoans { get; set; } = new List<SecretaryLoanItemDto>();
        public List<SecretaryMemberItemDto> Members { get; set; } = new List<SecretaryMemberItemDto>();
    }
}
