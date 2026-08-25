using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.Entities;

namespace Sahayi.Api.Controllers
{
    [ApiController]
    [Route("api/savings")]
    public class SavingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SavingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class PaySavingsDto
        {
            public int? UserId { get; set; }
            public int? UnitId { get; set; }
            public decimal Amount { get; set; }
            public string? PaymentMethod { get; set; }
            public string? TransactionId { get; set; }
            public string? RazorpayPaymentId { get; set; }
            public int? SavingsWeekId { get; set; }
            public string? Date { get; set; }
        }

        public static async Task<SavingsWeek> EnsureWeekExistsAsync(ApplicationDbContext context, int unitId, DateTime txDate, int? requestedWeekId = null)
        {
            if (unitId <= 0)
            {
                var firstUnit = await context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.IsActive)
                                ?? await context.AyalkoottamUnits.FirstOrDefaultAsync();
                unitId = firstUnit?.UnitId ?? 1;
            }

            if (requestedWeekId.HasValue && requestedWeekId.Value > 0)
            {
                var existingById = await context.SavingsWeeks.FirstOrDefaultAsync(w => w.Id == requestedWeekId.Value && w.UnitId == unitId);
                if (existingById != null) return existingById;
            }

            int weekNum = System.Globalization.ISOWeek.GetWeekOfYear(txDate);
            int dayOfWeek = (int)txDate.DayOfWeek;
            int diffToMonday = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
            DateTime weekStart = txDate.AddDays(diffToMonday).Date;
            DateTime weekEnd = weekStart.AddDays(7).AddTicks(-1);

            var week = await context.SavingsWeeks
                .FirstOrDefaultAsync(w => w.UnitId == unitId && w.WeekNumber == weekNum && w.StartDate.Year == weekStart.Year);
            
            if (week == null)
            {
                week = await context.SavingsWeeks
                    .FirstOrDefaultAsync(w => w.UnitId == unitId && w.WeekNumber == weekNum);
            }

            if (week == null && unitId > 0)
            {
                week = new SavingsWeek
                {
                    UnitId = unitId,
                    WeekNumber = weekNum,
                    StartDate = weekStart,
                    EndDate = weekEnd,
                    Amount = 100.00m,
                    Status = "Open",
                    CreatedAt = DateTime.UtcNow
                };
                context.SavingsWeeks.Add(week);
                await context.SaveChangesAsync();
            }

