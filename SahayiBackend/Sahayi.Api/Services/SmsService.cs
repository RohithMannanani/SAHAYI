using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Sahayi.Api.Services
{
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public SmsService(ILogger<SmsService> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public async Task<bool> SendOtpAsync(string phoneNumber, string fullName, string otpCode)
        {
            string formattedPhone = FormatPhoneNumber(phoneNumber);
            string greetingName = string.IsNullOrWhiteSpace(fullName) ? "User" : fullName.Trim();
            string messageBody = $"[SAHAYI] Dear {greetingName}, your password reset OTP is: {otpCode}. Valid for 10 minutes. Do not share this OTP.";

            // Always log OTP to server output console for debugging / fallback
            PrintConsoleOtp(formattedPhone, greetingName, otpCode);

            // Read SMS Gateway configuration from appsettings.json
            string apiKey = _configuration["SmsGateway:ApiKey"] ?? string.Empty;
            string deviceId = _configuration["SmsGateway:DeviceId"] ?? string.Empty;

            // If credentials are not yet entered, keep console OTP active without throwing
            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(deviceId))
            {
                _logger.LogInformation("[SMS GATEWAY] No Android Gateway ApiKey or DeviceId configured in appsettings.json. OTP is printed in console above.");
                return true;
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(15);

                // TextBee API endpoint: https://api.textbee.dev/api/v1/gateway/devices/{DEVICE_ID}/sendSMS
                string requestUrl = $"https://api.textbee.dev/api/v1/gateway/devices/{deviceId}/sendSMS";

                var requestPayload = new
                {
                    recipients = new[] { formattedPhone },
                    message = messageBody
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
                {
                    Content = JsonContent.Create(requestPayload)
                };
                request.Headers.Add("x-api-key", apiKey);

                var response = await client.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ [SMS GATEWAY] OTP successfully sent to Android phone gateway for delivery to {PhoneNumber}", formattedPhone);
                    return true;
                }

                string errorDetails = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("⚠️ [SMS GATEWAY] Android gateway returned status {StatusCode}: {ErrorDetails}. Fallback to terminal OTP.", response.StatusCode, errorDetails);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [SMS GATEWAY] Failed to dispatch SMS to Android gateway. Fallback to terminal OTP.");
                return false;
            }
        }

        public async Task<bool> SendLoanRejectionAsync(string phoneNumber, string fullName, decimal amount, string reason)
        {
            string formattedPhone = FormatPhoneNumber(phoneNumber);
            string greetingName = string.IsNullOrWhiteSpace(fullName) ? "Member" : fullName.Trim();
            string cleanReason = string.IsNullOrWhiteSpace(reason) ? "Not specified by President" : reason.Trim();
            string messageBody = $"[SAHAYI] Dear {greetingName}, your loan application of Rs. {amount:N0} has been REJECTED by the President. Reason: {cleanReason}. For queries, contact your unit President.";

            // Always display rejection notification in terminal console
            PrintConsoleLoanRejection(formattedPhone, greetingName, amount, cleanReason);

            string apiKey = _configuration["SmsGateway:ApiKey"] ?? string.Empty;
            string deviceId = _configuration["SmsGateway:DeviceId"] ?? string.Empty;

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(deviceId))
            {
                _logger.LogInformation("[SMS GATEWAY] No Android Gateway ApiKey or DeviceId configured in appsettings.json. Loan rejection notice is printed in console above.");
                return true;
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(15);

                string requestUrl = $"https://api.textbee.dev/api/v1/gateway/devices/{deviceId}/sendSMS";

                var requestPayload = new
                {
                    recipients = new[] { formattedPhone },
                    message = messageBody
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
                {
                    Content = JsonContent.Create(requestPayload)
                };
                request.Headers.Add("x-api-key", apiKey);

                var response = await client.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ [SMS GATEWAY] Loan rejection SMS successfully sent to {PhoneNumber}", formattedPhone);
                    return true;
                }

                string errorDetails = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("⚠️ [SMS GATEWAY] Android gateway returned status {StatusCode}: {ErrorDetails}. Fallback to terminal notification.", response.StatusCode, errorDetails);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [SMS GATEWAY] Failed to dispatch loan rejection SMS to Android gateway. Fallback to terminal notification.");
                return false;
            }
        }

        private static void PrintConsoleLoanRejection(string phoneNumber, string fullName, decimal amount, string reason)
        {
            string message = $"\n========================================\n" +
                             $"[SAHAYI - LOAN REJECTION SMS NOTIFICATION]\n\n" +
                             $"Recipient: {fullName}\n" +
                             $"Mobile: {phoneNumber}\n" +
                             $"Loan Amount: Rs. {amount:N0}\n" +
                             $"Status: REJECTED\n" +
                             $"Reason: {reason}\n\n" +
                             $"SMS Text: [SAHAYI] Dear {fullName}, your loan application of Rs. {amount:N0} has been REJECTED by the President. Reason: {reason}.\n" +
                             $"========================================\n";

            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine(message);
            Console.ResetColor();
        }

        private static string FormatPhoneNumber(string rawPhone)
        {
            if (string.IsNullOrWhiteSpace(rawPhone)) return string.Empty;

            string cleaned = rawPhone.Trim();
            bool hasPlus = cleaned.StartsWith("+");
            string digits = new string(cleaned.Where(char.IsDigit).ToArray());

            // If 10 digits (standard Indian mobile number), prepend +91
            if (!hasPlus && digits.Length == 10)
            {
                return "+91" + digits;
            }

            // If starts with 91 and has 12 digits
            if (digits.Length == 12 && digits.StartsWith("91"))
            {
                return "+" + digits;
            }

            return hasPlus ? "+" + digits : "+91" + digits;
        }

        private static void PrintConsoleOtp(string phoneNumber, string fullName, string otpCode)
        {
            string message = $"\n========================================\n" +
                             $"[SAHAYI - PASSWORD RESET OTP]\n\n" +
                             $"Dear {fullName},\n" +
                             $"Mobile: {phoneNumber}\n" +
                             $"Your password reset OTP is: {otpCode}\n" +
                             $"Valid For: 10 minutes\n\n" +
                             $"For security, do not share this code.\n" +
                             $"========================================\n";

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(message);
            Console.ResetColor();
        }
    }
}
