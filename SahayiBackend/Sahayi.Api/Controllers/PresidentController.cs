using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.Dtos;
using Sahayi.Api.Entities;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Sahayi.Api.Controllers
{
    [Authorize(Roles = "President,Treasurer,Secretary")]
    [ApiController]
    [Route("api/[controller]")]
    public class PresidentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PresidentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/president/monitor-loans
        [HttpGet("monitor-loans")]
        public async Task<IActionResult> MonitorLoans()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var user = await _context.ApplicationUsers.FindAsync(currentUserId);
                if (user == null)
                    return NotFound(new { message = "User not found." });

                var loans = await _context.LoanApplications
                    .Include(l => l.User)
                    .Include(l => l.Approver)
                    .Include(l => l.LoanRepayments)
                    .Where(l => l.UnitId == user.UnitId)
                    .OrderByDescending(l => l.AppliedDate)
                    .ToListAsync();

                var dtos = loans.Select(l =>
                {
                    decimal totalPrincipalPaid = l.LoanRepayments.Sum(r => r.PrincipalComponent);
                    decimal totalInterestPaid = l.LoanRepayments.Sum(r => r.InterestComponent);
                    decimal outstandingBalance = l.AmountRequested - totalPrincipalPaid;

                    return new LoanSummaryDto
                    {
                        LoanId = l.LoanId,
                        UserId = l.UserId,
                        MemberName = l.User?.FullName ?? "Unknown",
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
                        OutstandingBalance = outstandingBalance
                    };
                }).ToList();

                var summary = new
                {
                    TotalLoans = dtos.Count,
                    TotalDisbursed = dtos.Where(d => d.Status == "Disbursed" || d.Status == "Closed").Sum(d => d.AmountRequested),
                    TotalOutstandingBalance = dtos.Where(d => d.Status == "Disbursed").Sum(d => d.OutstandingBalance),
                    TotalInterestCollected = dtos.Sum(d => d.TotalInterestPaid),
                    StatusBreakdown = dtos.GroupBy(d => d.Status).ToDictionary(g => g.Key, g => g.Count()),
                    Loans = dtos
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch loans for monitoring.", details = ex.Message });
            }
        }

        // GET: api/president/pending-loans
        [HttpGet("pending-loans")]
        public async Task<IActionResult> GetPendingLoans()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var user = await _context.ApplicationUsers.FindAsync(currentUserId);
                if (user == null)
                    return NotFound(new { message = "User not found." });

                var pendingLoans = await _context.LoanApplications
                    .Include(l => l.User)
                    .Where(l => l.UnitId == user.UnitId && l.Status == "Pending")
                    .OrderBy(l => l.AppliedDate)
                    .ToListAsync();

                var dtos = pendingLoans.Select(l => new LoanSummaryDto
                {
                    LoanId = l.LoanId,
                    UserId = l.UserId,
                    MemberName = l.User?.FullName ?? "Unknown",
                    AmountRequested = l.AmountRequested,
                    Purpose = l.Purpose,
                    TenureMonths = l.TenureMonths,
                    InterestRate = l.InterestRate,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch pending loans.", details = ex.Message });
            }
        }

        // POST: api/president/review-loan/{loanId}
        [HttpPost("review-loan/{loanId}")]
        public async Task<IActionResult> ReviewLoan(int loanId, [FromBody] LoanReviewDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var user = await _context.ApplicationUsers.FindAsync(currentUserId);
                if (user == null)
                    return NotFound(new { message = "User not found." });

                var loan = await _context.LoanApplications.FindAsync(loanId);
                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.Status != "Pending")
                    return BadRequest(new { message = $"Loan is already {loan.Status}." });

                if (loan.UnitId != user.UnitId)
                    return BadRequest(new { message = "Unauthorized to review loan for another unit." });

                loan.Status = dto.Status;
                loan.ApprovedBy = currentUserId;

                await _context.SaveChangesAsync();

                return Ok(new { message = $"Loan {dto.Status} successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to review loan.", details = ex.Message });
            }
        }

        // GET: api/president/pending-secretary-loans
        [HttpGet("pending-secretary-loans")]
        public async Task<IActionResult> GetPendingSecretaryLoans()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var user = await _context.ApplicationUsers.FindAsync(currentUserId);
                if (user == null)
                    return NotFound(new { message = "User not found." });

                // Find officer user IDs (Secretary & Treasurer) for this unit
                var officerUserIds = await _context.ApplicationUsers
                    .Where(u => u.UnitId == user.UnitId && (u.RoleId == 3 || u.RoleId == 4 || (u.UserRole != null && (u.UserRole.RoleName == "Secretary" || u.UserRole.RoleName == "Treasurer"))))
                    .Select(u => u.UserId)
                    .ToListAsync();

                if (!officerUserIds.Any())
                    return Ok(new object[] { });

                var pendingLoans = await _context.LoanApplications
                    .Include(l => l.User)
                    .Where(l => l.UnitId == user.UnitId && officerUserIds.Contains(l.UserId) && l.Status == "Pending")
                    .OrderBy(l => l.AppliedDate)
                    .ToListAsync();

                var dtos = pendingLoans.Select(l => new LoanSummaryDto
                {
                    LoanId = l.LoanId,
                    UserId = l.UserId,
                    MemberName = l.User?.FullName ?? "Unknown",
                    AmountRequested = l.AmountRequested,
                    Purpose = l.Purpose,
                    TenureMonths = l.TenureMonths,
                    InterestRate = l.InterestRate,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch pending officer loans.", details = ex.Message });
            }
        }

        // POST: api/president/review-secretary-loan/{loanId}
        [HttpPost("review-secretary-loan/{loanId}")]
        public async Task<IActionResult> ReviewSecretaryLoan(int loanId, [FromBody] LoanReviewDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var user = await _context.ApplicationUsers.FindAsync(currentUserId);
                if (user == null)
                    return NotFound(new { message = "User not found." });

                var loan = await _context.LoanApplications.FindAsync(loanId);
                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.Status != "Pending")
                    return BadRequest(new { message = $"Loan is already {loan.Status}." });

                loan.Status = dto.Status;
                loan.ApprovedBy = currentUserId;

                await _context.SaveChangesAsync();

                return Ok(new { message = $"Officer loan {dto.Status} successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to review officer loan.", details = ex.Message });
            }
        }
    }
}