            return week ?? new SavingsWeek { Id = 1, UnitId = Math.Max(1, unitId), WeekNumber = weekNum, StartDate = weekStart, EndDate = weekEnd, Amount = 100.00m, Status = "Open" };
        }

        private Task<SavingsWeek> EnsureWeekExistsAsync(int unitId, DateTime txDate, int? requestedWeekId = null) =>
            EnsureWeekExistsAsync(_context, unitId, txDate, requestedWeekId);


        // GET: api/savings/weeks?unitId={unitId}
        [HttpGet("weeks")]
        public async Task<IActionResult> GetSavingsWeeks([FromQuery] int unitId)
        {
            if (unitId <= 0)
            {
                return BadRequest(new { message = "Valid Unit ID is required." });
            }

            try
            {
                DateTime now = DateTime.UtcNow;
                await EnsureWeekExistsAsync(unitId, now);

                var weeks = await _context.SavingsWeeks
                    .Where(w => w.UnitId == unitId)
                    .OrderByDescending(w => w.WeekNumber)
                    .ThenByDescending(w => w.StartDate)
                    .ToListAsync();

                var unitMembers = await _context.ApplicationUsers
                    .Where(u => u.UnitId == unitId && u.IsActive)
                    .OrderBy(u => u.FullName)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName
                    })
                    .ToListAsync();

                var transactions = await _context.SavingsTransactions
                    .Where(st => st.UnitId == unitId)
                    .ToListAsync();

                bool backfilled = false;
                foreach (var tx in transactions)
                {
                    if (!tx.SavingsWeekId.HasValue)
                    {
                        var matchingWeek = await EnsureWeekExistsAsync(unitId, tx.TransactionDate);
                        tx.SavingsWeekId = matchingWeek.Id;
                        backfilled = true;
                    }
                }
                if (backfilled)
                {
                    await _context.SaveChangesAsync();
                }

                var result = weeks.Select(w =>
                {
                    var weekTxs = transactions.Where(st => st.SavingsWeekId == w.Id).ToList();

                    var memberList = unitMembers.Select(m =>
                    {
                        var tx = weekTxs.FirstOrDefault(st => st.UserId == m.UserId);
                        return new
                        {
                            userId = m.UserId,
                            memberId = $"M-{m.UserId:D3}",
                            name = m.FullName,
                            amount = tx?.Amount ?? 0.00m,
                            status = tx != null ? "Paid" : "Pending",
                            paidDate = tx?.TransactionDate.ToString("yyyy-MM-dd HH:mm"),
                            paymentMode = tx?.PaymentMode,
                            receiptNumber = tx?.ReceiptNumber,
                            transactionId = tx?.TransactionId
                        };
                    }).ToList();

                    decimal totalCollected = memberList.Where(m => m.status == "Paid").Sum(m => m.amount);
                    int paidCount = memberList.Count(m => m.status == "Paid");
                    int pendingCount = memberList.Count(m => m.status == "Pending");

                    return new
                    {
                        id = w.Id,
                        savingsWeekId = w.Id,
                        unitId = w.UnitId,
                        weekNumber = w.WeekNumber,
                        weekTitle = $"Week {w.WeekNumber} ({w.StartDate:MMM d} – {w.EndDate:MMM d, yyyy})",
                        startDate = w.StartDate.ToString("yyyy-MM-dd"),
                        endDate = w.EndDate.ToString("yyyy-MM-dd"),
                        amount = w.Amount,
                        status = w.Status,
                        totalCollected = totalCollected,
                        paidCount = paidCount,
                        pendingCount = pendingCount,
                        totalMembers = unitMembers.Count,
                        members = memberList
                    };
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch savings weeks.", details = ex.Message });
            }
        }

        // POST: api/savings/pay-cash
        [HttpPost("pay-cash")]
        public async Task<IActionResult> PayCash([FromBody] PaySavingsDto dto)
        {
            try
            {
                var targetUserId = dto.UserId ?? 0;
                var targetUnitId = dto.UnitId ?? 0;

                if (targetUnitId == 0 && targetUserId > 0)
                {
                    var user = await _context.ApplicationUsers.FindAsync(targetUserId);
                    if (user?.UnitId != null) targetUnitId = user.UnitId.Value;
                }

                if (targetUnitId <= 0)
                {
                    var firstUnit = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.IsActive)
                                    ?? await _context.AyalkoottamUnits.FirstOrDefaultAsync();
                    targetUnitId = firstUnit?.UnitId ?? 1;
                }

                var amountVal = dto.Amount > 0 ? dto.Amount : 100;
                DateTime txDate = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Date) && DateTime.TryParse(dto.Date, out var parsedDate))
                {
                    txDate = parsedDate;
                }

                var week = await EnsureWeekExistsAsync(targetUnitId, txDate, dto.SavingsWeekId);

                if (targetUserId > 0)
                {
                    var existingTx = await _context.SavingsTransactions
                        .FirstOrDefaultAsync(s => s.UserId == targetUserId && s.SavingsWeekId == week.Id);
                    if (existingTx != null)
                    {
                        return BadRequest(new { message = "Weekly savings deposit for this specific week has already been paid!" });
                    }
                }

                var savingsTx = new SavingsTransaction
                {
                    UserId = targetUserId,
                    UnitId = targetUnitId,
                    Amount = amountVal,
                    PaymentMode = "Cash",
                    TransactionDate = txDate,
                    SavingsWeekId = week.Id,
                    ReceiptNumber = $"REC-CASH-{DateTime.UtcNow.Ticks.ToString()[^8..]}",
                    RecordedBy = targetUserId
                };

                _context.SavingsTransactions.Add(savingsTx);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cash payment recorded successfully!",
                    transactionId = savingsTx.TransactionId,
                    savingsWeekId = week.Id,
                    status = "Paid"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to record cash payment.", details = ex.Message });
            }
        }

        // POST: api/savings/pay-online
        [HttpPost("pay-online")]
        public async Task<IActionResult> PayOnline([FromBody] PaySavingsDto dto)
        {
            try
            {
                var targetUserId = dto.UserId ?? 0;
                var targetUnitId = dto.UnitId ?? 0;

                if (targetUnitId == 0 && targetUserId > 0)
                {
                    var user = await _context.ApplicationUsers.FindAsync(targetUserId);
                    if (user?.UnitId != null) targetUnitId = user.UnitId.Value;
                }

                if (targetUnitId <= 0)
                {
                    var firstUnit = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.IsActive)
                                    ?? await _context.AyalkoottamUnits.FirstOrDefaultAsync();
                    targetUnitId = firstUnit?.UnitId ?? 1;
                }

                var amountVal = dto.Amount > 0 ? dto.Amount : 100;
                DateTime txDate = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Date) && DateTime.TryParse(dto.Date, out var parsedDate))
                {
                    txDate = parsedDate;
                }

                var week = await EnsureWeekExistsAsync(targetUnitId, txDate, dto.SavingsWeekId);

                if (targetUserId > 0)
                {
                    var existingTx = await _context.SavingsTransactions
                        .FirstOrDefaultAsync(s => s.UserId == targetUserId && s.SavingsWeekId == week.Id);
                    if (existingTx != null)
                    {
                        return BadRequest(new { message = "Weekly savings deposit for this specific week has already been paid!" });
                    }
                }

                var savingsTx = new SavingsTransaction
                {
                    UserId = targetUserId,
                    UnitId = targetUnitId,
                    Amount = amountVal,
                    PaymentMode = "Online",
                    TransactionDate = txDate,
                    SavingsWeekId = week.Id,
                    ReceiptNumber = $"REC-RZP-{dto.RazorpayPaymentId ?? DateTime.UtcNow.Ticks.ToString()[^8..]}",
                    RecordedBy = targetUserId
                };

                _context.SavingsTransactions.Add(savingsTx);

                // Credit Unit Bank Account balance for Online Payment
                if (targetUnitId > 0)
                {
                    var unitInfo = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.UnitId == targetUnitId);
                    var bankAccount = await _context.UnitBankAccounts.FirstOrDefaultAsync(b => b.UnitId == targetUnitId);

                    string accNum = !string.IsNullOrWhiteSpace(unitInfo?.AccountNumber) ? unitInfo.AccountNumber : $"SB-UNIT-{targetUnitId:D4}";
                    string bankName = !string.IsNullOrWhiteSpace(unitInfo?.BankName) ? unitInfo.BankName : "Sahayi Co-operative Bank";
                    string ifsc = !string.IsNullOrWhiteSpace(unitInfo?.IFSCCode) ? unitInfo.IFSCCode : "SHY0001001";

                    if (bankAccount == null)
                    {
                        bankAccount = new UnitBankAccount
                        {
                            UnitId = targetUnitId,
                            AccountNumber = accNum,
                            BankName = bankName,
                            IFSCCode = ifsc,
                            Balance = 0.00m,
                            LastUpdated = DateTime.UtcNow
                        };
                        _context.UnitBankAccounts.Add(bankAccount);
                    }
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(unitInfo?.BankName)) bankAccount.BankName = unitInfo.BankName;
                        if (!string.IsNullOrWhiteSpace(unitInfo?.IFSCCode)) bankAccount.IFSCCode = unitInfo.IFSCCode;
                        if (!string.IsNullOrWhiteSpace(unitInfo?.AccountNumber)) bankAccount.AccountNumber = unitInfo.AccountNumber;
                    }

                    bankAccount.Balance += amountVal;
                    bankAccount.LastUpdated = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Online payment recorded successfully!",
                    transactionId = savingsTx.TransactionId,
                    savingsWeekId = week.Id,
                    razorpayPaymentId = dto.RazorpayPaymentId,
                    status = "Paid"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to record online payment.", details = ex.Message });
            }
        }

        // GET: api/savings/unit-bank-account/{unitId}
        [HttpGet("unit-bank-account/{unitId}")]
        public async Task<IActionResult> GetUnitBankAccount(int unitId)
        {
            if (unitId <= 0)
            {
                return BadRequest(new { message = "Invalid unit ID specified." });
            }

            try
            {
                var unitInfo = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.UnitId == unitId);
                var bankAccount = await _context.UnitBankAccounts
                    .FirstOrDefaultAsync(b => b.UnitId == unitId);

                decimal onlineAndDepositedTotal = await _context.SavingsTransactions
                    .Where(s => s.UnitId == unitId && (s.PaymentMode == "Online" || s.PaymentMode.Contains("Bank Deposited")))
                    .SumAsync(s => (decimal?)s.Amount) ?? 0.00m;

                string accNum = !string.IsNullOrWhiteSpace(unitInfo?.AccountNumber) ? unitInfo.AccountNumber : $"SB-UNIT-{unitId:D4}";
                string bankName = !string.IsNullOrWhiteSpace(unitInfo?.BankName) ? unitInfo.BankName : "Sahayi Co-operative Bank";
                string ifsc = !string.IsNullOrWhiteSpace(unitInfo?.IFSCCode) ? unitInfo.IFSCCode : "SHY0001001";

                if (bankAccount == null)
                {
                    bankAccount = new UnitBankAccount
                    {
                        UnitId = unitId,
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
                    bool updated = false;
                    if (bankAccount.Balance < onlineAndDepositedTotal)
                    {
                        bankAccount.Balance = onlineAndDepositedTotal;
                        updated = true;
                    }
                    if (!string.IsNullOrWhiteSpace(unitInfo?.BankName) && bankAccount.BankName != unitInfo.BankName)
                    {
                        bankAccount.BankName = unitInfo.BankName;
                        updated = true;
                    }
                    if (!string.IsNullOrWhiteSpace(unitInfo?.IFSCCode) && bankAccount.IFSCCode != unitInfo.IFSCCode)
                    {
                        bankAccount.IFSCCode = unitInfo.IFSCCode;
                        updated = true;
                    }
                    if (!string.IsNullOrWhiteSpace(unitInfo?.AccountNumber) && bankAccount.AccountNumber != unitInfo.AccountNumber)
                    {
                        bankAccount.AccountNumber = unitInfo.AccountNumber;
                        updated = true;
                    }
                    if (updated)
                    {
                        bankAccount.LastUpdated = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(bankAccount);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch unit bank account.", details = ex.Message });
            }
        }

        public class DepositCashDto
        {
            public int? TransactionId { get; set; }
            public int UnitId { get; set; }
            public decimal Amount { get; set; }
        }

        // POST: api/savings/deposit-cash-to-bank
        [HttpPost("deposit-cash-to-bank")]
        public async Task<IActionResult> DepositCashToBank([FromBody] DepositCashDto dto)
        {
            try
            {
                var targetUnitId = dto.UnitId;
                SavingsTransaction? tx = null;

                if (dto.TransactionId.HasValue && dto.TransactionId.Value > 0)
                {
                    tx = await _context.SavingsTransactions.FindAsync(dto.TransactionId.Value);
                    if (tx != null)
                    {
                        if (targetUnitId == 0) targetUnitId = tx.UnitId;
                        tx.PaymentMode = "Cash (Bank Deposited)";
                    }
                }

                if (targetUnitId <= 0)
                {
                    return BadRequest(new { message = "Invalid Unit ID specified." });
                }

                var amountVal = dto.Amount > 0 ? dto.Amount : (tx?.Amount ?? 100m);

                var unitInfo = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.UnitId == targetUnitId);
                var bankAccount = await _context.UnitBankAccounts.FirstOrDefaultAsync(b => b.UnitId == targetUnitId);

                string accNum = !string.IsNullOrWhiteSpace(unitInfo?.AccountNumber) ? unitInfo.AccountNumber : $"SB-UNIT-{targetUnitId:D4}";
                string bankName = !string.IsNullOrWhiteSpace(unitInfo?.BankName) ? unitInfo.BankName : "Sahayi Co-operative Bank";
                string ifsc = !string.IsNullOrWhiteSpace(unitInfo?.IFSCCode) ? unitInfo.IFSCCode : "SHY0001001";

                if (bankAccount == null)
                {
                    bankAccount = new UnitBankAccount
                    {
                        UnitId = targetUnitId,
                        AccountNumber = accNum,
                        BankName = bankName,
                        IFSCCode = ifsc,
                        Balance = amountVal,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.UnitBankAccounts.Add(bankAccount);
                }
                else
                {
                    bankAccount.Balance += amountVal;
                    bankAccount.LastUpdated = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Successfully deposited ₹{amountVal:F2} cash into Unit Bank Account!",
                    bankAccount = bankAccount,
                    transactionId = dto.TransactionId,
                    status = "Cash (Bank Deposited)"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to deposit cash into unit bank account.", details = ex.Message });
            }
        }
    }
}
