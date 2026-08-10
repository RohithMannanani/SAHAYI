using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sahayi.Api.Data;
using Sahayi.Api.DTOs;
using Sahayi.Api.Entities;
using Sahayi.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sahayi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShgController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PdfGeneratorService _pdfService;

        public ShgController(ApplicationDbContext context)
        {
            _context = context;
            _pdfService = new PdfGeneratorService();
        }

        [HttpGet("wards")]
        public async Task<IActionResult> GetWards()
        {
            try
            {
                var wards = await _context.PanchayathWards
                    .OrderBy(w => w.WardNumber)
                    .Select(w => new { w.WardId, w.WardNumber, w.WardName })
                    .ToListAsync();
                return Ok(wards);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving wards list.", details = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUnit([FromBody] RegisterUnitDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Fetch Ward details
                var ward = await _context.PanchayathWards.FindAsync(dto.WardId);
                if (ward == null)
                {
                    return BadRequest(new { message = $"Ward ID {dto.WardId} does not exist." });
                }

                // 2. Check if Unit Name already exists in this Ward
                if (await _context.AyalkoottamUnits.AnyAsync(u => u.UnitName.ToLower() == dto.UnitName.ToLower() && u.WardId == dto.WardId))
                {
                    return BadRequest(new { message = "An Ayalkoottam unit with this name already exists in this Ward." });
                }

                // 3. Check if Account Number already exists
                if (await _context.AyalkoottamUnits.AnyAsync(u => u.AccountNumber == dto.AccountNumber))
                {
                    return BadRequest(new { message = "This bank account number is already linked to another unit." });
                }

                // 4. Create and add the Unit entity
                var unit = new AyalkoottamUnit
                {
                    UnitName = dto.UnitName,
                    WardId = dto.WardId,
                    AccountNumber = dto.AccountNumber,
                    BankName = dto.BankName,
                    IFSCCode = dto.IFSCCode,
                    CreatedDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.AyalkoottamUnits.Add(unit);
                await _context.SaveChangesAsync();

                // 5. Create members & credentials
                var createdUsers = new List<ApplicationUser>();
                var pdfMembers = new List<MemberCredentialInfo>();

                foreach (var mDto in dto.Members)
                {
                    // Check if phone number is already registered
                    if (await _context.ApplicationUsers.AnyAsync(u => u.PhoneNumber == mDto.PhoneNumber || u.Username == mDto.PhoneNumber))
                    {
                        return BadRequest(new { message = $"Phone number '{mDto.PhoneNumber}' is already registered to a user in the system." });
                    }

                    var user = new ApplicationUser
                    {
                        Username = mDto.PhoneNumber,
                        FullName = mDto.FullName,
                        PhoneNumber = mDto.PhoneNumber,
                        HouseName = mDto.HouseName,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.DefaultPassword),
                        IsPasswordChanged = false, // Set to false to force password change on first login
                        RoleId = mDto.RoleId,
                        UnitId = unit.UnitId,
                        JoinedDate = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.ApplicationUsers.Add(user);
                    createdUsers.Add(user);

                    string roleName = mDto.RoleId switch
                    {
                        2 => "President",
                        3 => "Secretary",
                        4 => "Treasurer",
                        _ => "Member"
                    };

                    pdfMembers.Add(new MemberCredentialInfo
                    {
                        FullName = mDto.FullName,
                        PhoneNumber = mDto.PhoneNumber,
                        Role = roleName,
                        CommonPassword = dto.DefaultPassword
                    });
                }

                // 6. Save unit and users to the database
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 7. Generate Credentials PDF Blob
                var pdfBytes = _pdfService.GenerateCredentialsPdf(dto.UnitName, ward.WardNumber, pdfMembers);

                return File(pdfBytes, "application/pdf", $"{dto.UnitName.Replace(" ", "_")}_credentials.pdf");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Error saving unit to database.", details = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUnits()
        {
            try
            {
                var units = await _context.AyalkoottamUnits
                    .Include(u => u.Ward)
                    .Include(u => u.Users)
                        .ThenInclude(u => u.UserRole)
                    .OrderByDescending(u => u.CreatedDate)
                    .Select(u => new
                    {
                        id = u.UnitId,
                        name = u.UnitName,
                        ward = u.Ward != null ? $"Ward {u.Ward.WardNumber}, {u.Ward.WardName}" : string.Empty,
                        wardId = u.WardId,
                        accountNumber = u.AccountNumber,
                        bankName = u.BankName,
                        ifscCode = u.IFSCCode,
                        accountBalance = u.AccountBalance,
                        formationDate = u.CreatedDate.ToString("yyyy-MM-dd"),
                        contact = u.PrimaryContactPhone,
                        members = u.Users.Count,
                        status = u.IsActive ? "Active" : "Inactive",
                        lastAudit = "New Registration",
                        savings = (double)(u.AccountBalance / 100000.0m),
                        membersList = u.Users.Select(m => new
                        {
                            id = m.UserId,
                            name = m.FullName,
                            phone = m.PhoneNumber,
                            houseName = m.HouseName,
                            roleId = m.RoleId,
                            role = m.UserRole != null ? m.UserRole.RoleName : (m.RoleId == 2 ? "President" : m.RoleId == 3 ? "Secretary" : m.RoleId == 4 ? "Treasurer" : "Member")
                        })
                    })
                    .ToListAsync();
                return Ok(units);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving units list.", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUnitById(int id)
        {
            try
            {
                var unit = await _context.AyalkoottamUnits
                    .Include(u => u.Ward)
                    .Include(u => u.Users)
                        .ThenInclude(u => u.UserRole)
                    .FirstOrDefaultAsync(u => u.UnitId == id);

                if (unit == null)
                    return NotFound(new { message = "Ayalkoottam unit not found." });

                return Ok(new
                {
                    id = unit.UnitId,
                    name = unit.UnitName,
                    ward = unit.Ward != null ? $"Ward {unit.Ward.WardNumber}, {unit.Ward.WardName}" : string.Empty,
                    wardId = unit.WardId,
                    accountNumber = unit.AccountNumber,
                    bankName = unit.BankName,
                    ifscCode = unit.IFSCCode,
                    accountBalance = unit.AccountBalance,
                    formationDate = unit.CreatedDate.ToString("yyyy-MM-dd"),
                    contact = unit.PrimaryContactPhone,
                    members = unit.Users.Count,
                    status = unit.IsActive ? "Active" : "Inactive",
                    lastAudit = "New Registration",
                    savings = (double)(unit.AccountBalance / 100000.0m),
                    membersList = unit.Users.Select(m => new
                    {
                        id = m.UserId,
                        name = m.FullName,
                        phone = m.PhoneNumber,
                        houseName = m.HouseName,
                        roleId = m.RoleId,
                        role = m.UserRole != null ? m.UserRole.RoleName : (m.RoleId == 2 ? "President" : m.RoleId == 3 ? "Secretary" : m.RoleId == 4 ? "Treasurer" : "Member")
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving unit details.", details = ex.Message });
            }
        }

        [HttpPost("{id}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleStatusDto dto)
        {
            try
            {
                var unit = await _context.AyalkoottamUnits
                    .Include(u => u.Users)
                    .FirstOrDefaultAsync(u => u.UnitId == id);

                if (unit == null)
                {
                    return NotFound(new { message = "Ayalkoottam unit not found." });
                }

                unit.IsActive = dto.IsActive;

                // Cascade: activate or deactivate all members of this unit
                foreach (var member in unit.Users)
                {
                    member.IsActive = dto.IsActive;
                }

                await _context.SaveChangesAsync();

                var statusLabel = unit.IsActive ? "Active" : "Inactive";
                return Ok(new
                {
                    message = $"Unit and its {unit.Users.Count} member(s) updated to {statusLabel} successfully.",
                    unitId = id,
                    isActive = unit.IsActive,
                    membersUpdated = unit.Users.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating unit status.", details = ex.Message });
            }
        }
    }

    public class ToggleStatusDto
    {
        public bool IsActive { get; set; }
    }
}
