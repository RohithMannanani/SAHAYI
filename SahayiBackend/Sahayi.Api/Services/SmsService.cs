using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Sahayi.Api.Services
{
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;

        public SmsService(ILogger<SmsService> logger)
        {
            _logger = logger;
        }

        public Task<bool> SendOtpAsync(string phoneNumber, string otpCode)
        {
            // Log OTP to server output console for easy testing / debugging
            string message = $"\n========================================\n" +
                             $"[SMS SERVICE - OTP NOTIFICATION]\n" +
                             $"Recipient Mobile : {phoneNumber}\n" +
                             $"Your Sahayi OTP  : {otpCode}\n" +
                             $"Valid For        : 10 minutes\n" +
                             $"========================================\n";

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(message);
            Console.ResetColor();

            _logger.LogInformation("OTP {OtpCode} successfully sent to mobile {PhoneNumber}", otpCode, phoneNumber);

            return Task.FromResult(true);
        }
    }
}
