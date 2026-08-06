using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.DTOs;
using Sahayi.Api.Entities;
using Sahayi.Api.Services;

namespace Sahayi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly ISmsService _smsService;

        public AuthController(ApplicationDbContext context, ITokenService tokenService, ISmsService smsService)
        {
            _context = context;
            _tokenService = tokenService;
            _smsService = smsService;
        }

        [HttpPost("register-admin")]
        public async Task<IActionResult> RegisterCdsAdmin([FromBody] RegisterAdminDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if Username or Phone number already exists
            if (await _context.ApplicationUsers.AnyAsync(u => u.Username == dto.Username || u.PhoneNumber == dto.PhoneNumber))
            {
                return BadRequest(new { message = "Username or Phone number is already taken." });
            }

            var adminUser = new ApplicationUser
            {
                UserId = Guid.NewGuid(),
                Username = dto.Username,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                HouseName = dto.HouseName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                IsPasswordChanged = true,
                RoleId = 1,
                UnitId = null,
                JoinedDate = DateTime.UtcNow,
                IsActive = true
            };

            _context.ApplicationUsers.Add(adminUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "CDS Admin registered successfully!", username = adminUser.Username });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.ApplicationUsers
                .Include(u => u.UserRole)
                .Include(u => u.AyalkoottamUnit)
                .FirstOrDefaultAsync(u => u.Username == dto.UsernameOrPhone || u.PhoneNumber == dto.UsernameOrPhone);

            if (user == null || !user.IsActive)
            {
                return Unauthorized(new { message = "Invalid credentials or account is deactivated." });
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }

            // 💡 GENERATE REAL JWT TOKEN HERE
            string jwtToken = _tokenService.GenerateToken(user);

            return Ok(new AuthResponseDto
            {
                Token = jwtToken,
                UserId = user.UserId,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                RoleName = user.UserRole?.RoleName ?? string.Empty,
                RoleId = user.RoleId,
                UnitId = user.UnitId,
                UnitName = user.AyalkoottamUnit?.UnitName,
                IsPasswordChanged = user.IsPasswordChanged
            });
        }

        // ========================================================
        // FORGOT PASSWORD VIA MOBILE OTP API ENDPOINTS
        // ========================================================

        [HttpPost("forgot-password/send-otp")]
        public async Task<IActionResult> SendForgotPasswordOtp([FromBody] SendForgotPasswordOtpDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string cleanPhone = dto.PhoneNumber.Trim();

            // 1. Check if the user exists in database with this phone number
            var user = await _context.ApplicationUsers
                .FirstOrDefaultAsync(u => u.PhoneNumber == cleanPhone);

            if (user == null)
            {
                return NotFound(new { message = "This mobile number is not registered in our system." });
            }

            if (!user.IsActive)
            {
                return BadRequest(new { message = "Account associated with this phone number is deactivated. Please contact your administrator." });
            }

            // 2. Generate a 6-digit random OTP
            string otpCode = Random.Shared.Next(100000, 999999).ToString();

            // 3. Deactivate any previous pending OTPs for this phone number
            var oldOtps = await _context.PasswordResetOtps
                .Where(o => o.PhoneNumber == cleanPhone && !o.IsUsed)
                .ToListAsync();
            foreach (var old in oldOtps)
            {
                old.IsUsed = true;
            }

            // 4. Save new OTP to database (expires in 10 minutes)
            var otpEntry = new PasswordResetOtp
            {
                PhoneNumber = cleanPhone,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PasswordResetOtps.Add(otpEntry);
            await _context.SaveChangesAsync();

            // 5. Send OTP via SMS service (Logs to Console)
            await _smsService.SendOtpAsync(cleanPhone, otpCode);

            return Ok(new { message = "OTP sent successfully to your registered mobile number." });
        }

        [HttpPost("forgot-password/verify-otp")]
        public async Task<IActionResult> VerifyForgotPasswordOtp([FromBody] VerifyForgotPasswordOtpDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string cleanPhone = dto.PhoneNumber.Trim();
            string cleanOtp = dto.Otp.Trim();

            var otpEntry = await _context.PasswordResetOtps
                .Where(o => o.PhoneNumber == cleanPhone && o.OtpCode == cleanOtp && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (otpEntry == null)
            {
                return BadRequest(new { message = "Invalid OTP entered. Please verify and try again." });
            }

            if (otpEntry.ExpiryTime < DateTime.UtcNow)
            {
                otpEntry.IsUsed = true;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "OTP has expired. Please request a new OTP." });
            }

            // Generate a transient reset token
            string resetToken = Guid.NewGuid().ToString("N");
            otpEntry.ResetToken = resetToken;
            await _context.SaveChangesAsync();

            return Ok(new { resetToken, message = "OTP verified successfully!" });
        }

        [HttpPost("forgot-password/reset-password")]
        public async Task<IActionResult> ResetForgotPassword([FromBody] ResetForgotPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string cleanPhone = dto.PhoneNumber.Trim();
            string resetToken = dto.ResetToken.Trim();

            // 1. Verify token
            var otpEntry = await _context.PasswordResetOtps
                .FirstOrDefaultAsync(o => o.PhoneNumber == cleanPhone && o.ResetToken == resetToken && !o.IsUsed);

            if (otpEntry == null || otpEntry.ExpiryTime < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Invalid or expired password reset session. Please request a new OTP." });
            }

            // 2. Find user in database
            var user = await _context.ApplicationUsers
                .FirstOrDefaultAsync(u => u.PhoneNumber == cleanPhone);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // 3. Update password hash
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.IsPasswordChanged = true;

            // 4. Mark OTP entry as used
            otpEntry.IsUsed = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password reset successful! You can now log in with your new password." });
        }
    }
}
