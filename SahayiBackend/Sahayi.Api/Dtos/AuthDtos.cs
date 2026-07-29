using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    // Request payload for User Login
    public class LoginDto
    {
        [Required(ErrorMessage = "Username or Phone Number is required.")]
        public string UsernameOrPhone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; } = string.Empty;
    }

    // Request payload for CDS Admin Initial Registration
    public class RegisterAdminDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string HouseName { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    // Request payload for Mandatory First-Time Password Reset
    public class ChangePasswordDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string OldPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "New password must be at least 6 characters long.")]
        public string NewPassword { get; set; } = string.Empty;
    }

    // Response object returned after successful authentication
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public Guid? UnitId { get; set; }
        public string? UnitName { get; set; }
        public bool IsPasswordChanged { get; set; }
    }
}