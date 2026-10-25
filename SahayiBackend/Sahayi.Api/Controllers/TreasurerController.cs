using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.Dtos;
using Sahayi.Api.Entities;
using Sahayi.Api.Helpers;
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
                decimal fineAmount = LoanFineCalculator.CalculateFine(loan);
                decimal totalLoanAmount = loan.AmountRequested + fineAmount;
                decimal remainingBalance = Math.Max(0m, totalLoanAmount - totalPrincipalPaid);

                if (remainingBalance <= 0)
                {
                    return Ok(new LoanInstallmentDueDto
                    {
                        LoanId = loan.LoanId,
                        BorrowerName = loan.User?.FullName ?? "Unknown",
                        FineAmount = fineAmount,
                        TotalLoanAmount = totalLoanAmount,
                        RemainingBalance = 0m,
                        FixedPrincipalDue = 0m,
                        CurrentMonthInterestDue = 0m,
                        TotalInstallmentDue = 0m,
                        CurrentInstallmentNumber = loan.LoanRepayments.Count,
                        TotalTenureMonths = loan.TenureMonths
                    });
                }

                decimal fixedPrincipal = Math.Round(totalLoanAmount / Math.Max(1, loan.TenureMonths), 2);
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
                    FineAmount = fineAmount,
                    TotalLoanAmount = totalLoanAmount,
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
                decimal fineAmount = LoanFineCalculator.CalculateFine(loan);
                decimal totalLoanAmount = loan.AmountRequested + fineAmount;

                var schedule = new List<RepaymentScheduleItemDto>();
                decimal currentBalance = totalLoanAmount;
                decimal basePrincipal = Math.Round(totalLoanAmount / Math.Max(1, loan.TenureMonths), 2);

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
                    fineAmount = fineAmount,
                    totalLoanAmount = totalLoanAmount,
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
                decimal fineAmount = LoanFineCalculator.CalculateFine(loan);
                decimal totalLoanAmount = loan.AmountRequested + fineAmount;
                decimal outstandingBalance = Math.Max(0m, totalLoanAmount - totalPrincipalPaid);

                if (outstandingBalance <= 0)
                {
                    loan.Status = "Closed";
                    await _context.SaveChangesAsync();
                    return BadRequest(new { message = "Loan is already fully repaid." });
                }

                decimal monthlyInterestDue = Math.Round(outstandingBalance * (loan.InterestRate / 100m), 2);
                
                decimal principalPaid = 0m;
                decimal interestComponent = 0m;
                decimal amountPaid = dto.AmountPaid;

                string mode = (dto.RepaymentType ?? "Combined").Trim();

                if (mode.Equals("PrincipalOnly", StringComparison.OrdinalIgnoreCase) || (dto.PrincipalComponent.HasValue && dto.InterestComponent.HasValue && dto.InterestComponent.Value == 0m))
                {
                    interestComponent = 0m;
                    principalPaid = Math.Min(outstandingBalance, dto.AmountPaid);
                    amountPaid = principalPaid;
                }
                else if (mode.Equals("InterestOnly", StringComparison.OrdinalIgnoreCase))
                {
                    interestComponent = monthlyInterestDue > 0 ? monthlyInterestDue : dto.AmountPaid;
                    principalPaid = 0m;
                    amountPaid = interestComponent;
                }
                else if (mode.Equals("FullPayoff", StringComparison.OrdinalIgnoreCase))
                {
                    principalPaid = outstandingBalance;
                    interestComponent = monthlyInterestDue;
                    amountPaid = principalPaid + interestComponent;
                }
                else // Combined or Default
                {
                    if (dto.PrincipalComponent.HasValue && dto.InterestComponent.HasValue)
                    {
                        interestComponent = dto.InterestComponent.Value;
                        principalPaid = Math.Min(outstandingBalance, dto.PrincipalComponent.Value);
                        amountPaid = interestComponent + principalPaid;
                    }
                    else
                    {
                        interestComponent = Math.Min(monthlyInterestDue, amountPaid);
                        principalPaid = Math.Max(0m, amountPaid - interestComponent);
                        if (principalPaid > outstandingBalance)
                        {
                            principalPaid = outstandingBalance;
                            amountPaid = interestComponent + principalPaid;
                        }
                    }
                }

                dto.AmountPaid = amountPaid;
                string receiptNumber = $"REC-LN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";

                var repayment = new LoanRepayment
                {
                    LoanId = loanId,
                    AmountPaid = dto.AmountPaid,
                    PrincipalComponent = principalPaid,
                    InterestComponent = interestComponent,
                    RepaymentDate = DateTime.UtcNow,
                    ReceiptNumber = receiptNumber,
                    RecordedBy = currentUserId,
                    PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "Cash" : dto.PaymentMode
                };

                _context.LoanRepayments.Add(repayment);

                decimal newBalance = outstandingBalance - principalPaid;
                if (newBalance <= 0)
                {
                    loan.Status = "Closed";
                }

                // Loan repayment amount goes to Treasury hand (In Hand collections).
                // It will only be credited to UnitBankAccounts.Balance when the treasurer deposits it to the bank.
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Repayment recorded successfully (Collections In Hand).",
                    receiptNumber = receiptNumber,
                    borrowerName = loan.User?.FullName ?? "Member",
                    amountPaid = dto.AmountPaid,
                    principalPaid = principalPaid,
                    interestPaid = interestComponent,
                    newBalance = newBalance,
                    status = loan.Status,
                    paymentMode = repayment.PaymentMode,
                    isBankDeposited = false,
                    repaymentDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to record repayment.", details = ex.Message });
            }
        }

        // GET: api/treasurer/unit-repayments
        [HttpGet("unit-repayments")]
        public async Task<IActionResult> GetUnitLoanRepayments()
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

                var repayments = await _context.LoanRepayments
                    .Include(r => r.LoanApplication)
                        .ThenInclude(l => l!.User)
                    .Include(r => r.Recorder)
                    .Where(r => r.LoanApplication != null && r.LoanApplication.UnitId == user.UnitId)
                    .OrderByDescending(r => r.RepaymentDate)
                    .Select(r => new
                    {
                        repaymentId = r.RepaymentId,
                        loanId = r.LoanId,
                        borrowerName = r.LoanApplication!.User != null ? r.LoanApplication.User.FullName : "Member",
                        userId = r.LoanApplication.UserId,
                        amountPaid = r.AmountPaid,
                        principalComponent = r.PrincipalComponent,
                        interestComponent = r.InterestComponent,
                        repaymentDate = r.RepaymentDate,
                        receiptNumber = r.ReceiptNumber,
                        recordedByName = r.Recorder != null ? r.Recorder.FullName : "Treasurer",
                        paymentMode = r.PaymentMode ?? "Cash",
                        isBankDeposited = (r.PaymentMode ?? "").Contains("Bank Deposited")
                    })
                    .ToListAsync();

                return Ok(repayments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch unit loan repayments.", details = ex.Message });
            }
        }
    }
}
