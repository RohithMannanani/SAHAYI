using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.DTOs;
using Sahayi.Api.Dtos;
using Sahayi.Api.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Sahayi.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MemberController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MemberController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/member/dashboard?userId={userId}&unitId={unitId}
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetMemberDashboard([FromQuery] int? userId, [FromQuery] int? unitId)
        {
            try
            {
                // 1. Resolve User & Unit
                ApplicationUser? user = null;
                if (userId.HasValue && userId.Value > 0)
                {
                    user = await _context.ApplicationUsers
                        .Include(u => u.UserRole)
                        .Include(u => u.AyalkoottamUnit)
                        .FirstOrDefaultAsync(u => u.UserId == userId.Value);
                }

                if (user == null && unitId.HasValue && unitId.Value > 0)
                {
                    user = await _context.ApplicationUsers
                        .Include(u => u.UserRole)
                        .Include(u => u.AyalkoottamUnit)
                        .FirstOrDefaultAsync(u => u.UnitId == unitId.Value && u.IsActive);
                }

                if (user == null)
                {
                    user = await _context.ApplicationUsers
                        .Include(u => u.UserRole)
                        .Include(u => u.AyalkoottamUnit)
                        .FirstOrDefaultAsync(u => u.IsActive);
                }

                if (user == null)
                {
                    return Ok(new MemberDashboardDto());
                }

                int targetUserId = user.UserId;
                int targetUnitId = user.UnitId ?? (unitId ?? 0);

                // Fetch Unit Details
                var unit = user.AyalkoottamUnit ?? await _context.AyalkoottamUnits.FindAsync(targetUnitId);
                string unitName = unit?.UnitName ?? "Akshaya Ayalkoottam";

                // 2. Fetch Savings Transactions for User
                var savingsTxs = await _context.SavingsTransactions
                    .Where(s => s.UserId == targetUserId)
                    .OrderByDescending(s => s.TransactionDate)
                    .ToListAsync();

                bool updatedNullWeeks = false;
                foreach (var s in savingsTxs)
                {
                    if (!s.SavingsWeekId.HasValue)
                    {
                        s.SavingsWeekId = System.Globalization.ISOWeek.GetWeekOfYear(s.TransactionDate);
                        updatedNullWeeks = true;
                    }
                }
                if (updatedNullWeeks)
                {
                    await _context.SaveChangesAsync();
                }

                decimal totalSavings = savingsTxs.Sum(s => s.Amount);
                DateTime now = DateTime.UtcNow;
                decimal savingsThisMonth = savingsTxs
                    .Where(s => s.TransactionDate.Month == now.Month && s.TransactionDate.Year == now.Year)
                    .Sum(s => s.Amount);

                decimal savingsGoal = 100000m;
                int progressPct = (int)Math.Min(100, Math.Round((totalSavings / savingsGoal) * 100m));

                // Generate Weekly History for Member (Current Week + Last 7 Weeks)
                var weeklyHistory = new List<MemberWeeklySavingsRowDto>();

                int currentDayOfWeek = (int)now.DayOfWeek;
                int diffToCurrentMonday = currentDayOfWeek == 0 ? -6 : 1 - currentDayOfWeek;
                DateTime currentMonday = now.AddDays(diffToCurrentMonday).Date;

                for (int w = 0; w < 8; w++)
                {
                    DateTime monday = currentMonday.AddDays(-7 * w);
                    DateTime sunday = monday.AddDays(6).AddHours(23).AddMinutes(59).AddSeconds(59);

                    int weekNumber = System.Globalization.ISOWeek.GetWeekOfYear(monday);
                    string weekKey = monday.ToString("yyyy-MM-dd");

                    string startStr = monday.ToString("MMM d");
                    string endStr = sunday.ToString("MMM d, yyyy");
                    string weekTitle = $"{startStr} – {endStr}";

                    var matchTx = savingsTxs.FirstOrDefault(s =>
                        (s.SavingsWeekId.HasValue && s.SavingsWeekId.Value == weekNumber && s.TransactionDate.Year == monday.Year) ||
                        (s.TransactionDate >= monday && s.TransactionDate <= sunday));

                    if (matchTx != null)
                    {
                        weeklyHistory.Add(new MemberWeeklySavingsRowDto
                        {
                            SavingsWeekId = matchTx.SavingsWeekId ?? weekNumber,
                            WeekKey = weekKey,
                            WeekTitle = weekTitle,
                            Amount = matchTx.Amount,
                            Status = "Paid",
                            PaymentMode = string.IsNullOrWhiteSpace(matchTx.PaymentMode) ? "Cash" : matchTx.PaymentMode,
                            PaidDate = matchTx.TransactionDate.ToString("dd MMM yyyy"),
                            ReceiptNumber = matchTx.ReceiptNumber,
                            TransactionId = matchTx.TransactionId
                        });
                    }
                    else
                    {
                        weeklyHistory.Add(new MemberWeeklySavingsRowDto
                        {
                            SavingsWeekId = weekNumber,
                            WeekKey = weekKey,
                            WeekTitle = weekTitle,
                            Amount = 100.00m,
                            Status = "Pending",
                            PaymentMode = "-",
                            PaidDate = "-",
                            ReceiptNumber = string.Empty,
                            TransactionId = 0
                        });
                    }
                }

                var currentWeekItem = weeklyHistory.FirstOrDefault(w => w.WeekKey == currentMonday.ToString("yyyy-MM-dd"));
                bool isWeeklyPaid = currentWeekItem != null && currentWeekItem.Status == "Paid";
                string weeklyStatus = isWeeklyPaid ? "Paid" : "Pending";
                var latestTx = savingsTxs.FirstOrDefault();
                string lastPaymentDate = latestTx != null ? latestTx.TransactionDate.ToString("dd MMM yyyy") : string.Empty;
                int pendingWeeksCount = weeklyHistory.Count(w => w.Status == "Pending");

                // 3. Fetch Active Loan for User
                var loans = await _context.LoanApplications
                    .Where(l => l.UserId == targetUserId)
                    .Include(l => l.LoanRepayments)
                    .OrderByDescending(l => l.AppliedDate)
                    .ToListAsync();

                var activeLoanEntity = loans.FirstOrDefault(l => l.Status != "Closed" && l.Status != "Rejected");
                var loanStatusDto = new MemberLoanStatusDto();
                var repaymentScheduleList = new List<MemberRepaymentRowDto>();

                if (activeLoanEntity != null)
                {
                    decimal totalPaid = activeLoanEntity.LoanRepayments.Sum(r => r.AmountPaid);
                    decimal remaining = Math.Max(0, activeLoanEntity.AmountRequested - totalPaid);
                    decimal monthlyPrincipal = Math.Round(activeLoanEntity.AmountRequested / Math.Max(1, activeLoanEntity.TenureMonths), 2);
                    decimal monthlyInterest = Math.Round(remaining * 0.02m, 2);
                    decimal monthlyTotal = monthlyPrincipal + monthlyInterest;

                    string displayStatus = activeLoanEntity.Status switch
                    {
                        "Approved" => "In Repayment",
                        "Disbursed" => "In Repayment",
                        "Pending" => "Pending Review",
                        _ => activeLoanEntity.Status
                    };

                    DateTime nextDueDate;
                    var latestRepayment = activeLoanEntity.LoanRepayments
                        .OrderByDescending(r => r.RepaymentDate)
                        .FirstOrDefault();

                    if (latestRepayment != null)
                    {
                        nextDueDate = latestRepayment.RepaymentDate.AddMonths(1);
                    }
                    else if (activeLoanEntity.DisbursedDate.HasValue)
                    {
                        nextDueDate = activeLoanEntity.DisbursedDate.Value.AddMonths(1);
                    }
                    else
                    {
                        nextDueDate = activeLoanEntity.AppliedDate.AddMonths(1);
                    }

                    string dueDateStr = (activeLoanEntity.Status == "Disbursed" || activeLoanEntity.Status == "Approved")
                        ? nextDueDate.ToString("dd MMM yyyy")
                        : "-";

                    loanStatusDto = new MemberLoanStatusDto
                    {
                        HasLoan = true,
                        LoanId = activeLoanEntity.LoanId,
                        LoanAmount = activeLoanEntity.AmountRequested,
                        RemainingBalance = remaining > 0 ? remaining : activeLoanEntity.AmountRequested,
                        Status = displayStatus,
                        NextPayment = monthlyTotal,
                        DueDate = dueDateStr
                    };

                    // Map Repayments Schedule
                    var repayments = activeLoanEntity.LoanRepayments
                        .OrderByDescending(r => r.RepaymentDate)
                        .ToList();

                    if (repayments.Any())
                    {
                        repaymentScheduleList = repayments.Select(r => new MemberRepaymentRowDto
                        {
                            Id = r.RepaymentId,
                            Month = r.RepaymentDate.ToString("MMM yyyy"),
                            Principal = $"₹{r.PrincipalComponent:N0}",
                            Interest = $"₹{r.InterestComponent:N0}",
                            Total = $"₹{r.AmountPaid:N0}",
                            Status = "paid"
                        }).ToList();
                    }

                    // Add upcoming pending rows if less than 3
                    if (repaymentScheduleList.Count < 3)
                    {
                        for (int i = 0; i < 3 - repaymentScheduleList.Count; i++)
                        {
                            DateTime monthDate = now.AddMonths(i);
                            repaymentScheduleList.Add(new MemberRepaymentRowDto
                            {
                                Id = 100 + i,
                                Month = monthDate.ToString("MMM yyyy"),
                                Principal = $"₹{(monthlyPrincipal > 0 ? monthlyPrincipal : 1000m):N0}",
                                Interest = $"₹{(monthlyInterest > 0 ? monthlyInterest : 200m):N0}",
                                Total = $"₹{(monthlyTotal > 0 ? monthlyTotal : 1200m):N0}",
                                Status = i == 0 && totalPaid > 0 ? "paid" : "pending"
                            });
                        }
                    }
                }
                else
                {
                    loanStatusDto = new MemberLoanStatusDto
                    {
                        HasLoan = false,
                        Status = "No Active Loan",
                        RemainingBalance = 0m,
                        NextPayment = 0m,
                        DueDate = "-"
                    };

                    // No repayment schedule when no active loan is scheduled
                    repaymentScheduleList = new List<MemberRepaymentRowDto>();
                }

                // 4. Attendance Calendar Data
                var userAttendances = await _context.Attendances
                    .Where(a => a.UserId == targetUserId)
                    .Include(a => a.Meeting)
                    .ToListAsync();

                var attendanceCalendar = new Dictionary<int, string>();
                int totalMeetings = userAttendances.Count;
                int presentCount = userAttendances.Count(a => a.IsPresent);
                int missedCount = totalMeetings - presentCount;

                // Fill days 1..12 with presence status from DB or default presence
                for (int day = 1; day <= 12; day++)
                {
                    var att = userAttendances.FirstOrDefault(a => a.MarkedAt.Day == day || (a.Meeting != null && a.Meeting.MeetingDate.Day == day));
                    if (att != null)
                    {
                        attendanceCalendar[day] = att.IsPresent ? "present" : "absent";
                    }
                    else
                    {
                        // Default pattern for active members
                        attendanceCalendar[day] = (day == 4) ? "absent" : "present";
                    }
                }

                int annualPct = totalMeetings > 0 ? (int)Math.Round((double)presentCount / totalMeetings * 100) : 94;

                // 5. Notifications List
                var notificationsList = new List<MemberNotificationDto>();

                // Fetch Unit Upcoming Meetings
                var upcomingMeeting = await _context.Meetings
                    .Where(m => m.UnitId == targetUnitId && m.MeetingDate >= now.AddDays(-1))
                    .OrderBy(m => m.MeetingDate)
                    .FirstOrDefaultAsync();

                if (upcomingMeeting != null)
                {
                    notificationsList.Add(new MemberNotificationDto
                    {
                        Id = upcomingMeeting.MeetingId,
                        Icon = "meeting",
                        Title = "Monthly Meeting Alert",
                        Time = "Scheduled",
                        Body = $"Next group meeting is scheduled for {upcomingMeeting.MeetingDate:ddd, MMM d} at {upcomingMeeting.Venue}. Please bring your passbooks.",
                        Actions = new List<string> { "Confirm Attendance", "Remind Me" }
                    });
                }
                else
                {
                    notificationsList.Add(new MemberNotificationDto
                    {
                        Id = 1,
                        Icon = "meeting",
                        Title = "Monthly Meeting Alert",
                        Time = "2 hours ago",
                        Body = $"Our next group meeting for {unitName} is scheduled for Saturday at 10:00 AM in the Community Hall. Please bring your passbooks.",
                        Actions = new List<string> { "Confirm Attendance", "Remind Me" }
                    });
                }

                // Add Loan status notification
                if (activeLoanEntity != null)
                {
                    notificationsList.Add(new MemberNotificationDto
                    {
                        Id = activeLoanEntity.LoanId + 100,
                        Icon = "loan",
                        Title = $"Loan Status: {loanStatusDto.Status}",
                        Time = activeLoanEntity.AppliedDate.ToString("dd MMM yyyy"),
                        Body = $"Your loan request of ₹{activeLoanEntity.AmountRequested:N0} for '{activeLoanEntity.Purpose}' is currently {loanStatusDto.Status.ToLower()}.",
                        Actions = new List<string> { "View Loan Details" }
                    });
                }
                else
                {
                    notificationsList.Add(new MemberNotificationDto
                    {
                        Id = 2,
                        Icon = "loan",
                        Title = "New Loan Policy Update",
                        Time = "Yesterday",
                        Body = "The group has approved a lower interest rate for education and small enterprise loans. Members can now apply directly from the dashboard.",
                        Actions = new List<string> { "Read Full Policy" }
                    });
                }

                // 5b. Fetch Available Unit Savings (Savings Collections - Disbursed Loans + Loan Repayments)
                decimal unitSavingsCollected = await _context.SavingsTransactions
                    .Where(s => s.UnitId == targetUnitId)
                    .SumAsync(s => (decimal?)s.Amount) ?? 0m;

                decimal unitLoansDisbursed = await _context.LoanApplications
                    .Where(l => l.UnitId == targetUnitId && (l.Status == "Disbursed" || l.Status == "Approved" || l.Status == "Closed"))
                    .SumAsync(l => (decimal?)l.AmountRequested) ?? 0m;

                decimal unitLoansRepaid = await _context.LoanApplications
                    .Where(l => l.UnitId == targetUnitId)
                    .SelectMany(l => l.LoanRepayments)
                    .SumAsync(r => (decimal?)r.AmountPaid) ?? 0m;

                var unitBankAcc = await _context.UnitBankAccounts.FirstOrDefaultAsync(b => b.UnitId == targetUnitId);
                decimal unitTotalSavings = unitBankAcc?.Balance ?? unit?.AccountBalance ?? 0m;

                int totalUnitMembers = await _context.ApplicationUsers
                    .CountAsync(u => u.UnitId == targetUnitId && u.IsActive);

                decimal unitMonthlyTotal = await _context.SavingsTransactions
                    .Where(s => s.UnitId == targetUnitId && s.TransactionDate.Month == now.Month && s.TransactionDate.Year == now.Year)
                    .SumAsync(s => (decimal?)s.Amount) ?? 0m;

                // 6. Build Final Member Dashboard DTO
                var dashboardDto = new MemberDashboardDto
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    PhoneNumber = user.PhoneNumber,
                    HouseName = user.HouseName ?? string.Empty,
                    UnitId = targetUnitId,
                    UnitName = unitName,
                    MemberIdStr = $"AK-{user.UserId:D3}",
                    RoleName = user.UserRole?.RoleName ?? "Member",
                    AvatarUrl = "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=120",

                    UnitTotalSavings = unitTotalSavings,
                    TotalUnitMembers = totalUnitMembers > 0 ? totalUnitMembers : 15,
                    UnitMonthlyTotal = unitMonthlyTotal,

                    Savings = new MemberSavingsSummaryDto
                    {
                        TotalSavings = totalSavings,
                        SavingsThisMonth = savingsThisMonth,
                        SavingsGoal = savingsGoal,
                        ProgressPct = progressPct,
                        IsWeeklyPaid = isWeeklyPaid,
                        WeeklyStatus = weeklyStatus,
                        LastPaymentDate = lastPaymentDate,
                        PendingWeeksCount = pendingWeeksCount,
                        WeeklyHistory = weeklyHistory
                    },

                    ActiveLoan = loanStatusDto,
                    RepaymentSchedule = repaymentScheduleList,

                    Attendance = new MemberAttendanceSummaryDto
                    {
                        AnnualPct = annualPct,
                        TotalMeetings = totalMeetings > 0 ? totalMeetings : 12,
                        PresentCount = presentCount > 0 ? presentCount : 11,
                        MissedCount = missedCount > 0 ? missedCount : 1,
                        Calendar = attendanceCalendar
                    },

                    Notifications = notificationsList
                };

                return Ok(dashboardDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading member dashboard data.", details = ex.Message });
            }
        }

        // POST: api/member/apply-loan
        [HttpPost("apply-loan")]
        [Authorize(Roles = "Member,President,Secretary,Treasurer")]
        public async Task<IActionResult> ApplyForLoan([FromBody] ApplyLoanDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var user = await _context.ApplicationUsers.FindAsync(currentUserId);
                if (user == null)
                {
                    return NotFound(new { message = $"User not found." });
                }

                // Guard: User cannot apply if they currently have an active 'Disbursed' or 'Approved' loan with an unsettled balance
                var activeLoan = await _context.LoanApplications
                    .FirstOrDefaultAsync(l => l.UserId == currentUserId && (l.Status == "Disbursed" || l.Status == "Approved" || l.Status == "Pending"));

                if (activeLoan != null)
                {
                    return BadRequest(new { message = $"You cannot apply for a new loan. You currently have a {activeLoan.Status} loan." });
                }

                int targetUnitId = user.UnitId ?? 0;
                if (targetUnitId == 0)
                {
                    return BadRequest(new { message = "You are not assigned to a unit." });
                }

                // Check net available unit savings balance (UnitBankAccounts.Balance)
                var unitBankAcc = await _context.UnitBankAccounts.FirstOrDefaultAsync(b => b.UnitId == targetUnitId);
                var unitObj = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.UnitId == targetUnitId);
                decimal unitTotalSavings = unitBankAcc?.Balance ?? unitObj?.AccountBalance ?? 0m;

                if (dto.AmountRequested > unitTotalSavings)
                {
                    return BadRequest(new { message = $"Requested loan amount (₹{dto.AmountRequested:N0}) exceeds the total unit savings available (₹{unitTotalSavings:N0})." });
                }

                var loanApplication = new LoanApplication
                {
                    UserId = currentUserId,
                    UnitId = targetUnitId,
                    AmountRequested = dto.AmountRequested,
                    Purpose = dto.Purpose,
                    TenureMonths = dto.TenureMonths,
                    InterestRate = dto.InterestRate,
                    Status = "Pending",
                    AppliedDate = DateTime.UtcNow
                };

                _context.LoanApplications.Add(loanApplication);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Loan application of ₹{dto.AmountRequested:N0} submitted successfully! Pending review.",
                    loanId = loanApplication.LoanId,
                    status = "Pending"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to submit loan application.", details = ex.Message });
            }
        }

        // GET: api/member/my-loans
        [HttpGet("my-loans")]
        [Authorize(Roles = "Member,President,Secretary,Treasurer")]
        public async Task<IActionResult> GetMyLoans()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var loans = await _context.LoanApplications
                    .Include(l => l.Approver)
                    .Include(l => l.LoanRepayments)
                        .ThenInclude(r => r.Recorder)
                    .Where(l => l.UserId == currentUserId)
                    .OrderByDescending(l => l.AppliedDate)
                    .ToListAsync();

                var dtos = loans.Select(l =>
                {
                    decimal totalPrincipalPaid = l.LoanRepayments.Sum(r => r.PrincipalComponent);
                    decimal totalInterestPaid = l.LoanRepayments.Sum(r => r.InterestComponent);
                    decimal outstandingBalance = Math.Max(0m, l.AmountRequested - totalPrincipalPaid);

                    var repaymentDtos = l.LoanRepayments
                        .OrderByDescending(r => r.RepaymentDate)
                        .Select(r => new LoanRepaymentHistoryDto
                        {
                            RepaymentId = r.RepaymentId,
                            AmountPaid = r.AmountPaid,
                            PrincipalComponent = r.PrincipalComponent,
                            InterestComponent = r.InterestComponent,
                            RepaymentDate = r.RepaymentDate,
                            ReceiptNumber = r.ReceiptNumber ?? string.Empty,
                            RecordedByName = r.Recorder?.FullName ?? "Treasurer"
                        }).ToList();

                    return new LoanSummaryDto
                    {
                        LoanId = l.LoanId,
                        UserId = l.UserId,
                        AmountRequested = l.AmountRequested,
                        Purpose = l.Purpose,
                        TenureMonths = l.TenureMonths,
                        InterestRate = l.InterestRate,
                        Status = l.Status,
                        AppliedDate = l.AppliedDate,
                        ApprovedByName = l.Approver?.FullName,
                        DisbursedDate = l.DisbursedDate,
                        TotalPrincipalPaid = totalPrincipalPaid,
                        TotalInterestPaid = totalInterestPaid,
                        OutstandingBalance = outstandingBalance,
                        Repayments = repaymentDtos
                    };
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch loans.", details = ex.Message });
            }
        }

        // POST: api/member/pay-installment?loanId={loanId}
        [HttpPost("pay-installment")]
        [Authorize(Roles = "Member,President,Secretary,Treasurer")]
        public async Task<IActionResult> PayInstallment([FromBody] RecordRepaymentDto dto, [FromQuery] int loanId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var loan = await _context.LoanApplications
                    .Include(l => l.LoanRepayments)
                    .FirstOrDefaultAsync(l => l.LoanId == loanId);

                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.UserId != currentUserId && !User.IsInRole("Treasurer") && !User.IsInRole("Secretary") && !User.IsInRole("President"))
                {
                    return Forbid();
                }

                if (loan.Status != "Disbursed" && loan.Status != "Approved")
                    return BadRequest(new { message = $"Cannot pay installment for a loan that is {loan.Status}." });

                decimal totalPrincipalPaid = loan.LoanRepayments.Sum(r => r.PrincipalComponent);
                decimal outstandingBalance = loan.AmountRequested - totalPrincipalPaid;

                if (outstandingBalance <= 0)
                {
                    loan.Status = "Closed";
                    await _context.SaveChangesAsync();
                    return BadRequest(new { message = "Loan is already fully repaid." });
                }

                decimal monthlyInterestDue = Math.Round((outstandingBalance * (loan.InterestRate / 100m)) / 12m, 2);

                decimal principalPaid = dto.AmountPaid - monthlyInterestDue;
                if (principalPaid < 0)
                {
                    principalPaid = 0;
                }

                if (principalPaid > outstandingBalance)
                {
                    principalPaid = outstandingBalance;
                    dto.AmountPaid = principalPaid + monthlyInterestDue;
                }

                decimal interestComponent = dto.AmountPaid - principalPaid;
                string receiptNumber = $"REC-LN-ONLINE-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";

                var repayment = new LoanRepayment
                {
                    LoanId = loanId,
                    AmountPaid = dto.AmountPaid,
                    PrincipalComponent = principalPaid,
                    InterestComponent = interestComponent,
                    RepaymentDate = DateTime.UtcNow,
                    ReceiptNumber = receiptNumber,
                    RecordedBy = currentUserId
                };

                _context.LoanRepayments.Add(repayment);

                decimal newBalance = outstandingBalance - principalPaid;
                if (newBalance <= 0)
                {
                    loan.Status = "Closed";
                }

                var unit = await _context.AyalkoottamUnits.FindAsync(loan.UnitId);
                var bankAccount = await _context.UnitBankAccounts.FirstOrDefaultAsync(b => b.UnitId == loan.UnitId);
                if (bankAccount == null)
                {
                    string accNum = !string.IsNullOrWhiteSpace(unit?.AccountNumber) ? unit.AccountNumber : $"SB-UNIT-{loan.UnitId:D4}";
                    string bankName = !string.IsNullOrWhiteSpace(unit?.BankName) ? unit.BankName : "Sahayi Co-operative Bank";
                    string ifsc = !string.IsNullOrWhiteSpace(unit?.IFSCCode) ? unit.IFSCCode : "SHY0001001";

                    bankAccount = new UnitBankAccount
                    {
                        UnitId = loan.UnitId,
                        AccountNumber = accNum,
                        BankName = bankName,
                        IFSCCode = ifsc,
                        Balance = dto.AmountPaid,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.UnitBankAccounts.Add(bankAccount);
                }
                else
                {
                    bankAccount.Balance += dto.AmountPaid;
                    bankAccount.LastUpdated = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Installment payment recorded successfully!",
                    receiptNumber = receiptNumber,
                    principalPaid = principalPaid,
                    interestPaid = interestComponent,
                    amountPaid = dto.AmountPaid,
                    newBalance = newBalance,
                    status = loan.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to process installment payment.", details = ex.Message });
            }
        }
    }
}
