using System;
using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.Entities
{
    public class PasswordResetOtp
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string OtpCode { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ResetToken { get; set; }

        public DateTime ExpiryTime { get; set; }

        public bool IsUsed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
