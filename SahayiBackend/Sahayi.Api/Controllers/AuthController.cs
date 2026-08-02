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

        public AuthController(ApplicationDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
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

    }
    }
