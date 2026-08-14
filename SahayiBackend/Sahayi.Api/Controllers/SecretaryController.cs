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
                    .ToListAsync();

                DateTime currentWeekStart = DateTime.UtcNow.AddDays(-6);

                var savingsLogs = unitUsers.Select((u, index) =>
                {
                    // Check if member has paid within current week window (last 6-7 days)
                    var userTx = savingsList.FirstOrDefault(s => s.UserId == u.UserId && s.TransactionDate >= currentWeekStart);
                    if (userTx != null)
                    {
                        return new SecretarySavingsItemDto
                        {
                            Id = userTx.TransactionId,
                            UserId = u.UserId,
                            Name = u.FullName,
                            MemberId = $"AK-{(index + 1):D3}",
                            Amount = userTx.Amount.ToString("0.00"),
                            Status = "Paid",
                            PaymentMode = string.IsNullOrEmpty(userTx.PaymentMode) ? "Cash" : userTx.PaymentMode,
                            Date = userTx.TransactionDate.ToString("yyyy-MM-dd")
                        };
                    }
                    else
                    {
                        return new SecretarySavingsItemDto
                        {
                            Id = u.UserId > 0 ? u.UserId : (index + 1),
                            UserId = u.UserId,
                            Name = u.FullName,
                            MemberId = $"AK-{(index + 1):D3}",
                            Amount = "0.00",
                            Status = "Pending",
                            PaymentMode = "-",
                            Date = DateTime.UtcNow.ToString("yyyy-MM-dd")
                        };
                    }
                }).ToList();

                var allSavingsLogs = savingsList.Select(s => new SecretarySavingsItemDto
                {
                    Id = s.TransactionId,
                    UserId = s.UserId,
                    Name = s.User?.FullName ?? "Unit Member",
                    MemberId = $"AK-{s.UserId:D3}",
                    Amount = s.Amount.ToString("0.00"),
                    Status = "Paid",
                    PaymentMode = string.IsNullOrEmpty(s.PaymentMode) ? "Cash" : s.PaymentMode,
                    Date = s.TransactionDate.ToString("yyyy-MM-dd")
                }).ToList();

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
                        Tag = m.IsCompleted ? "COMPLETED" : (m.MeetingDate > DateTime.UtcNow ? "UPCOMING" : "NEXT WEEK"),
                        TagType = m.IsCompleted ? "peach" : (idx % 2 == 0 ? "dark" : "peach"),
                        Date = m.MeetingDate.ToString("yyyy-MM-dd"),
                        Time = !string.IsNullOrWhiteSpace(m.MeetingTime) ? m.MeetingTime : m.MeetingDate.ToString("hh:mm tt"),
                        Location = m.Venue,
                        IsCompleted = m.IsCompleted,
                        CompletedDate = m.CompletedDate.HasValue ? m.CompletedDate.Value.ToString("yyyy-MM-dd HH:mm") : null
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

                // Fetch Unit Bank Account Details & Sync with Online / Bank Deposited Transactions
                var bankAccount = await _context.UnitBankAccounts.FirstOrDefaultAsync(b => b.UnitId == targetUnitId);

                decimal onlineAndDepositedTotal = await _context.SavingsTransactions
                    .Where(s => s.UnitId == targetUnitId && (s.PaymentMode == "Online" || s.PaymentMode.Contains("Bank Deposited")))
                    .SumAsync(s => (decimal?)s.Amount) ?? 0.00m;

                string accNum = !string.IsNullOrWhiteSpace(unit?.AccountNumber) ? unit.AccountNumber : $"SB-UNIT-{targetUnitId:D4}";
                string bankName = !string.IsNullOrWhiteSpace(unit?.BankName) ? unit.BankName : "Sahayi Co-operative Bank";
                string ifsc = !string.IsNullOrWhiteSpace(unit?.IFSCCode) ? unit.IFSCCode : "SHY0001001";

                if (bankAccount == null)
                {
                    bankAccount = new UnitBankAccount
                    {
                        UnitId = targetUnitId,
                        AccountNumber = accNum,
                        BankName = bankName,
                        IFSCCode = ifsc,
                        Balance = onlineAndDepositedTotal,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.UnitBankAccounts.Add(bankAccount);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    bool needSave = false;
                    if (bankAccount.Balance < onlineAndDepositedTotal)
                    {
                        bankAccount.Balance = onlineAndDepositedTotal;
                        needSave = true;
                    }
                    if (!string.IsNullOrWhiteSpace(unit?.BankName) && bankAccount.BankName != unit.BankName)
                    {
                        bankAccount.BankName = unit.BankName;
                        needSave = true;
                    }
                    if (!string.IsNullOrWhiteSpace(unit?.AccountNumber) && bankAccount.AccountNumber != unit.AccountNumber)
                    {
                        bankAccount.AccountNumber = unit.AccountNumber;
                        needSave = true;
                    }
                    if (needSave)
                    {
                        bankAccount.LastUpdated = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                var bankAccountDto = new UnitBankAccountDto
                {
                    BankAccountId = bankAccount.BankAccountId,
                    UnitId = bankAccount.UnitId,
                    AccountNumber = bankAccount.AccountNumber,
                    BankName = bankAccount.BankName,
                    IFSCCode = bankAccount.IFSCCode,
                    Balance = bankAccount.Balance,
                    LastUpdated = bankAccount.LastUpdated
                };

                var dto = new SecretaryDashboardDto
                {
                    UnitId = targetUnitId,
                    UnitName = unit.UnitName,
                    SecretaryName = secretaryUser?.FullName ?? "Unit Secretary",
                    SecretaryPhone = secretaryUser?.PhoneNumber ?? "",
                    TotalWeeklyCollection = totalCollection,
                    DisbursedLoansTotal = disbursedTotal,
                    PendingDuesCount = pendingDuesCount,
                    BankAccount = bankAccountDto,
                    SavingsLogs = savingsLogs,
                    AllSavingsLogs = allSavingsLogs,
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
                    MeetingTime = string.IsNullOrWhiteSpace(dto.Time) ? "10:00 AM" : dto.Time,
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

        // PUT: api/secretary/meetings/{id}
        [HttpPut("meetings/{id}")]
        public async Task<IActionResult> UpdateMeeting(int id, [FromBody] UpdateSecretaryMeetingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var meeting = await _context.Meetings.FindAsync(id);
                if (meeting == null)
                    return NotFound(new { message = "Meeting not found." });

                if (!string.IsNullOrWhiteSpace(dto.Title))
                    meeting.MinutesOfMeeting = dto.Title;

                if (!string.IsNullOrWhiteSpace(dto.Location))
                    meeting.Venue = dto.Location;

                if (!string.IsNullOrWhiteSpace(dto.Time))
                    meeting.MeetingTime = dto.Time;

                if (DateTime.TryParse(dto.Date, out var parsedDate))
                {
                    meeting.MeetingDate = parsedDate;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Meeting details updated successfully!",
                    meeting = new
                    {
                        id = meeting.MeetingId,
                        title = meeting.MinutesOfMeeting,
                        tag = dto.Tag ?? "NEXT WEEK",
                        tagType = dto.Tag == "NEXT WEEK" ? "dark" : "peach",
                        date = meeting.MeetingDate.ToString("yyyy-MM-dd"),
                        time = string.IsNullOrWhiteSpace(dto.Time) ? meeting.MeetingDate.ToString("hh:mm tt") : dto.Time,
                        location = meeting.Venue,
                        isCompleted = meeting.IsCompleted,
                        completedDate = meeting.CompletedDate.HasValue ? meeting.CompletedDate.Value.ToString("yyyy-MM-dd HH:mm") : null
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update meeting.", details = ex.Message });
            }
        }

        // POST: api/secretary/meetings/{id}/complete
        [HttpPost("meetings/{id}/complete")]
        [HttpPut("meetings/{id}/complete")]
        public async Task<IActionResult> MarkMeetingCompleted(int id)
        {
            try
            {
                var meeting = await _context.Meetings.FindAsync(id);
                if (meeting == null)
                    return NotFound(new { message = "Meeting not found." });

                meeting.IsCompleted = true;
                meeting.CompletedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Meeting '{meeting.MinutesOfMeeting}' marked as Completed!",
                    completedDate = meeting.CompletedDate.Value.ToString("yyyy-MM-dd HH:mm")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to mark meeting as completed.", details = ex.Message });
            }
        }

        // POST: api/secretary/savings/record
        [HttpPost("savings/record")]
        [HttpPost("savings/pay-cash")]
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

                if (dto.UserId > 0)
                {
                    var existingTx = await _context.SavingsTransactions
                        .FirstOrDefaultAsync(s => s.UserId == dto.UserId && s.TransactionDate >= DateTime.UtcNow.AddDays(-6));
                    if (existingTx != null)
                    {
                        return BadRequest(new { message = "Weekly savings deposit for this week has already been paid for this member!" });
                    }
                }

                var mode = !string.IsNullOrWhiteSpace(dto.PaymentMode)
                    ? dto.PaymentMode
                    : (!string.IsNullOrWhiteSpace(dto.PaymentMethod) ? dto.PaymentMethod : "Cash");

                var savingsTx = new SavingsTransaction
                {
                    UserId = dto.UserId,
                    UnitId = targetUnitId,
                    Amount = dto.Amount > 0 ? dto.Amount : 100,
                    PaymentMode = mode,
                    TransactionDate = DateTime.UtcNow,
                    ReceiptNumber = $"REC-{(mode.Equals("Online", StringComparison.OrdinalIgnoreCase) ? "RZP" : "CASH")}-{DateTime.UtcNow.Ticks.ToString()[^8..]}",
                    RecordedBy = dto.UserId
                };

                _context.SavingsTransactions.Add(savingsTx);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Weekly savings recorded successfully!", transactionId = savingsTx.TransactionId, status = "Paid" });
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

        // POST: api/secretary/clear-savings-data
        [HttpPost("clear-savings-data")]
        public async Task<IActionResult> ClearSavingsData()
        {
            try
            {
                _context.SavingsTransactions.RemoveRange(_context.SavingsTransactions);
                
                var bankAccounts = await _context.UnitBankAccounts.ToListAsync();
                foreach (var acc in bankAccounts)
                {
                    acc.Balance = 0.00m;
                    acc.LastUpdated = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "All savings transactions cleared and unit bank account balances reset to ₹0.00 successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to clear savings data.", details = ex.Message });
            }
        }
    }
}
