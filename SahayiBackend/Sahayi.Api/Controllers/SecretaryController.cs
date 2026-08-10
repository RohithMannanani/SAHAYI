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
    public class SecretaryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SecretaryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/secretary/dashboard?unitId={unitId}&userId={userId}
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData([FromQuery] int? unitId, [FromQuery] int? userId)
        {
            try
            {
                // 1. Resolve unitId
                int targetUnitId = 0;

                if (unitId.HasValue && unitId.Value != 0)
                {
                    targetUnitId = unitId.Value;
                }
                else if (userId.HasValue && userId.Value != 0)
                {
                    var user = await _context.ApplicationUsers.FindAsync(userId.Value);
                    if (user?.UnitId != null)
                    {
                        targetUnitId = user.UnitId.Value;
                    }
                }

                // If unitId is still empty, pick first active unit from DB
                if (targetUnitId == 0)
                {
                    var firstUnit = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.IsActive);
                    if (firstUnit != null)
                    {
                        targetUnitId = firstUnit.UnitId;
                    }
                }

                var unit = await _context.AyalkoottamUnits
                    .Include(u => u.Users)
                        .ThenInclude(u => u.UserRole)
                    .FirstOrDefaultAsync(u => u.UnitId == targetUnitId);

                if (unit == null)
                {
                    return Ok(new SecretaryDashboardDto());
                }

                // Fetch Secretary info
                var secretaryUser = unit.Users.FirstOrDefault(u => u.RoleId == 3 || u.UserRole?.RoleName == "Secretary")
                                   ?? unit.Users.FirstOrDefault();

                // Fetch Unit Members
                var unitUsers = unit.Users.Where(u => u.IsActive).ToList();

                var memberItems = unitUsers.Select((u, index) => new SecretaryMemberItemDto
                {
                    Id = index + 1,
                    UserId = u.UserId,
                    Name = u.FullName,
                    MemberId = $"AK-{(index + 1):D3}",
                    Phone = u.PhoneNumber,
                    HouseName = u.HouseName ?? string.Empty,
                    Address = u.HouseName ?? string.Empty,
                    Status = "present"
                }).ToList();

                // Fetch Savings Logs for Unit
                var savingsList = await _context.SavingsTransactions
                    .Where(s => s.UnitId == targetUnitId)
                    .Include(s => s.User)
                    .OrderByDescending(s => s.TransactionDate)
                    .Take(20)
                    .ToListAsync();

                var savingsLogs = new List<SecretarySavingsItemDto>();
                if (savingsList.Any())
                {
                    savingsLogs = savingsList.Select((s, index) => new SecretarySavingsItemDto
                    {
                        Id = s.TransactionId,
                        UserId = s.UserId,
                        Name = s.User?.FullName ?? "Member",
                        MemberId = $"AK-{(index + 1):D3}",
                        Amount = s.Amount.ToString("0.00"),
                        Status = "Paid",
                        Date = s.TransactionDate.ToString("yyyy-MM-dd")
                    }).ToList();
                }
                else
                {
                    // If no savings transactions exist yet, display unit members with Pending status
                    savingsLogs = unitUsers.Select((u, index) => new SecretarySavingsItemDto
                    {
                        Id = index + 1,
                        UserId = u.UserId,
                        Name = u.FullName,
                        MemberId = $"AK-{(index + 1):D3}",
                        Amount = "0.00",
                        Status = "Pending",
                        Date = DateTime.UtcNow.ToString("yyyy-MM-dd")
                    }).ToList();
                }

                // Fetch Meetings for Unit
                var meetingsList = await _context.Meetings
                    .Where(m => m.UnitId == targetUnitId)
                    .OrderBy(m => m.MeetingDate)
                    .ToListAsync();

                var meetingItems = new List<SecretaryMeetingItemDto>();
                if (meetingsList.Any())
                {
                    meetingItems = meetingsList.Select((m, idx) => new SecretaryMeetingItemDto
                    {
                        Id = m.MeetingId,
                        Title = string.IsNullOrWhiteSpace(m.MinutesOfMeeting) ? $"Meeting #{m.MeetingId}" : m.MinutesOfMeeting,
                        Tag = m.MeetingDate > DateTime.UtcNow ? "UPCOMING" : "COMPLETED",
                        TagType = idx % 2 == 0 ? "dark" : "peach",
                        Time = m.MeetingDate.ToString("hh:mm tt"),
                        Location = m.Venue
                    }).ToList();
                }

                // Fetch Pending Loans for Unit
                var pendingLoansList = await _context.LoanApplications
                    .Where(l => l.UnitId == targetUnitId && (l.Status == "Pending" || l.Status == "pending"))
                    .Include(l => l.User)
                    .ToListAsync();

                var loanItems = new List<SecretaryLoanItemDto>();
                if (pendingLoansList.Any())
                {
                    loanItems = pendingLoansList.Select(l => new SecretaryLoanItemDto
                    {
                        Id = l.LoanId,
                        UserId = l.UserId,
                        Name = l.User?.FullName ?? "Applicant",
                        Amount = $"₹{l.AmountRequested:N0}",
                        Purpose = l.Purpose,
                        IconType = l.Purpose.ToLower().Contains("business") || l.Purpose.ToLower().Contains("shop") ? "store" : "bank",
                        ApplicantId = $"AK-{l.LoanId:D3}",
                        TrustScore = "9.2",
                        MembershipYears = "3 Years",
                        ExistingDues = "₹0",
                        Status = "pending"
                    }).ToList();
                }

                // Calculate Financial Summary Stats
                decimal totalCollection = await _context.SavingsTransactions
                    .Where(s => s.UnitId == targetUnitId)
                    .SumAsync(s => (decimal?)s.Amount) ?? 0.00m;

                decimal disbursedTotal = await _context.LoanApplications
                    .Where(l => l.UnitId == targetUnitId && (l.Status == "Disbursed" || l.Status == "Approved"))
                    .SumAsync(l => (decimal?)l.AmountRequested) ?? 0.00m;

                int pendingDuesCount = savingsLogs.Count(s => s.Status == "Pending");

                var dto = new SecretaryDashboardDto
                {
                    UnitId = targetUnitId,
                    UnitName = unit.UnitName,
                    SecretaryName = secretaryUser?.FullName ?? "Unit Secretary",
                    SecretaryPhone = secretaryUser?.PhoneNumber ?? "",
                    TotalWeeklyCollection = totalCollection,
                    DisbursedLoansTotal = disbursedTotal,
                    PendingDuesCount = pendingDuesCount,
                    SavingsLogs = savingsLogs,
                    Meetings = meetingItems,
                    PendingLoans = loanItems,
                    Members = memberItems
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading secretary dashboard data.", details = ex.Message });
            }
        }

        // POST: api/secretary/members
        [HttpPost("members")]
        public async Task<IActionResult> RegisterMember([FromBody] CreateSecretaryMemberDto dto, [FromQuery] int? unitId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Resolve unitId
                int targetUnitId = unitId ?? 0;
                if (targetUnitId == 0)
                {
                    var unit = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.IsActive);
                    if (unit == null)
                        return BadRequest(new { message = "No active Ayalkoottam unit found." });
                    targetUnitId = unit.UnitId;
                }

                string phone = string.IsNullOrWhiteSpace(dto.Phone) ? $"98470{Random.Shared.Next(10000, 99999)}" : dto.Phone.Trim();

                // Check if user with phone already exists
                if (await _context.ApplicationUsers.AnyAsync(u => u.PhoneNumber == phone || u.Username == phone))
                {
                    return BadRequest(new { message = $"Phone number '{phone}' is already registered." });
                }

                var newUser = new ApplicationUser
                {
                    Username = phone,
                    FullName = dto.Name,
                    PhoneNumber = phone,
                    HouseName = string.IsNullOrWhiteSpace(dto.Address) ? "Akshaya Ward" : dto.Address,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Sahayi@123"),
                    IsPasswordChanged = false,
                    RoleId = 5, // General Member
                    UnitId = targetUnitId,
                    JoinedDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.ApplicationUsers.Add(newUser);
                await _context.SaveChangesAsync();

                // Add initial savings transaction if savings amount provided
                if (dto.Savings > 0)
                {
                    var savingsTx = new SavingsTransaction
                    {
                        UserId = newUser.UserId,
                        UnitId = targetUnitId,
                        Amount = dto.Savings,
                        TransactionDate = DateTime.UtcNow,
                        ReceiptNumber = $"REC-{DateTime.UtcNow.Ticks.ToString()[^8..]}",
                        RecordedBy = newUser.UserId
                    };
                    _context.SavingsTransactions.Add(savingsTx);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"New member {newUser.FullName} registered successfully!",
                    user = new
                    {
                        userId = newUser.UserId,
                        name = newUser.FullName,
                        memberId = dto.MemberId,
                        phone = newUser.PhoneNumber,
                        amount = dto.Savings.ToString("0.00")
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to register member.", details = ex.Message });
            }
        }

        // POST: api/secretary/meetings
        [HttpPost("meetings")]
        public async Task<IActionResult> ScheduleMeeting([FromBody] CreateSecretaryMeetingDto dto, [FromQuery] int? unitId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                int targetUnitId = unitId ?? 0;
                if (targetUnitId == 0)
                {
                    var unit = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.IsActive);
                    if (unit == null) return BadRequest(new { message = "No active unit found." });
                    targetUnitId = unit.UnitId;
                }

                var secretary = await _context.ApplicationUsers
                    .FirstOrDefaultAsync(u => u.UnitId == targetUnitId && u.RoleId == 3);

                var meeting = new Meeting
                {
                    UnitId = targetUnitId,
                    MeetingDate = DateTime.TryParse(dto.Date, out var parsedDate) ? parsedDate : DateTime.UtcNow.AddDays(7),
                    Venue = dto.Location,
                    MinutesOfMeeting = dto.Title,
                    CreatedBy = secretary?.UserId ?? 0
                };

                _context.Meetings.Add(meeting);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Meeting '{meeting.MinutesOfMeeting}' scheduled successfully!",
                    meeting = new
                    {
                        id = meeting.MeetingId,
                        title = meeting.MinutesOfMeeting,
                        tag = dto.Tag,
                        tagType = dto.Tag == "NEXT WEEK" ? "dark" : "peach",
                        time = dto.Time,
                        location = meeting.Venue
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to schedule meeting.", details = ex.Message });
            }
        }

        // DELETE: api/secretary/meetings/{id}
        [HttpDelete("meetings/{id}")]
        public async Task<IActionResult> DeleteMeeting(int id)
        {
            try
            {
                var meeting = await _context.Meetings.FindAsync(id);
                if (meeting != null)
                {
                    _context.Meetings.Remove(meeting);
                    await _context.SaveChangesAsync();
                }
                return Ok(new { message = "Meeting deleted successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete meeting.", details = ex.Message });
            }
        }

        // POST: api/secretary/savings/record
        [HttpPost("savings/record")]
        public async Task<IActionResult> RecordSavings([FromBody] RecordSecretarySavingsDto dto, [FromQuery] int? unitId)
        {
            try
            {
                int targetUnitId = unitId ?? 0;
                if (targetUnitId == 0)
                {
                    var user = await _context.ApplicationUsers.FindAsync(dto.UserId);
                    if (user?.UnitId != null) targetUnitId = user.UnitId.Value;
                }

                var savingsTx = new SavingsTransaction
                {
                    UserId = dto.UserId,
                    UnitId = targetUnitId,
                    Amount = dto.Amount > 0 ? dto.Amount : 100,
                    TransactionDate = DateTime.UtcNow,
                    ReceiptNumber = $"REC-{DateTime.UtcNow.Ticks.ToString()[^8..]}",
                    RecordedBy = dto.UserId
                };

                _context.SavingsTransactions.Add(savingsTx);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Weekly savings recorded successfully!", transactionId = savingsTx.TransactionId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to record savings.", details = ex.Message });
            }
        }

        // POST: api/secretary/loans/{loanId}/verify
        [HttpPost("loans/{loanId}/verify")]
        public async Task<IActionResult> VerifyAndForwardLoan(int loanId)
        {
            try
            {
                var loan = await _context.LoanApplications.FindAsync(loanId);
                if (loan != null)
                {
                    loan.Status = "ForwardedToPresident";
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Loan application endorsed and forwarded to President successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to forward loan application.", details = ex.Message });
            }
        }

        // POST: api/secretary/attendance
        [HttpPost("attendance")]
        public async Task<IActionResult> SaveAttendance([FromBody] RecordSecretaryAttendanceDto dto)
        {
            try
            {
                if (dto.Attendances != null && dto.Attendances.Any())
                {
                    foreach (var att in dto.Attendances)
                    {
                        var entry = new Attendance
                        {
                            MeetingId = dto.MeetingId > 0 ? dto.MeetingId : 1,
                            UserId = att.UserId,
                            IsPresent = att.IsPresent,
                            MarkedAt = DateTime.UtcNow
                        };
                        _context.Attendances.Add(entry);
                    }
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Attendance recorded successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to record attendance.", details = ex.Message });
            }
        }
    }
}
