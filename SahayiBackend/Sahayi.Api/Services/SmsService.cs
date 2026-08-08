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

        public Task<bool> SendOtpAsync(string phoneNumber, string FullName,string otpCode)
        {
            // Log OTP to server output console for easy testing / debugging
            string message = $"\n========================================\n" +
                 $"[SAHAYI - PASSWORD RESET OTP]\n\n" +
                 $"Dear {FullName},\n" +
                 $"Your password reset OTP is: {otpCode}\n" +
                 $"Valid For: 10 minutes\n\n" +
                 $"For security, do not share this code.\n" +
                 $"========================================\n";

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(message);
            Console.ResetColor();

            _logger.LogInformation("OTP {OtpCode} successfully sent to mobile {PhoneNumber}", otpCode, phoneNumber);

            return Task.FromResult(true);
        }
    }
}
