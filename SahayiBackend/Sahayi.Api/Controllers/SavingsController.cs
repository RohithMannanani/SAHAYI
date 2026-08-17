using System;
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

                var amountVal = dto.Amount > 0 ? dto.Amount : 100;
                DateTime txDate = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Date) && DateTime.TryParse(dto.Date, out var parsedDate))
                {
                    txDate = parsedDate;
                }

                int dayOfWeek = (int)txDate.DayOfWeek;
                int diffToMonday = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
                DateTime weekStart = txDate.AddDays(diffToMonday).Date;
                DateTime weekEnd = weekStart.AddDays(7).AddTicks(-1);

                int calculatedWeekId = dto.SavingsWeekId ?? System.Globalization.ISOWeek.GetWeekOfYear(txDate);

                if (targetUserId > 0)
                {
                    var existingTx = await _context.SavingsTransactions
                        .FirstOrDefaultAsync(s => s.UserId == targetUserId &&
                            ((dto.SavingsWeekId.HasValue && s.SavingsWeekId == dto.SavingsWeekId.Value) ||
                             (s.TransactionDate >= weekStart && s.TransactionDate <= weekEnd)));
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
                    SavingsWeekId = calculatedWeekId,
                    ReceiptNumber = $"REC-CASH-{DateTime.UtcNow.Ticks.ToString()[^8..]}",
                    RecordedBy = targetUserId
                };

                _context.SavingsTransactions.Add(savingsTx);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cash payment recorded successfully!",
                    transactionId = savingsTx.TransactionId,
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

                var amountVal = dto.Amount > 0 ? dto.Amount : 100;
                DateTime txDate = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Date) && DateTime.TryParse(dto.Date, out var parsedDate))
                {
                    txDate = parsedDate;
                }

                int dayOfWeek = (int)txDate.DayOfWeek;
                int diffToMonday = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
                DateTime weekStart = txDate.AddDays(diffToMonday).Date;
                DateTime weekEnd = weekStart.AddDays(7).AddTicks(-1);

                int calculatedWeekId = dto.SavingsWeekId ?? System.Globalization.ISOWeek.GetWeekOfYear(txDate);

                if (targetUserId > 0)
                {
                    var existingTx = await _context.SavingsTransactions
                        .FirstOrDefaultAsync(s => s.UserId == targetUserId &&
                            ((dto.SavingsWeekId.HasValue && s.SavingsWeekId == dto.SavingsWeekId.Value) ||
                             (s.TransactionDate >= weekStart && s.TransactionDate <= weekEnd)));
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
                    SavingsWeekId = calculatedWeekId,
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
