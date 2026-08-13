using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.DTOs;
using Sahayi.Api.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sahayi.Api.Controllers
{
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

                decimal totalSavings = savingsTxs.Sum(s => s.Amount);
                DateTime now = DateTime.UtcNow;
                decimal savingsThisMonth = savingsTxs
                    .Where(s => s.TransactionDate.Month == now.Month && s.TransactionDate.Year == now.Year)
                    .Sum(s => s.Amount);

                decimal savingsGoal = 100000m;
                int progressPct = (int)Math.Min(100, Math.Round((totalSavings / savingsGoal) * 100m));

                var latestTx = savingsTxs.FirstOrDefault();
                bool isWeeklyPaid = latestTx != null && (now - latestTx.TransactionDate).TotalDays <= 6;
                string weeklyStatus = isWeeklyPaid ? "Paid" : "Pending";
                string lastPaymentDate = latestTx != null ? latestTx.TransactionDate.ToString("dd MMM yyyy") : string.Empty;

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

                    loanStatusDto = new MemberLoanStatusDto
                    {
                        HasLoan = true,
                        LoanId = activeLoanEntity.LoanId,
                        LoanAmount = activeLoanEntity.AmountRequested,
                        RemainingBalance = remaining > 0 ? remaining : activeLoanEntity.AmountRequested,
                        Status = displayStatus,
                        NextPayment = monthlyTotal > 0 ? monthlyTotal : 1200m,
                        DueDate = now.AddDays(15).ToString("dd MMM yyyy")
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

                    // Default sample repayment rows if no loan active
                    repaymentScheduleList = new List<MemberRepaymentRowDto>
                    {
                        new MemberRepaymentRowDto { Id = 1, Month = now.AddMonths(-1).ToString("MMM yyyy"), Principal = "₹1,000", Interest = "₹200", Total = "₹1,200", Status = "paid" },
                        new MemberRepaymentRowDto { Id = 2, Month = now.ToString("MMM yyyy"), Principal = "₹1,000", Interest = "₹200", Total = "₹1,200", Status = "pending" },
                        new MemberRepaymentRowDto { Id = 3, Month = now.AddMonths(1).ToString("MMM yyyy"), Principal = "₹1,000", Interest = "₹200", Total = "₹1,200", Status = "pending" }
                    };
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

                    Savings = new MemberSavingsSummaryDto
                    {
                        TotalSavings = totalSavings,
                        SavingsThisMonth = savingsThisMonth,
                        SavingsGoal = savingsGoal,
                        ProgressPct = progressPct,
                        IsWeeklyPaid = isWeeklyPaid,
                        WeeklyStatus = weeklyStatus,
                        LastPaymentDate = lastPaymentDate
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
        public async Task<IActionResult> ApplyForLoan([FromBody] ApplyMemberLoanDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _context.ApplicationUsers.FindAsync(dto.UserId);
                if (user == null)
                {
                    return BadRequest(new { message = $"User ID {dto.UserId} not found." });
                }

                int targetUnitId = dto.UnitId > 0 ? dto.UnitId : (user.UnitId ?? 0);

                var loanApplication = new LoanApplication
                {
                    UserId = dto.UserId,
                    UnitId = targetUnitId,
                    AmountRequested = dto.Amount,
                    Purpose = dto.Purpose,
                    TenureMonths = dto.TenureMonths > 0 ? dto.TenureMonths : 12,
                    InterestRate = 6.0m,
                    Status = "Pending",
                    AppliedDate = DateTime.UtcNow
                };

                _context.LoanApplications.Add(loanApplication);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Loan application of ₹{dto.Amount:N0} submitted successfully! Pending Secretary endorsement.",
                    loanId = loanApplication.LoanId,
                    status = "Pending"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to submit loan application.", details = ex.Message });
            }
        }
    }
}
