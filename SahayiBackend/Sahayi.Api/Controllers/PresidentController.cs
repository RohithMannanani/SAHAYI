using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sahayi.Api.Data;
using Sahayi.Api.Dtos;
using Sahayi.Api.Entities;
using Sahayi.Api.Helpers;
using Sahayi.Api.Services;
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
        private readonly ISmsService _smsService;
        private readonly ILogger<PresidentController> _logger;

        public PresidentController(ApplicationDbContext context, ISmsService smsService, ILogger<PresidentController> logger)
        {
            _context = context;
            _smsService = smsService;
            _logger = logger;
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
                    decimal fineAmount = LoanFineCalculator.CalculateFine(l);
                    decimal totalLoanAmount = l.AmountRequested + fineAmount;
                    decimal outstandingBalance = Math.Max(0m, totalLoanAmount - totalPrincipalPaid);

                    return new LoanSummaryDto
                    {
                        LoanId = l.LoanId,
                        UserId = l.UserId,
                        MemberName = l.User?.FullName ?? "Unknown",
                        PhoneNumber = l.User?.PhoneNumber,
                        AmountRequested = l.AmountRequested,
                        FineAmount = fineAmount,
                        TotalLoanAmount = totalLoanAmount,
                        Purpose = l.Purpose,
                        TenureMonths = l.TenureMonths,
                        InterestRate = l.InterestRate,
                        Status = l.Status,
                        AppliedDate = l.AppliedDate,
                        ApprovedByName = l.Approver?.FullName,
                        DisbursedDate = l.DisbursedDate,
                        RejectionReason = l.RejectionReason,
                        TotalPrincipalPaid = totalPrincipalPaid,
                        TotalInterestPaid = totalInterestPaid,
                        OutstandingBalance = outstandingBalance,
                        Repayments = l.LoanRepayments
                            .OrderByDescending(r => r.RepaymentDate)
                            .Select(r => new LoanRepaymentHistoryDto
                            {
                                RepaymentId = r.RepaymentId,
                                AmountPaid = r.AmountPaid,
                                PrincipalComponent = r.PrincipalComponent,
                                InterestComponent = r.InterestComponent,
                                RepaymentDate = r.RepaymentDate,
                                ReceiptNumber = r.ReceiptNumber ?? string.Empty,
                                RecordedByName = r.Recorder?.FullName ?? "Treasurer",
                                PaymentMode = r.PaymentMode ?? "Cash",
                                IsBankDeposited = (r.PaymentMode ?? "").Contains("Bank Deposited")
                            }).ToList()
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
                    PhoneNumber = l.User?.PhoneNumber,
                    AmountRequested = l.AmountRequested,
                    Purpose = l.Purpose,
                    TenureMonths = l.TenureMonths,
                    InterestRate = l.InterestRate,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate,
                    RejectionReason = l.RejectionReason
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

                var loan = await _context.LoanApplications
                    .Include(l => l.User)
                    .FirstOrDefaultAsync(l => l.LoanId == loanId);

                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.Status != "Pending")
                    return BadRequest(new { message = $"Loan is already {loan.Status}." });

                if (loan.UnitId != user.UnitId)
                    return BadRequest(new { message = "Unauthorized to review loan for another unit." });

                loan.Status = dto.Status;
                loan.ApprovedBy = currentUserId;

                bool smsDispatched = false;
                if (dto.Status == "Rejected")
                {
                    loan.RejectionReason = dto.Reason;

                    if (loan.User != null && !string.IsNullOrWhiteSpace(loan.User.PhoneNumber))
                    {
                        try
                        {
                            smsDispatched = await _smsService.SendLoanRejectionAsync(
                                loan.User.PhoneNumber,
                                loan.User.FullName,
                                loan.AmountRequested,
                                dto.Reason ?? "Not specified"
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to dispatch loan rejection SMS to {PhoneNumber}", loan.User.PhoneNumber);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                string responseMsg = dto.Status == "Rejected"
                    ? (smsDispatched 
                        ? $"Loan rejected successfully. Rejection SMS notification dispatched to {loan.User?.FullName ?? "applicant"}."
                        : "Loan rejected successfully and logged.")
                    : "Loan approved successfully.";

                return Ok(new { message = responseMsg, smsSent = smsDispatched });
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
                    PhoneNumber = l.User?.PhoneNumber,
                    AmountRequested = l.AmountRequested,
                    Purpose = l.Purpose,
                    TenureMonths = l.TenureMonths,
                    InterestRate = l.InterestRate,
                    Status = l.Status,
                    AppliedDate = l.AppliedDate,
                    RejectionReason = l.RejectionReason
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

                var loan = await _context.LoanApplications
                    .Include(l => l.User)
                    .FirstOrDefaultAsync(l => l.LoanId == loanId);

                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.Status != "Pending")
                    return BadRequest(new { message = $"Loan is already {loan.Status}." });

                loan.Status = dto.Status;
                loan.ApprovedBy = currentUserId;

                bool smsDispatched = false;
                if (dto.Status == "Rejected")
                {
                    loan.RejectionReason = dto.Reason;

                    if (loan.User != null && !string.IsNullOrWhiteSpace(loan.User.PhoneNumber))
                    {
                        try
                        {
                            smsDispatched = await _smsService.SendLoanRejectionAsync(
                                loan.User.PhoneNumber,
                                loan.User.FullName,
                                loan.AmountRequested,
                                dto.Reason ?? "Not specified"
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to dispatch loan rejection SMS to {PhoneNumber}", loan.User.PhoneNumber);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                string responseMsg = dto.Status == "Rejected"
                    ? (smsDispatched 
                        ? $"Officer loan rejected successfully. SMS notification sent to {loan.User?.FullName ?? "applicant"}." 
                        : "Officer loan rejected successfully.")
                    : "Officer loan approved successfully.";

                return Ok(new { message = responseMsg, smsSent = smsDispatched });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to review officer loan.", details = ex.Message });
            }
        }
    }
}
