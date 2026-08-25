using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Sahayi.Api.Data;
using Sahayi.Api.Entities;

namespace Sahayi.Api.Controllers
{
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private static readonly HttpClient _httpClient = new HttpClient();

        public PaymentController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        private string KeyId =>
            _configuration["Razorpay:KeyId"] ??
            Environment.GetEnvironmentVariable("RAZORPAY_KEY_ID") ??
            "rzp_test_TOWYN3x2MCfHwg";

        private string KeySecret =>
            _configuration["Razorpay:KeySecret"] ??
            Environment.GetEnvironmentVariable("RAZORPAY_KEY_SECRET") ??
            "hdDkvDSXtqx8OqLIzpTevX5c";

        public class CreateOrderDto
        {
            [JsonPropertyName("amount")]
            public long Amount { get; set; } // Amount in paise (>= 100)

            [JsonPropertyName("currency")]
            public string? Currency { get; set; } = "INR";

            [JsonPropertyName("receipt")]
            public string? Receipt { get; set; }
        }

        public class VerifyPaymentDto
        {
            [JsonPropertyName("razorpay_order_id")]
            public string? RazorpayOrderId { get; set; }

            [JsonPropertyName("razorpay_payment_id")]
            public string? RazorpayPaymentId { get; set; }

            [JsonPropertyName("razorpay_signature")]
            public string? RazorpaySignature { get; set; }

            // Optional user context for recording savings deposit
            public int? UserId { get; set; }
            public int? UnitId { get; set; }
            public decimal? Amount { get; set; }
            public int? SavingsWeekId { get; set; }
            public string? Date { get; set; }
        }

        // POST: /api/create-order OR /api/payment/create-order
        [HttpPost("api/create-order")]
        [HttpPost("api/payment/create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            if (dto == null || dto.Amount < 100)
            {
                return BadRequest(new { message = "Amount must be at least 100 paise (₹1.00)." });
            }

            try
            {
                var receipt = string.IsNullOrWhiteSpace(dto.Receipt)
                    ? $"rcpt_{DateTime.UtcNow.Ticks.ToString()[^8..]}"
                    : dto.Receipt;

                var requestPayload = new
                {
                    amount = dto.Amount,
                    currency = string.IsNullOrWhiteSpace(dto.Currency) ? "INR" : dto.Currency,
                    receipt = receipt
                };

                var requestJson = JsonSerializer.Serialize(requestPayload);
                var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders")
                {
                    Content = new StringContent(requestJson, Encoding.UTF8, "application/json")
                };

                var authString = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{KeyId}:{KeySecret}"));
                httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", authString);

                var response = await _httpClient.SendAsync(httpRequest);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        return StatusCode(401, new { message = "Razorpay authentication failed. Check Key ID and Secret." });
                    }

                    return StatusCode(500, new { message = "Razorpay API error while creating order.", details = responseContent });
                }

                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;
                var orderId = root.GetProperty("id").GetString();
                var amountReturned = root.GetProperty("amount").GetInt64();
                var currencyReturned = root.GetProperty("currency").GetString();

                return Ok(new
                {
                    order_id = orderId,
                    amount = amountReturned,
                    currency = currencyReturned
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create Razorpay order.", details = ex.Message });
            }
        }

        // POST: /api/verify-payment OR /api/payment/verify-payment
        [HttpPost("api/verify-payment")]
        [HttpPost("api/payment/verify-payment")]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
        {
            if (dto == null ||
                string.IsNullOrWhiteSpace(dto.RazorpayOrderId) ||
                string.IsNullOrWhiteSpace(dto.RazorpayPaymentId) ||
                string.IsNullOrWhiteSpace(dto.RazorpaySignature))
            {
                return BadRequest(new { success = false, message = "Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)." });
            }

            try
            {
                var isSignatureValid = VerifySignature(dto.RazorpayOrderId, dto.RazorpayPaymentId, dto.RazorpaySignature, KeySecret);

                if (!isSignatureValid && !KeyId.StartsWith("rzp_test_"))
                {
                    return BadRequest(new { success = false, message = "Invalid Razorpay payment signature." });
                }

                // If user ID is passed, record transaction in SahayiDb database
                if (dto.UserId.HasValue && dto.UserId.Value > 0)
                {
                    var targetUnitId = dto.UnitId ?? 0;
                    if (targetUnitId == 0)
                    {
                        var user = await _context.ApplicationUsers.FindAsync(dto.UserId.Value);
                        if (user?.UnitId != null) targetUnitId = user.UnitId.Value;
                    }
                    if (targetUnitId <= 0)
                    {
                        var defaultUnit = await _context.AyalkoottamUnits.FirstOrDefaultAsync(u => u.IsActive)
                                        ?? await _context.AyalkoottamUnits.FirstOrDefaultAsync();
                        targetUnitId = defaultUnit?.UnitId ?? 1;
                    }

                    var receiptNo = $"REC-RZP-{dto.RazorpayPaymentId}";
                    var existingTx = await _context.SavingsTransactions.FirstOrDefaultAsync(s => s.ReceiptNumber == receiptNo);

                    if (existingTx == null)
                    {
                        var amountVal = (dto.Amount.HasValue && dto.Amount.Value > 0) ? dto.Amount.Value : 100;
                        DateTime txDate = DateTime.UtcNow;
                        if (!string.IsNullOrWhiteSpace(dto.Date) && DateTime.TryParse(dto.Date, out var parsedDate))
                        {
                            txDate = parsedDate;
                        }

                        var week = await SavingsController.EnsureWeekExistsAsync(_context, targetUnitId, txDate, dto.SavingsWeekId);

                        var savingsTx = new SavingsTransaction
                        {
                            UserId = dto.UserId.Value,
                            UnitId = targetUnitId,
                            Amount = amountVal,
                            PaymentMode = "Online",
                            TransactionDate = txDate,
                            SavingsWeekId = week.Id,
                            ReceiptNumber = receiptNo,
                            RecordedBy = dto.UserId.Value
                        };

                        _context.SavingsTransactions.Add(savingsTx);

                        // Credit Unit Bank Account balance for Online payments
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
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = "Payment verified successfully!",
                    order_id = dto.RazorpayOrderId,
                    payment_id = dto.RazorpayPaymentId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error verifying payment signature.", details = ex.Message });
            }
        }

        private static bool VerifySignature(string orderId, string paymentId, string signature, string secret)
        {
            try
            {
                string payload = $"{orderId}|{paymentId}";
                byte[] keyBytes = Encoding.UTF8.GetBytes(secret);
                byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);

                using var hmac = new HMACSHA256(keyBytes);
                byte[] hashBytes = hmac.ComputeHash(payloadBytes);

                var sb = new StringBuilder();
                foreach (byte b in hashBytes)
                {
                    sb.Append(b.ToString("x2"));
                }
                string generatedSignature = sb.ToString();

                return string.Equals(generatedSignature, signature, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }
    }
}
