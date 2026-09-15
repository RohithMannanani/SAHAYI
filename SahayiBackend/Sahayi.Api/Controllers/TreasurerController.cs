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
    [Authorize(Roles = "Treasurer,President")] // President can view
    [ApiController]
    [Route("api/[controller]")]
    public class TreasurerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TreasurerController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/treasurer/pending-loans
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

        // POST: api/treasurer/review-loan/{loanId}
        [HttpPost("review-loan/{loanId}")]
        [Authorize(Roles = "Treasurer")]
        public async Task<IActionResult> ReviewLoan(int loanId, [FromBody] LoanReviewDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
                {
                    return Unauthorized("User ID not found in token.");
                }

                var loan = await _context.LoanApplications.FindAsync(loanId);
                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.Status != "Pending")
                    return BadRequest(new { message = $"Loan is already {loan.Status}." });

                // CRITICAL: Treasurer CANNOT approve their own loan application
                if (loan.UserId == currentUserId)
                {
                    return BadRequest(new { message = "Conflict of Interest: You cannot review your own loan application. Please have the President review it." });
                }

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

        // GET: api/treasurer/approved-loans
        [HttpGet("approved-loans")]
        public async Task<IActionResult> GetApprovedLoans()
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

                var approvedLoans = await _context.LoanApplications
                    .Include(l => l.User)
                    .Include(l => l.Approver)
                    .Where(l => l.UnitId == user.UnitId && l.Status == "Approved")
                    .OrderBy(l => l.AppliedDate)
                    .ToListAsync();

                var dtos = approvedLoans.Select(l => new LoanSummaryDto
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
                    ApprovedByName = l.Approver?.FullName
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch approved loans.", details = ex.Message });
            }
        }

        // POST: api/treasurer/disburse-loan/{loanId}
        [HttpPost("disburse-loan/{loanId}")]
        [Authorize(Roles = "Treasurer")] // Only Treasurer can disburse
        public async Task<IActionResult> DisburseLoan(int loanId)
        {
            try
            {
                var loan = await _context.LoanApplications.FindAsync(loanId);
                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.Status != "Approved")
                    return BadRequest(new { message = $"Loan cannot be disbursed. Current status: {loan.Status}" });

                loan.Status = "Disbursed";
                loan.DisbursedDate = DateTime.UtcNow;

                var unit = await _context.AyalkoottamUnits.FindAsync(loan.UnitId);
                var bankAccount = await _context.UnitBankAccounts.FirstOrDefaultAsync(b => b.UnitId == loan.UnitId);
                if (bankAccount == null)
                {
                    string accNum = !string.IsNullOrWhiteSpace(unit?.AccountNumber) ? unit.AccountNumber : $"SB-UNIT-{loan.UnitId:D4}";
                    string bankName = !string.IsNullOrWhiteSpace(unit?.BankName) ? unit.BankName : "Sahayi Co-operative Bank";
                    string ifsc = !string.IsNullOrWhiteSpace(unit?.IFSCCode) ? unit.IFSCCode : "SHY0001001";

                    decimal currentBal = unit?.AccountBalance ?? 0.00m;
                    bankAccount = new UnitBankAccount
                    {
                        UnitId = loan.UnitId,
                        AccountNumber = accNum,
                        BankName = bankName,
                        IFSCCode = ifsc,
                        Balance = currentBal - loan.AmountRequested,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.UnitBankAccounts.Add(bankAccount);
                }
                else
                {
                    bankAccount.Balance -= loan.AmountRequested;
                    bankAccount.LastUpdated = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Loan disbursed successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to disburse loan.", details = ex.Message });
            }
        }

        // GET: api/treasurer/loan-installment-due/{loanId}
        [HttpGet("loan-installment-due/{loanId}")]
        public async Task<IActionResult> GetLoanInstallmentDue(int loanId)
        {
            try
            {
                var loan = await _context.LoanApplications
                    .Include(l => l.User)
                    .Include(l => l.LoanRepayments)
                    .FirstOrDefaultAsync(l => l.LoanId == loanId);

                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                decimal totalPrincipalPaid = loan.LoanRepayments.Sum(r => r.PrincipalComponent);
                decimal remainingBalance = loan.AmountRequested - totalPrincipalPaid;

                if (remainingBalance <= 0)
                {
                    return Ok(new LoanInstallmentDueDto
                    {
                        LoanId = loan.LoanId,
                        BorrowerName = loan.User?.FullName ?? "Unknown",
                        RemainingBalance = 0m,
                        FixedPrincipalDue = 0m,
                        CurrentMonthInterestDue = 0m,
                        TotalInstallmentDue = 0m,
                        CurrentInstallmentNumber = loan.LoanRepayments.Count,
                        TotalTenureMonths = loan.TenureMonths
                    });
                }

                decimal fixedPrincipal = Math.Round(loan.AmountRequested / Math.Max(1, loan.TenureMonths), 2);
                if (fixedPrincipal > remainingBalance)
                {
                    fixedPrincipal = remainingBalance;
                }

                // Kudumbashree Diminishing/Reducing Balance Model:
                // Dynamic Monthly Interest = Math.Round(remainingBalance * (loan.InterestRate / 100m), 2)
                decimal interestDue = Math.Round(remainingBalance * (loan.InterestRate / 100m), 2);
                decimal totalInstallmentDue = fixedPrincipal + interestDue;

                var dto = new LoanInstallmentDueDto
                {
                    LoanId = loan.LoanId,
                    BorrowerName = loan.User?.FullName ?? "Unknown",
                    RemainingBalance = remainingBalance,
                    FixedPrincipalDue = fixedPrincipal,
                    CurrentMonthInterestDue = interestDue,
                    TotalInstallmentDue = totalInstallmentDue,
                    CurrentInstallmentNumber = loan.LoanRepayments.Count + 1,
                    TotalTenureMonths = loan.TenureMonths
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to calculate loan installment due.", details = ex.Message });
            }
        }

        // GET: /api/loan/{loanId}/repayment-schedule
        [HttpGet("/api/loan/{loanId}/repayment-schedule")]
        [HttpGet("repayment-schedule/{loanId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRepaymentSchedule(int loanId)
        {
            try
            {
                var loan = await _context.LoanApplications
                    .Include(l => l.User)
                    .Include(l => l.LoanRepayments)
                    .FirstOrDefaultAsync(l => l.LoanId == loanId);

                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                int paidInstallmentsCount = loan.LoanRepayments.Count;

                var schedule = new List<RepaymentScheduleItemDto>();
                decimal currentBalance = loan.AmountRequested;
                decimal basePrincipal = Math.Round(loan.AmountRequested / Math.Max(1, loan.TenureMonths), 2);

                for (int month = 1; month <= loan.TenureMonths; month++)
                {
                    if (currentBalance <= 0) break;

                    decimal opening = currentBalance;
                    // On final tenure month, fixed principal equals full remaining balance
                    decimal principal = (month == loan.TenureMonths) ? opening : Math.Min(basePrincipal, opening);
                    decimal interest = Math.Round(opening * (loan.InterestRate / 100m), 2);
                    decimal totalPayment = principal + interest;
                    decimal closing = Math.Max(0m, opening - principal);

                    schedule.Add(new RepaymentScheduleItemDto
                    {
                        Month = month,
                        OpeningBalance = opening,
                        PrincipalComponent = principal,
                        InterestComponent = interest,
                        TotalPayment = totalPayment,
                        ClosingBalance = closing,
                        Status = month <= paidInstallmentsCount ? "Paid" : "Upcoming"
                    });

                    currentBalance = closing;
                }

                return Ok(new
                {
                    loanId = loan.LoanId,
                    borrowerName = loan.User?.FullName ?? "Unknown",
                    amountRequested = loan.AmountRequested,
                    tenureMonths = loan.TenureMonths,
                    interestRate = loan.InterestRate,
                    status = loan.Status,
                    schedule = schedule
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to generate repayment schedule.", details = ex.Message });
            }
        }

        // POST: api/treasurer/record-repayment
        [HttpPost("record-repayment")]
        [Authorize(Roles = "Treasurer")] // Only Treasurer can record repayment
        public async Task<IActionResult> RecordRepayment([FromBody] RecordRepaymentDto dto, [FromQuery] int loanId)
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
                    .Include(l => l.User)
                    .Include(l => l.LoanRepayments)
                    .FirstOrDefaultAsync(l => l.LoanId == loanId);

                if (loan == null)
                    return NotFound(new { message = "Loan application not found." });

                if (loan.Status != "Disbursed")
                    return BadRequest(new { message = $"Cannot record repayment for a loan that is {loan.Status}." });

                decimal totalPrincipalPaid = loan.LoanRepayments.Sum(r => r.PrincipalComponent);
                decimal outstandingBalance = loan.AmountRequested - totalPrincipalPaid;

                if (outstandingBalance <= 0)
                {
                    loan.Status = "Closed";
                    await _context.SaveChangesAsync();
                    return BadRequest(new { message = "Loan is already fully repaid." });
                }

                // Kudumbashree standard: Monthly Reducing / Diminishing Balance Interest
                // Monthly Interest Due = Math.Round(Outstanding Balance * (InterestRate / 100m), 2)
                decimal monthlyInterestDue = Math.Round(outstandingBalance * (loan.InterestRate / 100m), 2);
                
                if (dto.AmountPaid < monthlyInterestDue)
                {
                    return BadRequest(new { message = $"Amount paid must be at least enough to cover the monthly interest of ₹{monthlyInterestDue:N2}." });
                }

                decimal interestComponent = Math.Min(monthlyInterestDue, dto.AmountPaid);
                decimal principalPaid = dto.AmountPaid - interestComponent;

                // Make sure principalPaid doesn't exceed outstandingBalance (prevent overpayment)
                if (principalPaid > outstandingBalance)
                {
                    principalPaid = outstandingBalance;
                    dto.AmountPaid = principalPaid + interestComponent;
                }

                string receiptNumber = $"REC-LN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";

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
                    message = "Repayment recorded successfully.",
                    receiptNumber = receiptNumber,
                    borrowerName = loan.User?.FullName ?? "Member",
                    amountPaid = dto.AmountPaid,
                    principalPaid = principalPaid,
                    interestPaid = interestComponent,
                    newBalance = newBalance,
                    status = loan.Status,
                    repaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to record repayment.", details = ex.Message });
            }
        }
    }
}
