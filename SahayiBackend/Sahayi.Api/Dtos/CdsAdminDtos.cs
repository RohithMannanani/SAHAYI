using System.ComponentModel.DataAnnotations;

namespace Sahayi.Api.DTOs
{
    // Payload to create an Ayalkoottam Unit and onboard all initial members
    public class RegisterUnitDto
    {
        [Required]
        public string UnitName { get; set; } = string.Empty;

        [Required]
        public int WardId { get; set; }

        [Required]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        public string BankName { get; set; } = string.Empty;

        [Required]
        public string IFSCCode { get; set; } = string.Empty;

        public decimal AccountBalance { get; set; } = 0;

        // Default common password assigned to all unit members (e.g. Sahayi@123)
        public string DefaultPassword { get; set; } = "Sahayi@123";

        [Required]
        public List<InitialMemberDto> Members { get; set; } = new List<InitialMemberDto>();
    }

    // Individual Member detail inside the Unit Registration payload
    public class InitialMemberDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string HouseName { get; set; } = string.Empty;

        // RoleId: 2 = President, 3 = Secretary, 4 = Treasurer, 5 = Member
        [Required]
        public int RoleId { get; set; }
    }
}