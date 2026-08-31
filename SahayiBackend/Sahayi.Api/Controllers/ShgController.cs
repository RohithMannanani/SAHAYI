using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.DTOs;
using Sahayi.Api.Entities;
using Sahayi.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sahayi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShgController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PdfGeneratorService _pdfService;

        public ShgController(ApplicationDbContext context)
        {
            _context = context;
            _pdfService = new PdfGeneratorService();
        }

        [HttpGet("wards")]
        public async Task<IActionResult> GetWards()
        {
            try
            {
                var wards = await _context.PanchayathWards
                    .OrderBy(w => w.WardNumber)
                    .Select(w => new { w.WardId, w.WardNumber, w.WardName })
                    .ToListAsync();
                return Ok(wards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving wards list.", details = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUnit([FromBody] RegisterUnitDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Fetch Ward details
                var ward = await _context.PanchayathWards.FindAsync(dto.WardId);
                if (ward == null)
                {
                    return BadRequest(new { message = $"Ward ID {dto.WardId} does not exist." });
                }

                // 2. Check if Unit Name already exists in this Ward
                if (await _context.AyalkoottamUnits.AnyAsync(u => u.UnitName.ToLower() == dto.UnitName.ToLower() && u.WardId == dto.WardId))
                {
                    return BadRequest(new { message = "An Ayalkoottam unit with this name already exists in this Ward." });
                }

                // 3. Check if Account Number already exists
                if (await _context.AyalkoottamUnits.AnyAsync(u => u.AccountNumber == dto.AccountNumber))
                {
                    return BadRequest(new { message = "This bank account number is already linked to another unit." });
                }

                // 4. Create and add the Unit entity
                var unit = new AyalkoottamUnit
                {
                    UnitName = dto.UnitName,
                    WardId = dto.WardId,
                    AccountNumber = dto.AccountNumber,
                    BankName = dto.BankName,
                    IFSCCode = dto.IFSCCode,
                    AccountBalance = dto.AccountBalance,
                    CreatedDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.AyalkoottamUnits.Add(unit);
                await _context.SaveChangesAsync();

                // Create associated UnitBankAccount record with real bank details and initial balance
                var unitBankAccount = new UnitBankAccount
                {
                    UnitId = unit.UnitId,
                    AccountNumber = unit.AccountNumber,
                    BankName = unit.BankName,
                    IFSCCode = unit.IFSCCode,
                    Balance = dto.AccountBalance,
                    LastUpdated = DateTime.UtcNow
                };
                _context.UnitBankAccounts.Add(unitBankAccount);

                // 5. Create members & credentials
                var createdUsers = new List<ApplicationUser>();
                var pdfMembers = new List<MemberCredentialInfo>();

                foreach (var mDto in dto.Members)
                {
                    // Check if phone number is already registered
                    if (await _context.ApplicationUsers.AnyAsync(u => u.PhoneNumber == mDto.PhoneNumber || u.Username == mDto.PhoneNumber))
                    {
                        return BadRequest(new { message = $"Phone number '{mDto.PhoneNumber}' is already registered to a user in the system." });
                    }

                    var user = new ApplicationUser
                    {
                        Username = mDto.PhoneNumber,
                        FullName = mDto.FullName,
                        PhoneNumber = mDto.PhoneNumber,
                        HouseName = mDto.HouseName,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.DefaultPassword),
                        IsPasswordChanged = false, // Set to false to force password change on first login
                        RoleId = mDto.RoleId,
                        UnitId = unit.UnitId,
                        JoinedDate = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.ApplicationUsers.Add(user);
                    createdUsers.Add(user);

                    string roleName = mDto.RoleId switch
                    {
                        2 => "President",
                        3 => "Secretary",
                        4 => "Treasurer",
                        _ => "Member"
                    };

                    pdfMembers.Add(new MemberCredentialInfo
                    {
                        FullName = mDto.FullName,
                        PhoneNumber = mDto.PhoneNumber,
                        Role = roleName,
                        CommonPassword = dto.DefaultPassword
                    });
                }

                // 6. Save unit and users to the database
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 7. Generate Credentials PDF Blob & store in folder
                var pdfBytes = _pdfService.GenerateCredentialsPdf(dto.UnitName, ward.WardNumber, pdfMembers);

                try
                {
                    var receiptsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "receipts");
                    if (!Directory.Exists(receiptsFolder))
                    {
                        Directory.CreateDirectory(receiptsFolder);
                    }
                    var filePath = Path.Combine(receiptsFolder, $"unit_{unit.UnitId}_receipt.pdf");
                    await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
                }
                catch (Exception saveEx)
                {
                    Console.WriteLine($"Warning: Could not save receipt PDF to disk: {saveEx.Message}");
                }

                return File(pdfBytes, "application/pdf", $"{dto.UnitName.Replace(" ", "_")}_receipt.pdf");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Error saving unit to database.", details = ex.Message });
            }
        }

        [HttpGet("{id}/receipt")]
        public async Task<IActionResult> GetUnitReceipt(int id)
        {
            try
            {
                var unit = await _context.AyalkoottamUnits
                    .Include(u => u.Ward)
                    .Include(u => u.Users)
                        .ThenInclude(u => u.UserRole)
                    .FirstOrDefaultAsync(u => u.UnitId == id);

                if (unit == null)
                    return NotFound(new { message = "Ayalkoottam unit not found." });

                var receiptsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "receipts");
                if (!Directory.Exists(receiptsFolder))
                {
                    Directory.CreateDirectory(receiptsFolder);
                }

                var fileName = $"unit_{id}_receipt.pdf";
                var filePath = Path.Combine(receiptsFolder, fileName);

                byte[] pdfBytes;

                if (System.IO.File.Exists(filePath))
                {
                    pdfBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                }
                else
                {
                    // Dynamically generate PDF if not already present in folder
                    var pdfMembers = unit.Users.Select(m => new MemberCredentialInfo
                    {
                        FullName = m.FullName,
                        PhoneNumber = m.PhoneNumber,
                        Role = m.UserRole != null ? m.UserRole.RoleName : (m.RoleId == 2 ? "President" : m.RoleId == 3 ? "Secretary" : m.RoleId == 4 ? "Treasurer" : "Member"),
                        CommonPassword = "Set on Registration"
                    }).ToList();

                    int wardNum = unit.Ward != null ? unit.Ward.WardNumber : 1;
                    pdfBytes = _pdfService.GenerateCredentialsPdf(unit.UnitName, wardNum, pdfMembers);

                    // Save to folder for future requests
                    await System.IO.File.WriteAllBytesAsync(filePath, pdfBytes);
                }

                var downloadFileName = $"{unit.UnitName.Replace(" ", "_")}_receipt.pdf";
                return File(pdfBytes, "application/pdf", downloadFileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving unit receipt.", details = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUnits()
        {
            try
            {
                var units = await _context.AyalkoottamUnits
                    .Include(u => u.Ward)
                    .Include(u => u.Users)
                        .ThenInclude(u => u.UserRole)
                    .OrderByDescending(u => u.CreatedDate)
                    .Select(u => new
                    {
                        id = u.UnitId,
                        name = u.UnitName,
                        ward = u.Ward != null ? $"Ward {u.Ward.WardNumber}, {u.Ward.WardName}" : string.Empty,
                        wardId = u.WardId,
                        accountNumber = u.AccountNumber,
                        bankName = u.BankName,
                        ifscCode = u.IFSCCode,
                        accountBalance = u.AccountBalance,
                        formationDate = u.CreatedDate.ToString("yyyy-MM-dd"),
                        contact = u.PrimaryContactPhone,
                        members = u.Users.Count,
                        status = u.IsActive ? "Active" : "Inactive",
                        lastAudit = "New Registration",
                        savings = (double)(u.AccountBalance / 100000.0m),
                        membersList = u.Users.Select(m => new
                        {
                            id = m.UserId,
                            name = m.FullName,
                            phone = m.PhoneNumber,
                            houseName = m.HouseName,
                            roleId = m.RoleId,
                            role = m.UserRole != null ? m.UserRole.RoleName : (m.RoleId == 2 ? "President" : m.RoleId == 3 ? "Secretary" : m.RoleId == 4 ? "Treasurer" : "Member")
                        })
                    })
                    .ToListAsync();
                return Ok(units);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving units list.", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUnitById(int id)
        {
            try
            {
                var unit = await _context.AyalkoottamUnits
                    .Include(u => u.Ward)
                    .Include(u => u.Users)
                        .ThenInclude(u => u.UserRole)
                    .FirstOrDefaultAsync(u => u.UnitId == id);

                if (unit == null)
                    return NotFound(new { message = "Ayalkoottam unit not found." });

                return Ok(new
                {
                    id = unit.UnitId,
                    name = unit.UnitName,
                    ward = unit.Ward != null ? $"Ward {unit.Ward.WardNumber}, {unit.Ward.WardName}" : string.Empty,
                    wardId = unit.WardId,
                    accountNumber = unit.AccountNumber,
                    bankName = unit.BankName,
                    ifscCode = unit.IFSCCode,
                    accountBalance = unit.AccountBalance,
                    formationDate = unit.CreatedDate.ToString("yyyy-MM-dd"),
                    contact = unit.PrimaryContactPhone,
                    members = unit.Users.Count,
                    status = unit.IsActive ? "Active" : "Inactive",
                    lastAudit = "New Registration",
                    savings = (double)(unit.AccountBalance / 100000.0m),
                    membersList = unit.Users.Select(m => new
                    {
                        id = m.UserId,
                        name = m.FullName,
                        phone = m.PhoneNumber,
                        houseName = m.HouseName,
                        roleId = m.RoleId,
                        role = m.UserRole != null ? m.UserRole.RoleName : (m.RoleId == 2 ? "President" : m.RoleId == 3 ? "Secretary" : m.RoleId == 4 ? "Treasurer" : "Member")
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving unit details.", details = ex.Message });
            }
        }

        [HttpPost("{id}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleStatusDto dto)
        {
            try
            {
                var unit = await _context.AyalkoottamUnits
                    .Include(u => u.Users)
                    .FirstOrDefaultAsync(u => u.UnitId == id);

                if (unit == null)
                {
                    return NotFound(new { message = "Ayalkoottam unit not found." });
                }

                unit.IsActive = dto.IsActive;

                // Cascade: activate or deactivate all members of this unit
                foreach (var member in unit.Users)
                {
                    member.IsActive = dto.IsActive;
                }

                await _context.SaveChangesAsync();

                var statusLabel = unit.IsActive ? "Active" : "Inactive";
                return Ok(new
                {
                    message = $"Unit and its {unit.Users.Count} member(s) updated to {statusLabel} successfully.",
                    unitId = id,
                    isActive = unit.IsActive,
                    membersUpdated = unit.Users.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating unit status.", details = ex.Message });
            }
        }

        [HttpGet("cds-analytics")]
        public async Task<IActionResult> GetCdsAnalytics([FromQuery] int? wardId)
        {
            try
            {
                var unitsQuery = _context.AyalkoottamUnits
                    .Include(u => u.Ward)
                    .Include(u => u.Users)
                    .AsQueryable();

                if (wardId.HasValue && wardId.Value > 0)
                {
                    unitsQuery = unitsQuery.Where(u => u.WardId == wardId.Value);
                }

                var units = await unitsQuery.OrderBy(u => u.WardId).ThenBy(u => u.UnitName).ToListAsync();

                var unitBankAccounts = await _context.UnitBankAccounts.ToListAsync();
                var savingsTransactions = await _context.SavingsTransactions.ToListAsync();
                var loanApplications = await _context.LoanApplications
                    .Include(l => l.LoanRepayments)
                    .ToListAsync();
                var meetings = await _context.Meetings
                    .Include(m => m.Attendances)
                    .ToListAsync();

                var unitAnalytics = units.Select(unit =>
                {
                    var bankAcc = unitBankAccounts.FirstOrDefault(b => b.UnitId == unit.UnitId);
                    decimal bankBalance = bankAcc?.Balance ?? unit.AccountBalance;

                    var unitSavingsTxns = savingsTransactions.Where(s => s.UnitId == unit.UnitId).ToList();
                    decimal savingsCollected = unitSavingsTxns.Sum(s => s.Amount);
                    decimal totalSavings = bankBalance + savingsCollected;
                    double savingsLakhs = (double)(totalSavings / 100000.0m);

                    var unitLoans = loanApplications.Where(l => l.UnitId == unit.UnitId).ToList();
                    decimal loansDisbursed = unitLoans
                        .Where(l => l.Status == "Approved" || l.Status == "Disbursed" || l.Status == "Active" || l.Status == "Closed" || l.Status == "Endorsed")
                        .Sum(l => l.AmountRequested);
                    decimal loanRepayments = unitLoans
                        .SelectMany(l => l.LoanRepayments ?? new List<LoanRepayment>())
                        .Sum(r => r.AmountPaid);
                    decimal outstandingBalance = Math.Max(0m, loansDisbursed - loanRepayments);

                    var unitMeetings = meetings.Where(m => m.UnitId == unit.UnitId).ToList();
                    int totalMeetings = unitMeetings.Count;
                    int completedMeetings = unitMeetings.Count(m => m.IsCompleted);

                    var attendances = unitMeetings.SelectMany(m => m.Attendances ?? new List<Attendance>()).ToList();
                    int totalAttendance = attendances.Count;
                    int present = attendances.Count(a => a.IsPresent);
                    int absent = attendances.Count(a => !a.IsPresent);
                    int late = 0;
                    double attendanceRate = totalAttendance > 0 ? Math.Round((present * 100.0) / totalAttendance, 1) : 0.0;

                    var lastMeeting = unitMeetings.OrderByDescending(m => m.MeetingDate).FirstOrDefault();

                    return new
                    {
                        unitId = unit.UnitId,
                        unitName = unit.UnitName,
                        wardId = unit.WardId,
                        wardNumber = unit.Ward != null ? unit.Ward.WardNumber : 0,
                        wardName = unit.Ward != null ? unit.Ward.WardName : "Unknown Ward",
                        wardFormatted = unit.Ward != null ? $"Ward {unit.Ward.WardNumber}, {unit.Ward.WardName}" : "N/A",
                        isActive = unit.IsActive,
                        status = unit.IsActive ? "Active" : "Inactive",
                        accountNumber = unit.AccountNumber,
                        bankName = unit.BankName,
                        ifscCode = unit.IFSCCode,
                        memberCount = unit.Users.Count,
                        bankBalance = bankBalance,
                        savingsCollected = savingsCollected,
                        totalSavings = totalSavings,
                        savingsLakhs = Math.Round(savingsLakhs, 2),
                        loansDisbursed = loansDisbursed,
                        loanRepayments = loanRepayments,
                        outstandingBalance = outstandingBalance,
                        totalMeetings = totalMeetings,
                        completedMeetings = completedMeetings,
                        totalAttendanceRecords = totalAttendance,
                        presentCount = present,
                        lateCount = late,
                        absentCount = absent,
                        attendanceRate = attendanceRate,
                        lastMeetingDate = lastMeeting != null ? lastMeeting.MeetingDate.ToString("yyyy-MM-dd") : "No Meetings Yet"
                    };
                }).ToList();

                int totalUnits = unitAnalytics.Count;
                int activeUnits = unitAnalytics.Count(u => u.isActive);
                int totalMembers = unitAnalytics.Sum(u => u.memberCount);

                decimal cdsBankBalance = unitAnalytics.Sum(u => u.bankBalance);
                decimal cdsSavingsCollected = unitAnalytics.Sum(u => u.savingsCollected);
                decimal cdsTotalSavings = unitAnalytics.Sum(u => u.totalSavings);
                double cdsSavingsLakhs = Math.Round((double)(cdsTotalSavings / 100000.0m), 2);

                decimal cdsLoansDisbursed = unitAnalytics.Sum(u => u.loansDisbursed);
                decimal cdsLoanRepayments = unitAnalytics.Sum(u => u.loanRepayments);
                decimal cdsOutstandingBalance = unitAnalytics.Sum(u => u.outstandingBalance);

                int cdsTotalMeetings = unitAnalytics.Sum(u => u.totalMeetings);
                int cdsCompletedMeetings = unitAnalytics.Sum(u => u.completedMeetings);
                int cdsTotalAttendance = unitAnalytics.Sum(u => u.totalAttendanceRecords);
                int cdsPresent = unitAnalytics.Sum(u => u.presentCount);
                int cdsLate = unitAnalytics.Sum(u => u.lateCount);
                int cdsAbsent = unitAnalytics.Sum(u => u.absentCount);
                double cdsOverallAttendanceRate = cdsTotalAttendance > 0
                    ? Math.Round(((cdsPresent + cdsLate) * 100.0) / cdsTotalAttendance, 1)
                    : 0.0;

                var wardSummaries = unitAnalytics
                    .GroupBy(u => new { u.wardId, u.wardNumber, u.wardName })
                    .Select(g => new
                    {
                        wardId = g.Key.wardId,
                        wardNumber = g.Key.wardNumber,
                        wardName = g.Key.wardName,
                        wardFormatted = $"Ward {g.Key.wardNumber}, {g.Key.wardName}",
                        unitCount = g.Count(),
                        memberCount = g.Sum(u => u.memberCount),
                        totalSavings = g.Sum(u => u.totalSavings),
                        savingsLakhs = Math.Round((double)(g.Sum(u => u.totalSavings) / 100000.0m), 2),
                        loansDisbursed = g.Sum(u => u.loansDisbursed),
                        totalMeetings = g.Sum(u => u.totalMeetings),
                        attendanceRate = g.Sum(u => u.totalAttendanceRecords) > 0
                            ? Math.Round(((g.Sum(u => u.presentCount) + g.Sum(u => u.lateCount)) * 100.0) / g.Sum(u => u.totalAttendanceRecords), 1)
                            : 0.0
                    })
                    .OrderBy(w => w.wardNumber)
                    .ToList();

                return Ok(new
                {
                    overall = new
                    {
                        totalUnits,
                        activeUnits,
                        totalMembers,
                        cdsBankBalance,
                        cdsSavingsCollected,
                        cdsTotalSavings,
                        cdsSavingsLakhs,
                        cdsLoansDisbursed,
                        cdsLoanRepayments,
                        cdsOutstandingBalance,
                        cdsTotalMeetings,
                        cdsCompletedMeetings,
                        cdsTotalAttendance,
                        cdsPresent,
                        cdsLate,
                        cdsAbsent,
                        cdsOverallAttendanceRate
                    },
                    units = unitAnalytics,
                    wards = wardSummaries
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving CDS analytics.", details = ex.Message });
            }
        }
    }

    public class ToggleStatusDto
    {
        public bool IsActive { get; set; }
    }
}
