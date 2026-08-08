using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    // Request DTO to request OTP for forgot password
    public class SendForgotPasswordOtpDto
    {
        [Required(ErrorMessage = "Mobile number is required.")]
        [Phone(ErrorMessage = "Invalid phone number format.")]
        public string PhoneNumber { get; set; } = string.Empty;

   
    }

    // Request DTO to verify OTP
    public class VerifyForgotPasswordOtpDto
    {
        [Required(ErrorMessage = "Mobile number is required.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "OTP code is required.")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "OTP must be 6 digits.")]
        public string Otp { get; set; } = string.Empty;
    }

    // Request DTO to reset password with reset token
    public class ResetForgotPasswordDto
    {
        [Required(ErrorMessage = "Mobile number is required.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Reset token is required.")]
        public string ResetToken { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required.")]
        [MinLength(6, ErrorMessage = "New password must be at least 6 characters long.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
